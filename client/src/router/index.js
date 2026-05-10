import { createRouter, createWebHistory } from "vue-router";
import AuthPage from "../pages/AuthPage.vue";
import CheckinPage from "../pages/CheckinPage.vue";
import HomePage from "../pages/HomePage.vue";
import ExplorePage from "../pages/ExplorePage.vue";
import SocialPage from "../pages/SocialPage.vue";
import { fetchCurrentUser, hasToken } from "../services/auth";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/auth", name: "auth", component: AuthPage, meta: { public: true } },
  { path: "/home", name: "home", component: HomePage, meta: { public: true } },
  { path: "/checkin", name: "checkin", component: CheckinPage, meta: { requiresAuth: true } },
  { path: "/explore", name: "explore", component: ExplorePage, meta: { requiresAuth: true } },
  { path: "/social", name: "social", component: SocialPage, meta: { requiresAuth: true } },
  { path: "/profile", redirect: "/home" }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 110,
        behavior: "smooth"
      };
    }

    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  if (hasToken()) {
    const user = await fetchCurrentUser();

    if (to.path === "/auth") {
      return (to.query.redirect && typeof to.query.redirect === "string") ? to.query.redirect : "/home";
    }

    if (to.meta.requiresAuth && !user) {
      return {
        path: "/auth",
        query: { redirect: to.fullPath }
      };
    }

    return true;
  }

  if (to.meta.requiresAuth) {
    return {
      path: "/auth",
      query: { redirect: to.fullPath }
    };
  }

  return true;
});

export default router;
