import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";

const isWebUI = import.meta.env.MODE === "webui";

const router = createRouter({
  history: isWebUI ? createWebHashHistory() : createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("../pages/Login/index.vue"),
    },
    {
      path: "/",
      name: "Main",
      component: () => import("../pages/Main/index.vue"),
      children: [
        {
          path: "/home",
          name: "Home",
          component: () => import("../pages/Home/index.vue"),
        },
        {
          path: "/upload",
          name: "Upload",
          component: () => import("../pages/Tools/pages/FileUpload/index.vue"),
        },
        {
          path: "/danmakufactory",
          name: "DanmakuFactory",
          component: () => import("../pages/Tools/pages/DanmuFactory.vue"),
        },
        {
          path: "/convert2mp4",
          name: "Convert2Mp4",
          component: () => import("../pages/Tools/pages/File2Mp4.vue"),
        },
        {
          path: "/videoMerge",
          name: "VideoMerge",
          component: () => import("../pages/Tools/pages/VideoMerge.vue"),
        },
        {
          path: "/biliDownload",
          name: "BiliDownload",
          component: () => import("../pages/Tools/pages/VideoDownload.vue"),
        },
        {
          path: "/recorder",
          name: "recorder",
          component: () => import("../pages/Tools/pages/Recorder/Index.vue"),
        },
        {
          path: "/videoCut",
          name: "videoCut",
          component: () => import("../pages/Tools/pages/VideoCut/Index.vue"),
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
    },
  ],
});

export default router;
