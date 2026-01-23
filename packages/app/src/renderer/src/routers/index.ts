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
      path: "/login",
      name: "Login",
      component: () => import("../pages/Login/index.vue"),
    },
    {
      path: "/",
      name: "Main",
      component: () => import("../pages/Main/index.vue"),
      redirect: "/home",
      children: [
        {
          path: "/home",
          name: "Home",
          component: () => import("../pages/Home/index.vue"),
        },
        {
          path: "/dashboard",
          name: "Dashboard",
          component: () => import("../pages/Dashboard/index.vue"),
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
          component: () => import("../pages/Tools/pages/Burn/index.vue"),
        },
        {
          path: "/videoMerge",
          name: "VideoMerge",
          component: () => import("../pages/Tools/pages/VideoMerge.vue"),
        },
        {
          path: "/flvRepair",
          name: "FlvRepair",
          component: () => import("../pages/Tools/pages/FlvRepair.vue"),
        },
        {
          path: "/biliDownload",
          name: "BiliDownload",
          component: () => import("../pages/Tools/pages/Video/index.vue"),
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
          path: "/videoCut2",
          name: "videoCut2",
          component: () => import("../pages/Tools/pages/VideoCut/Index.vue"),
        },
        {
          path: "/fileSync",
          name: "FileSync",
          component: () => import("../pages/Tools/pages/FileSync/index.vue"),
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
          path: "/agent",
          name: "Agent",
          component: () => import("../pages/Agent/index.vue"),
        },
        {
          path: "/about",
          name: "About",
          component: () => import("../pages/About.vue"),
        },
        {
          path: "/liveHistory",
          name: "LiveHistory",
          component: () => import("../pages/LiveHistory/index.vue"),
          meta: { keepAlive: false },
        },
      ],
    },
  ],
});

export default router;
