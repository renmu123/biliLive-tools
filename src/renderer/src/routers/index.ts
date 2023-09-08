import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
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
      name: "Home",
      component: () => import("../pages/Home/index.vue"),
    },
    {
      path: "/tools",
      name: "Tools",
      component: () => import("../pages/Tools/index.vue"),
    },
    {
      path: "/about",
      name: "About",
      component: () => import("../pages/About.vue"),
    },
  ],
});

export default router;
