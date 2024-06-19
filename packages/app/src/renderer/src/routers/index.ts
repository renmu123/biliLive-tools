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
      children: [
        {
          path: "upload",
          name: "Upload",
          component: () => import("../pages/Tools/components/FileUpload/index.vue"),
        },
        {
          path: "danmakufactory",
          name: "DanmakuFactory",
          component: () => import("../pages/Tools/components/DanmuFactory.vue"),
        },
        {
          path: "convert2mp4",
          name: "Convert2Mp4",
          component: () => import("../pages/Tools/components/File2Mp4.vue"),
        },
        {
          path: "videoMerge",
          name: "VideoMerge",
          component: () => import("../pages/Tools/components/VideoMerge.vue"),
        },
        {
          path: "biliDownload",
          name: "BiliDownload",
          component: () => import("../pages/Tools/components/VideoDownload.vue"),
        },
      ],
    },
    {
      path: "/queue",
      name: "Queue",
      component: () => import("../pages/Queue/index.vue"),
    },
    {
      path: "/user",
      name: "User",
      component: () => import("../pages/User/index.vue"),
    },
    {
      path: "/about",
      name: "About",
      component: () => import("../pages/About.vue"),
    },
  ],
});

export default router;
