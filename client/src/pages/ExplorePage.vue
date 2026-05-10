<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ExploreMap from "../components/ExploreMap.vue";
import AppShell from "../components/AppShell.vue";
import DataState from "../components/DataState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { ensureAmapPlugins } from "../services/amap";
import { getExplore } from "../services/api";

const { data, loading, error } = useAsyncData(getExplore);
const heroImage = new URL("../../image/5.jpg", import.meta.url).href;
const query = ref("");
const maxDistance = ref(2);
const activeType = ref("all");
const selectedPlaceId = ref(0);
const searchCenter = ref(null);
const searchedAddressLabel = ref("");
const searchSummary = ref("当前展示的是默认校园周边设施。");
const searchError = ref("");
const searchLoading = ref(false);
const livePlaces = ref([]);
const querySuggestions = ref([]);
const selectedSuggestion = ref(null);
let distanceSearchTimer = null;
let suggestionTimer = null;
let preserveSelectedSuggestion = false;
let suggestionsLocked = false;

const typeConfig = {
  gym: { keyword: "健身房", label: "健身房" },
  stadium: { keyword: "体育馆", label: "体育馆" },
  swim: { keyword: "游泳馆", label: "游泳馆" }
};

const filteredPlaces = computed(() => {
  if (!data.value) {
    return [];
  }

  const source = livePlaces.value.length ? livePlaces.value : data.value.places;

  return source.filter((place) => {
    const matchType = activeType.value === "all" || place.type === activeType.value;
    const matchDistance = place.distanceKm <= maxDistance.value;
    return matchType && matchDistance;
  });
});

const currentMapData = computed(() => {
  if (!data.value) {
    return null;
  }

  return {
    ...data.value.map,
    center: searchCenter.value || data.value.map.center
  };
});

function selectPlace(place) {
  selectedPlaceId.value = place.id;
}

function navigateToPlace(place) {
  const url = `https://uri.amap.com/navigation?to=${place.position[0]},${place.position[1]},${encodeURIComponent(place.name)}&mode=walk`;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function searchNearbyFacilities(center, label) {
  const AMap = await ensureAmapPlugins(["AMap.PlaceSearch"]);
  const selectedTypes = activeType.value === "all" ? Object.keys(typeConfig) : [activeType.value];

  const results = [];

  for (const type of selectedTypes) {
    const placeSearch = new AMap.PlaceSearch({
      pageSize: 8,
      pageIndex: 1
    });

    const places = await new Promise((resolve) => {
      placeSearch.searchNearBy(typeConfig[type].keyword, center, maxDistance.value * 1000, (_status, result) => {
        const pois = result?.poiList?.pois || [];
        resolve(
          pois.map((poi, index) => ({
            id: Number(`${Date.now()}${index}`),
            name: poi.name,
            type,
            typeLabel: typeConfig[type].label,
            distanceKm: Number(((poi.distance || 0) / 1000).toFixed(1)),
            address: poi.address || poi.name,
            features: poi.type || "周边运动设施",
            position: [poi.location.lng, poi.location.lat]
          }))
        );
      });
    });

    results.push(...places);
  }

  livePlaces.value = results;
  selectedPlaceId.value = 0;
  searchedAddressLabel.value = label;
  searchSummary.value = `${label} 周边 ${maxDistance.value.toFixed(1)} km 内的运动设施`;
}

async function performNearbySearch(label) {
  searchLoading.value = true;
  searchError.value = "";

  try {
    await searchNearbyFacilities(searchCenter.value, label);
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : "重新搜索失败";
  } finally {
    searchLoading.value = false;
  }
}

function queueDistanceSearch(event) {
  maxDistance.value = Number(event.target.value);

  if (!searchCenter.value) {
    return;
  }

  if (distanceSearchTimer) {
    clearTimeout(distanceSearchTimer);
  }

  distanceSearchTimer = setTimeout(async () => {
    await performNearbySearch(query.value.trim() || "当前位置");
  }, 120);
}

async function updateAddressSuggestions() {
  const keyword = query.value.trim();

  if (!keyword || keyword === "当前位置") {
    querySuggestions.value = [];
    selectedSuggestion.value = null;
    return;
  }

  try {
    const AMap = await ensureAmapPlugins(["AMap.AutoComplete"]);
    const autoComplete = new AMap.AutoComplete({
      citylimit: false
    });

    const tips = await new Promise((resolve) => {
      autoComplete.search(keyword, (_status, result) => {
        resolve(result?.tips || []);
      });
    });

    querySuggestions.value = tips
      .filter((tip) => tip.name)
      .slice(0, 6)
      .map((tip, index) => ({
        id: `${tip.id || tip.name}-${index}`,
        name: tip.name,
        district: tip.district || "",
        address: tip.address || "",
        location: tip.location ? [tip.location.lng, tip.location.lat] : null
      }));
  } catch {
    querySuggestions.value = [];
  }
}

function selectSuggestion(suggestion) {
  preserveSelectedSuggestion = true;
  suggestionsLocked = true;
  const detail = [suggestion.district, suggestion.address].filter(Boolean).join(" ");
  query.value = detail ? `${suggestion.name} ${detail}` : suggestion.name;
  selectedSuggestion.value = suggestion;
  querySuggestions.value = [];
  handleAddressSearch();
}

function handleQueryTyping() {
  suggestionsLocked = false;
}

async function handleAddressSearch() {
  if (!query.value.trim()) {
    livePlaces.value = [];
    searchCenter.value = null;
    searchedAddressLabel.value = "";
    searchSummary.value = "当前展示的是默认校园周边设施。";
    return;
  }

  searchLoading.value = true;
  searchError.value = "";

  try {
    let location = selectedSuggestion.value?.location || null;

    if (!location) {
      const AMap = await ensureAmapPlugins(["AMap.Geocoder"]);
      const geocoder = new AMap.Geocoder();

      location = await new Promise((resolve, reject) => {
        geocoder.getLocation(query.value.trim(), (status, result) => {
          const geocodes = result?.geocodes || [];
          if (status === "complete" && geocodes.length) {
            resolve([geocodes[0].location.lng, geocodes[0].location.lat]);
            return;
          }
          reject(new Error("没有找到这个地址，请换一个学校或地点试试。"));
        });
      });
    }

    searchCenter.value = location;
    querySuggestions.value = [];
    await searchNearbyFacilities(searchCenter.value, selectedSuggestion.value?.name || query.value.trim());
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : "搜索失败";
  } finally {
    searchLoading.value = false;
  }
}

async function locateCurrentPosition() {
  searchLoading.value = true;
  searchError.value = "";

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (result) => resolve([result.coords.longitude, result.coords.latitude]),
        () => reject(new Error("无法获取当前位置，请检查浏览器定位权限。")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    searchCenter.value = position;
    query.value = "当前位置";
    selectedSuggestion.value = null;
    querySuggestions.value = [];
    await searchNearbyFacilities(position, "当前位置");
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : "定位失败";
  } finally {
    searchLoading.value = false;
  }
}

watch(query, () => {
  if (suggestionsLocked) {
    querySuggestions.value = [];
    return;
  }

  if (preserveSelectedSuggestion) {
    preserveSelectedSuggestion = false;
  } else {
    selectedSuggestion.value = null;
  }

  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }

  suggestionTimer = setTimeout(() => {
    updateAddressSuggestions();
  }, 180);
});

watch([activeType, maxDistance], async () => {
  if (!searchCenter.value) {
    return;
  }

  if (distanceSearchTimer) {
    clearTimeout(distanceSearchTimer);
    distanceSearchTimer = null;
  }

  await performNearbySearch(searchedAddressLabel.value || query.value.trim() || "当前位置");
});

onBeforeUnmount(() => {
  if (distanceSearchTimer) {
    clearTimeout(distanceSearchTimer);
  }

  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }
});
</script>

<template>
  <AppShell title="地图" subtitle="降低运动开始门槛，用路线和地点推荐把人带出去。" :hide-page-hero="true" :full-bleed="true">
    <DataState :loading="loading" :error="error">
      <div class="explore-page-flow">
        <section class="checkin-hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(67, 54, 44, 0.54) 0%, rgba(67, 54, 44, 0.3) 34%, rgba(67, 54, 44, 0.1) 72%), url(${heroImage})` }">
          <div class="home-hero-overlay"></div>
          <div class="checkin-hero-copy">
            <p class="home-kicker">地图探索</p>
            <h1 class="home-display">
              找到附近的健身房、
              <br />
              体育馆和游泳馆，
              <br />
              立刻开始运动
            </h1>
            <p class="home-support">{{ data.hero.description }}</p>
          </div>
        </section>

        <section class="explore-content">
          <section class="explore-map-card">
            <ExploreMap
              :map-data="currentMapData"
              :places="filteredPlaces"
              :selected-place-id="selectedPlaceId"
              :search-radius-km="maxDistance"
            />

            <aside class="explore-overlay card">
              <p class="eyebrow">搜索与筛选</p>
              <label class="planner-row">
                <span>搜索地址</span>
                <div class="explore-search-box">
                  <input v-model="query" type="text" placeholder="搜索学校、校区或具体地址" @input="handleQueryTyping" />
                  <div v-if="querySuggestions.length" class="explore-suggestions">
                    <button
                      v-for="suggestion in querySuggestions"
                      :key="suggestion.id"
                      type="button"
                      class="explore-suggestion-item"
                      @click="selectSuggestion(suggestion)"
                    >
                      <strong>{{ suggestion.name }}</strong>
                      <span>{{ [suggestion.district, suggestion.address].filter(Boolean).join(" ") || "推荐定位结果" }}</span>
                    </button>
                  </div>
                </div>
              </label>

              <div class="button-row">
                <button class="primary-button explore-action-button" :disabled="searchLoading" @click="handleAddressSearch">
                  {{ searchLoading ? "搜索中..." : "搜索这个地址" }}
                </button>
                <button class="ghost-button explore-action-button" :disabled="searchLoading" @click="locateCurrentPosition">
                  定位当前位置
                </button>
              </div>

              <div class="planner-row">
                <span>距离范围：{{ maxDistance.toFixed(1) }} km</span>
                <input
                  :value="maxDistance"
                  type="range"
                  :min="data.filters.minDistance"
                  :max="data.filters.maxDistance"
                  step="0.1"
                  @input="queueDistanceSearch"
                />
              </div>

              <div class="explore-filter-tabs">
                <button class="ghost-button" :class="{ active: activeType === 'all' }" @click="activeType = 'all'">全部</button>
                <button class="ghost-button" :class="{ active: activeType === 'gym' }" @click="activeType = 'gym'">健身房</button>
                <button class="ghost-button" :class="{ active: activeType === 'stadium' }" @click="activeType = 'stadium'">体育馆</button>
                <button class="ghost-button" :class="{ active: activeType === 'swim' }" @click="activeType = 'swim'">游泳馆</button>
              </div>

              <p class="home-summary-text">{{ searchSummary }}</p>
              <p v-if="searchError" class="form-error">{{ searchError }}</p>

              <div class="explore-places-list">
                <article
                  v-for="place in filteredPlaces"
                  :key="place.id"
                  class="explore-place-card"
                  :class="{ selected: selectedPlaceId === place.id }"
                  @click="selectPlace(place)"
                >
                  <div class="section-heading compact">
                    <strong>{{ place.name }}</strong>
                    <span class="tag">{{ place.typeLabel }}</span>
                  </div>
                  <p>{{ place.address }}</p>
                  <p>{{ place.distanceKm }} km · {{ place.features }}</p>
                  <button class="primary-button explore-nav-button" @click.stop="navigateToPlace(place)">开启导航</button>
                </article>
              </div>
            </aside>
          </section>
        </section>
      </div>
    </DataState>
  </AppShell>
</template>
