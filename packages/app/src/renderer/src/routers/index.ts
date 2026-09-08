import { createRouter, createWebHashHistory } from "vue-router";

const appTitle = "biliLive-tools";

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
      meta: { title: "登录" },
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
          meta: {
            title: "压制",
          },
        },
        {
          path: "/dashboard",
          name: "Dashboard",
          component: () => import("../pages/Dashboard/index.vue"),
          meta: {
            title: "数据看板",
          },
        },
        {
          path: "/upload",
          name: "Upload",
          component: () => import("../pages/Tools/pages/FileUpload/index.vue"),
          meta: {
            title: "B站上传",
          },
        },
        {
          path: "/danmakufactory",
          name: "DanmakuFactory",
          component: () => import("../pages/Tools/pages/DanmuFactory.vue"),
          meta: {
            title: "弹幕转换",
          },
        },
        {
          path: "/convert2mp4",
          name: "Convert2Mp4",
          component: () => import("../pages/Tools/pages/Burn/index.vue"),
          meta: {
            title: "转码",
          },
        },
        {
          path: "/videoMerge",
          name: "VideoMerge",
          component: () => import("../pages/Tools/pages/VideoMerge.vue"),
          meta: {
            title: "视频合并",
          },
        },
        {
          path: "/flvRepair",
          name: "FlvRepair",
          component: () => import("../pages/Tools/pages/FlvRepair.vue"),
          meta: {
            title: "视频修复",
          },
        },
        {
          path: "/biliDownload",
          name: "BiliDownload",
          component: () => import("../pages/Tools/pages/Video/index.vue"),
          meta: {
            title: "视频下载",
          },
        },
        {
          path: "/recorder",
          name: "recorder",
          component: () => import("../pages/Tools/pages/Recorder/Index.vue"),
          meta: {
            title: "直播录制",
          },
        },
        {
          path: "/videoCut",
          name: "videoCut",
          component: () => import("../pages/Tools/pages/VideoCut/Index.vue"),
          meta: {
            title: "视频切片",
          },
        },
        {
          path: "/videoCut2",
          name: "videoCut2",
          component: () => import("../pages/Tools/pages/VideoCut/Index.vue"),
          meta: {
            title: "视频切片",
          },
        },
        {
          path: "/fileSync",
          name: "FileSync",
          component: () => import("../pages/Tools/pages/FileSync/index.vue"),
          meta: {
            title: "文件同步",
          },
        },
        {
          path: "/queue",
          name: "Queue",
          component: () => import("../pages/Queue/index.vue"),
          meta: {
            title: "任务队列",
          },
        },
        {
          path: "/user",
          name: "User",
          component: () => import("../pages/User/index.vue"),
          meta: {
            title: "用户",
          },
        },
        {
          path: "/about",
          name: "About",
          component: () => import("../pages/About.vue"),
          meta: {
            title: "关于",
          },
        },
        {
          path: "/liveHistory",
          name: "LiveHistory",
          component: () => import("../pages/LiveHistory/index.vue"),
          meta: { keepAlive: false, title: "直播记录" },
        },
        {
          path: "/streamerDetail",
          name: "streamerDetail",
          component: () => import("../pages/streamerDetail/index.vue"),
          meta: { keepAlive: false, title: "主播详情" },
        },
        {
          path: "/fileBrowser",
          name: "FileBrowser",
          component: () => import("../pages/FileBrowser/index.vue"),
          meta: { keepAlive: true, title: "文件浏览器" },
        },
        {
          path: "/videoPlayer",
          name: "VideoPlayer",
          component: () => import("../pages/VideoPlayer/index.vue"),
          meta: { keepAlive: false, title: "视频播放器" },
        },
        {
          path: "/liveVideoPlayer",
          name: "LiveVideoPlayer",
          component: () => import("../pages/LiveVideoPlayer/Index.vue"),
          meta: { keepAlive: false, title: "直播视频播放器" },
        },
      ],
    },
  ],
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title}` : appTitle;
});

export default router;
