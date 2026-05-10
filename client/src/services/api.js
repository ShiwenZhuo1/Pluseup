import { authState, clearSession } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authState.token ? { Authorization: `Bearer ${authState.token}` } : {}
  });

  if (response.status === 401) {
    clearSession();
    throw new Error("登录状态已失效，请重新登录");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

async function sendJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authState.token ? { Authorization: `Bearer ${authState.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    throw new Error("请先登录后再保存计划");
  }

  if (!response.ok) {
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}

export function getDashboard() {
  return fetchJson("/home");
}

export function getExplore() {
  return fetchJson("/explore");
}

export function getCheckin() {
  return fetchJson("/checkin");
}

export function getPlanRecommendation(payload) {
  return sendJson("/plans/recommendation", { body: payload });
}

export function createPlan(payload) {
  return sendJson("/plans", { body: payload });
}

export function completeTask(taskId) {
  return sendJson(`/tasks/${taskId}/complete`, {});
}

export function getSocial() {
  return fetchJson("/social");
}

export function createSocialPost(payload) {
  return sendJson("/social/posts", { body: payload });
}

export function toggleSocialPostLike(postId) {
  return sendJson(`/social/posts/${postId}/like`, {});
}

export function createSocialReply(postId, payload) {
  return sendJson(`/social/posts/${postId}/replies`, { body: payload });
}

export function getProfile() {
  return fetchJson("/profile");
}
