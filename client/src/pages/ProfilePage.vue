<script setup>
import AppShell from "../components/AppShell.vue";
import DataState from "../components/DataState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { getProfile } from "../services/api";

const { data, loading, error } = useAsyncData(getProfile);
</script>

<template>
  <AppShell title="我的" subtitle="成长沉淀、成就展示和个人设定都在这里。">
    <DataState :loading="loading" :error="error">
      <div class="page-grid">
        <section class="card">
          <p class="eyebrow">等级称号</p>
          <h2>{{ data.identity.level }}</h2>
          <p>{{ data.identity.title }}</p>
          <p>{{ data.identity.name }} · {{ data.identity.email }}</p>
        </section>

        <section class="card">
          <h2>成长数据</h2>
          <div v-for="item in data.stats" :key="item.label" class="list-row compact">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section class="card">
          <h2>成就徽章</h2>
          <div v-for="badge in data.badges" :key="badge.name" class="list-row">
            <div>
              <strong>{{ badge.name }}</strong>
              <p>{{ badge.description }}</p>
            </div>
            <span class="tag">{{ badge.status }}</span>
          </div>
        </section>

        <section class="card">
          <h2>个性设置</h2>
          <div v-for="setting in data.settings" :key="setting.label" class="list-row compact">
            <span>{{ setting.label }}</span>
            <strong>{{ setting.value }}</strong>
          </div>
        </section>

        <section class="card">
          <h2>称号与同步</h2>
          <div class="pill-row">
            <span v-for="title in data.titles" :key="title" class="pill">{{ title }}</span>
          </div>
          <div class="pill-row profile-sync">
            <span v-for="source in data.sync" :key="source" class="pill">{{ source }}</span>
          </div>
        </section>
      </div>
    </DataState>
  </AppShell>
</template>
