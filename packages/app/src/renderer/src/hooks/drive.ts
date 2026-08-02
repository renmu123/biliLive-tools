import { driver } from "driver.js";
import { useStorage } from "@vueuse/core";
import { nextTick } from "vue";
import "driver.js/dist/driver.css";

type HomeTab = "common-setting" | "danmukufactory-setting" | "ffmpeg-setting";

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

  const homeDrive = (changeTab: (tab: HomeTab) => void) => {
    const moveToNextStep = (tab?: HomeTab) => {
      if (tab) changeTab(tab);
      nextTick(() => driverObj.moveNext());
    };
    const moveToPreviousStep = (tab?: HomeTab) => {
      if (tab) changeTab(tab);
      nextTick(() => driverObj.movePrevious());
    };
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      onNextClick: () => {
        const activeIndex = driverObj.getActiveIndex();
        if (activeIndex === 0) {
          moveToNextStep("danmukufactory-setting");
          return;
        }
        if (activeIndex === 1) {
          moveToNextStep("ffmpeg-setting");
          return;
        }
        moveToNextStep();
      },
      onPrevClick: () => {
        const activeIndex = driverObj.getActiveIndex();
        if (activeIndex === 1) {
          moveToPreviousStep("common-setting");
          return;
        }
        if (activeIndex === 2) {
          moveToPreviousStep("danmukufactory-setting");
          return;
        }
        moveToPreviousStep();
      },
      steps: [
        {
          element: ".home-file-area",
          popover: {
            title: "选择文件",
            description: "请选择一个视频文件和一个 XML 或 ASS 弹幕文件。XML 弹幕会自动转换为 ASS。",
          },
        },
        {
          element: ".home-danmu-setting",
          popover: {
            title: "弹幕设置",
            description:
              "重点关注文字大小、文字不透明度和分辨率。建议开启“自适应视频分辨率”，让弹幕与视频尺寸保持一致。",
          },
        },
        {
          element: ".home-ffmpeg-setting",
          popover: {
            title: "FFmpeg 设置",
            description:
              "你可以根据你的硬件来选择对应的硬件编码来加速，整个应用中你可以将鼠标移至？图标上查看每个选项的详细说明。",
          },
        },
      ],
    });

    driverObj.drive();
  };

  return { videoCutDrive, homeDrive };
};
