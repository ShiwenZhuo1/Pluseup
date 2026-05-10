import { reactive } from "vue";

const API_BASE = "http://localhost:3001/api";
const TOKEN_KEY = "dongci_token";
const USER_KEY = "dongci_user";

const savedToken = localStorage.getItem(TOKEN_KEY) || "";
const savedUser = localStorage.getItem(USER_KEY);

export const authState = reactive({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null
});

function persistSession(token, user) {
  authState.token = token;
  authState.user = user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  authState.token = "";
  authState.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authState.token ? { Authorization: `Bearer ${authState.token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

export async function register(payload) {
  const data = await postJson("/auth/register", payload);
  persistSession(data.token, data.user);
  return data.user;
}

export async function login(payload) {
  const data = await postJson("/auth/login", payload);
  persistSession(data.token, data.user);
  return data.user;
}

export async function fetchCurrentUser() {
  if (!authState.token) {
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${authState.token}`
    }
  });

  if (response.status === 401) {
    clearSession();
    return null;
  }

  const data = await response.json();
  persistSession(authState.token, data.user);
  return data.user;
}

export async function logout() {
  if (authState.token) {
    await postJson("/auth/logout", {});
  }
  clearSession();
}

export function hasToken() {
  return Boolean(authState.token);
}
