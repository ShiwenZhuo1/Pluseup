<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { login, register } from "../services/auth";

const router = useRouter();
const route = useRoute();
const mode = ref("login");
const submitting = ref(false);
const error = ref("");

const form = ref({
  name: "",
  email: "",
  password: "",
  fitnessGoal: "建立长期习惯"
});

async function submit() {
  submitting.value = true;
  error.value = "";

  try {
    if (mode.value === "login") {
      await login({
        email: form.value.email,
        password: form.value.password
      });
    } else {
      await register({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        fitnessGoal: form.value.fitnessGoal
      });
    }

    const redirectTarget = typeof route.query.redirect === "string" ? route.query.redirect : "/home";
    router.push(redirectTarget);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "操作失败";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="hero-card auth-hero">
      <p class="eyebrow">动次</p>
      <h1>让大学生愿意每天打开的运动成长社区</h1>
      <p class="lead">
        从打卡、地图运动、AI 建议到社交搭子，围绕“每日成长循环”建立长期习惯。
      </p>

      <div class="pill-row">
        <span class="pill">打卡养成</span>
        <span class="pill">地图运动</span>
        <span class="pill">AI 建议</span>
        <span class="pill">社交搭子</span>
      </div>
    </section>

    <section class="hero-card auth-form-card">
      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button class="auth-tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label v-if="mode === 'register'" class="auth-field">
          <span>昵称</span>
          <input v-model="form.name" type="text" placeholder="输入你的昵称" required />
        </label>

        <label class="auth-field">
          <span>邮箱</span>
          <input v-model="form.email" type="email" placeholder="example@university.edu" required />
        </label>

        <label class="auth-field">
          <span>密码</span>
          <input v-model="form.password" type="password" placeholder="至少 6 位" minlength="6" required />
        </label>

        <label v-if="mode === 'register'" class="auth-field">
          <span>运动目标</span>
          <select v-model="form.fitnessGoal">
            <option>建立长期习惯</option>
            <option>减脂</option>
            <option>健康</option>
            <option>增肌</option>
            <option>缓解压力</option>
          </select>
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button class="primary-button auth-submit" :disabled="submitting">
          {{ submitting ? "处理中..." : mode === "login" ? "进入动次" : "创建账号" }}
        </button>
      </form>
    </section>
  </div>
</template>
