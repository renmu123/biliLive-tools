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
      new Promise((reslove) => {
        dialog.warning({
          title: title || "警告",
          content: content,
          positiveText: positiveText || "继续",
          negativeText: negativeText || "取消",
          onPositiveClick: () => {
            reslove(true);
          },
          onNegativeClick: () => {
            reslove(false);
          },
          onClose: () => {
            reslove(false);
          },
          onMaskClick: () => {
            reslove(false);
          },
        });
      }),
  };
};

export const useBili = () => {
  // @ts-ignore
  const presetOptions: Ref<BiliupPreset> = ref({});
  const handlePresetOptions = (preset: BiliupPreset) => {
    presetOptions.value = preset;
  };

  return { handlePresetOptions, presetOptions };
};
