import type { BiliupPreset } from "../../../types";

export const useConfirm = () => {
  const dialog = useDialog();
  return {
    warning: ({
      title,
      content,
      positiveText,
      negativeText,
    }: {
      title?: string;
      content: string;
      positiveText?: string;
      negativeText?: string;
    }) =>
      new Promise((reslove, reject) => {
        dialog.warning({
          title: title || "警告",
          content: content,
          positiveText: positiveText || "继续",
          negativeText: negativeText || "取消",
          onPositiveClick: () => {
            reslove(true);
          },
          onNegativeClick: () => {
            reject(false);
          },
          onClose: () => {
            reject(false);
          },
          onMaskClick: () => {
            reject(false);
          },
        });
      }),
  };
};

export const useBili = () => {
  const hasLogin = ref(false);
  const notice = useNotification();

  onMounted(async () => {
    const hasCookie = await window.api.bili.checkCookie();
    hasLogin.value = hasCookie;
  });

  // @ts-ignore
  const presetOptions: Ref<BiliupPreset> = ref({});
  const handlePresetOptions = (preset) => {
    presetOptions.value = preset;
  };

  const loginDialogVisible = ref(false);
  const loginStatus = ref<"start" | "success" | "fail">("start");

  const login = async () => {
    notice.info({
      title: `此为实验性功能，不为稳定性做出保证`,
      duration: 3000,
    });
    loginStatus.value = "start";
    loginDialogVisible.value = true;
    window.api.biliLogin();
    // 打开登录窗口;
    window.api.onBiliLoginClose((_event, code) => {
      console.log("window close", code);

      if (code == 0) {
        // 登录成功
        loginStatus.value = "success";
        hasLogin.value = true;
      } else {
        // 手动关闭窗口
        loginStatus.value = "fail";
      }
    });
  };

  return { hasLogin, handlePresetOptions, login, loginStatus, loginDialogVisible, presetOptions };
};
