import { driver } from "driver.js";
import { useStorage } from "@vueuse/core";
import "driver.js/dist/driver.css";

export const useDrive = () => {
  const state = useStorage("drive-store", { videoCut: false }, localStorage, {
    mergeDefaults: true,
  });

  const videoCutDrive = () => {
    if (state.value.videoCut) return;
    const driverObj = driver({
      showProgress: true,
      allowClose: false,
      onNextClick: (element: any) => {
        console.log("onNextClick", element);
        driverObj.moveNext();
      },
      steps: [
        {
          element: ".cut-file-area",
          popover: { title: "导入视频", description: "你可以点击添加视频文件" },
        },
        {
          element: ".cut-add-segment",
          popover: { title: "添加片段", description: "在当前时间添加一个片段" },
        },
        {
          element: ".cut-video",
          popover: { title: "预览视频", description: "前进后退视频，在需要的地方切下" },
        },
        {
          element: ".cut-set-end",
          popover: { title: "设置结束时间", description: "设置片段的结束时间" },
        },
        {
          element: ".cut-search-danmu",
          popover: { title: "弹幕搜索", description: "点击后查询弹幕，快速添加片段" },
        },
        {
          element: ".cut-export",
          popover: { title: "导出", description: "所有片段处理完毕后，点击导出" },
        },
      ],
      onDestroyed: () => {
        state.value.videoCut = true;
      },
    });

    driverObj.drive();
  };
  return { videoCutDrive };
};
