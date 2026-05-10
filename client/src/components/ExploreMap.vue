<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { loadAmap } from "../services/amap";

const props = defineProps({
  mapData: {
    type: Object,
    default: null
  },
  places: {
    type: Array,
    default: () => []
  },
  selectedPlaceId: {
    type: Number,
    default: 0
  },
  searchRadiusKm: {
    type: Number,
    default: 0
  }
});

const mapRoot = ref(null);
const mapError = ref("");

let mapInstance = null;
let markers = [];
let infoWindow = null;
let searchCircle = null;

const markerColors = {
  gym: "#ff7a18",
  stadium: "#2f80ed",
  swim: "#34a853"
};

async function renderMap() {
  if (!mapRoot.value || !props.mapData) {
    return;
  }

  try {
    const AMap = await loadAmap();

    if (mapInstance) {
      mapInstance.destroy();
      mapInstance = null;
    }

    mapInstance = new AMap.Map(mapRoot.value, {
      zoom: props.mapData.zoom || 15,
      center: props.mapData.center,
      viewMode: "3D"
    });

    if (props.searchRadiusKm > 0) {
      searchCircle = new AMap.Circle({
        center: props.mapData.center,
        radius: props.searchRadiusKm * 1000,
        strokeColor: "#ff7a18",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#ffb347",
        fillOpacity: 0.12
      });
      mapInstance.add(searchCircle);
    }

    markers = props.places.map((marker) => {
      const pointMarker = new AMap.Marker({
        position: marker.position,
        title: marker.name,
        icon: new AMap.Icon({
          size: new AMap.Size(24, 24),
          image:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <circle cx="12" cy="12" r="10" fill="${markerColors[marker.type] || "#ff7a18"}" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>
            `)
        }),
        label: {
          direction: "top",
          content: `<div class="amap-marker-label">${marker.name}</div>`
        }
      });

      pointMarker.on("click", () => {
        if (infoWindow) {
          infoWindow.close();
        }

        infoWindow = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -24),
          content: `
            <div style="padding: 6px 8px; min-width: 140px;">
              <strong>${marker.name}</strong>
              <div style="margin-top: 4px; color: #5f6f86;">${marker.typeLabel} · ${marker.features}</div>
            </div>
          `
        });
        infoWindow.open(mapInstance, marker.position);
      });

      return pointMarker;
    });

    mapInstance.add(markers);
    mapInstance.setFitView();
    mapError.value = "";
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : "Failed to initialize AMap.";
  }
}

watch(
  () => props.mapData,
  () => {
    renderMap();
  }
);

watch(
  () => props.places,
  () => {
    renderMap();
  },
  { deep: true }
);

watch(
  () => props.selectedPlaceId,
  () => {
    if (!mapInstance || !props.selectedPlaceId) {
      return;
    }

    const selected = props.places.find((place) => place.id === props.selectedPlaceId);
    if (selected) {
      mapInstance.setCenter(selected.position);
      mapInstance.setZoom(16);
    }
  }
);

watch(
  () => [props.searchRadiusKm, props.mapData?.center],
  () => {
    renderMap();
  },
  { deep: true }
);

onMounted(() => {
  renderMap();
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy();
  }
});
</script>

<template>
  <div>
    <div v-if="mapError" class="state-card error">{{ mapError }}</div>
    <div ref="mapRoot" class="live-map" :class="{ 'is-hidden': mapError }"></div>
  </div>
</template>
