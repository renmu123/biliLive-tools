import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory("/"),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../pages/Home.vue"),
    },
    {
      path: "/tools",
      name: "tools",
      component: () => import("../pages/Tools/index.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../pages/About.vue"),
    },
  ],
});

export default router;
