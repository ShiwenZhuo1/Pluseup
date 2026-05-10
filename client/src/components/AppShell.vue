<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authState, hasToken, logout } from "../services/auth";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  hidePageHero: { type: Boolean, default: false },
  fullBleed: { type: Boolean, default: false }
});

const route = useRoute();
const router = useRouter();

const navItems = computed(() => [
  { label: "首页", path: "/home" },
  { label: "打卡", path: "/checkin" },
  { label: "地图", path: "/explore" },
  { label: "社区", path: "/social" }
]);

async function handleLogout() {
  await logout();
  router.push("/home");
}
</script>

<template>
  <div class="app-shell" :class="{ 'full-bleed-shell': fullBleed }">
    <header class="top-nav" :class="{ 'top-nav-overlay': fullBleed }">
      <div class="top-nav-inner">
        <router-link to="/home" class="brand-mark">动次</router-link>
        <nav class="nav-links">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: route.path === item.path }"
          >
            {{ item.label }}
          </router-link>
        </nav>
        <div class="nav-actions">
          <p v-if="authState.user && !fullBleed" class="user-meta">{{ authState.user.name }}</p>
          <router-link v-if="!hasToken()" to="/auth" class="primary-button nav-login">登录</router-link>
          <button v-else class="ghost-button" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </header>

    <section v-if="!hidePageHero" class="page-hero card">
      <p class="eyebrow">动次</p>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <p v-if="authState.user" class="user-meta">
        {{ authState.user.name }} · {{ authState.user.email }}
      </p>
      <p v-else class="user-meta">游客可以直接浏览，登录后再解锁个性化成长数据。</p>
    </section>

    <main class="content">
      <slot />
    </main>
  </div>
</template>
