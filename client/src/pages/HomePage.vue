<script setup>
import AppShell from "../components/AppShell.vue";
import DataState from "../components/DataState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { getDashboard } from "../services/api";

const { data, loading, error } = useAsyncData(getDashboard);
const heroImage = new URL("../../image/1.jpg", import.meta.url).href;
</script>

<template>
  <AppShell
    title="首页"
    subtitle="围绕每日打开率设计的成长闭环，从这里开始。"
    :hide-page-hero="true"
    :full-bleed="true"
  >
    <DataState :loading="loading" :error="error">
      <div class="home-landing full-bleed-home">
        <section class="home-hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(83, 59, 44, 0.56) 0%, rgba(83, 59, 44, 0.34) 32%, rgba(83, 59, 44, 0.06) 68%), url(${heroImage})` }">
          <div class="home-hero-overlay"></div>
          <div class="home-hero-copy">
            <p class="home-kicker">每日成长循环</p>
            <h1 class="home-display">
              让运动成长
              <br />
              变成每天都想打开的
              <br />
              校园习惯系统
            </h1>
            <p class="home-support">
              {{ data.ai.message }}
            </p>
            <div class="home-hero-actions">
              <router-link to="/checkin" class="home-cta">进入今日打卡</router-link>
              <div class="home-mini-note">
                <strong>{{ data.growth.title }} · {{ data.growth.level }}</strong>
                <span>🔥 {{ data.growth.streak }} · {{ data.growth.xp }}</span>
              </div>
            </div>
          </div>
          <div class="home-floating-panel">
            <router-link to="/checkin#current-plan" class="home-panel-block home-panel-link">
              <span class="home-panel-label">今日目标</span>
              <strong>{{ data.goals.completed }}/{{ data.goals.total }} 完成</strong>
              <p>{{ data.goals.items[0].name }} · {{ data.goals.items[0].progress }}</p>
            </router-link>
            <router-link to="/checkin#current-plan" class="home-panel-block home-panel-link">
              <span class="home-panel-label">快速开始</span>
              <strong>{{ data.quickStart.target }}</strong>
              <p>{{ data.quickStart.route }}</p>
            </router-link>
            <router-link to="/social#ranking-section" class="home-panel-block home-panel-link">
              <span class="home-panel-label">排行榜预览</span>
              <strong>#{{ data.ranking[0].rank }} {{ data.rankingMeta?.topName || data.ranking[0].name }}</strong>
              <p>
                {{ data.rankingMeta?.yourRank ? `你当前第 ${data.rankingMeta.yourRank} 名 · ${data.rankingMeta.yourScore}` : `你当前：${data.rankingMeta?.yourScore || data.ranking[1]?.score}` }}
              </p>
            </router-link>
          </div>
        </section>
      </div>
    </DataState>
  </AppShell>
</template>
