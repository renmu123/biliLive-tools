import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "biliLive-tools",
  description: "biliLive-tools,一站式直播录制与处理工具,xml弹幕处理,斗鱼,虎牙,B站,抖音,录播姬",
  lastUpdated: true,
  ignoreDeadLinks: true,
  lang: "zh-CN",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "指南", link: "/guide/introduction" },
      { text: "功能", link: "/features/live-record" },
      { text: "API", link: "/api/recorder" },
    ],

    sidebar: {
      "/api/": [
        {
          text: "API",
          items: [{ text: "录制", link: "/api/recorder" }],
        },
      ],
      "/": [
        {
          text: "指南",
          items: [
            { text: "介绍", link: "/guide/introduction" },
            { text: "安装", link: "/guide/installation" },
          ],
        },
        {
          text: "功能",
          items: [
            { text: "直播录制", link: "/features/live-record" },
            { text: "Webhook", link: "/features/webhook" },
            { text: "ffmpeg配置", link: "/features/ffmpeg" },
            { text: "B站上传", link: "/features/bilibili-upload" },
            { text: "XML弹幕转换", link: "/features/danmaku-convert" },
            { text: "视频切片", link: "/features/video-clip" },
            { text: "文件同步", link: "/features/file-sync" },
            { text: "虚拟录制", link: "/features/virtual-record" },
            { text: "通知", link: "/features/notification" },
          ],
        },
        {
          text: "常见问题",
          items: [{ text: "FAQ", link: "/faq" }],
        },
        {
          text: "开发",
          items: [
            { text: "开发指南", link: "/development/guide" },
            { text: "贡献指南", link: "/development/contributing" },
          ],
        },
      ],
    },
    outline: 2,

    socialLinks: [{ icon: "github", link: "https://github.com/renmu123/biliLive-tools" }],

    footer: {
      message: "Released under the GPLv3 License.",
      copyright: "Copyright © 2024-present renmu123",
    },

    search: {
      provider: "local",
    },
  },
});
