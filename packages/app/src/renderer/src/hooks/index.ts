import type { BiliupPreset } from "../../../types";
import { NCheckbox, NButton } from "naive-ui";

export const useConfirm = () => {
  const dialog = useDialog();
  return {
    warning: ({
      title,
      content,
      positiveText,
      negativeText,
      notShowAgain,
      key,
    }: {
      title?: string;
      content: string;
      positiveText?: string;
      negativeText?: string;
      notShowAgain?: boolean;
      key?: string;
    }) =>
      new Promise((reslove) => {
        const data = JSON.parse(localStorage.getItem("notShowAgain") || "{}");
        if (key && data[key] === true) return reslove(true);

        const hasChecked = ref(false);
        const d = dialog.warning({
          title: title || "警告",
          content: content,
          action: () => {
            let checkbox = h("div");
            if (notShowAgain) {
              checkbox = h(
                NCheckbox,
                {
                  // @ts-ignore
                  checked: hasChecked,
                  "onUpdate:checked": (value: boolean) => {
                    hasChecked.value = value;
                  },
                },
                "不再提示",
              );
            }
            const btns = h(
              "div",
              {
                style: {
                  display: "inline-flex",
                  gap: "10px",
                },
              },
              [
                h(
                  NButton,
                  {
                    onClick: () => {
                      d.destroy();
                      reslove(false);
                    },
                  },
                  negativeText || "取消",
                ),
                h(
                  NButton,
                  {
                    type: "primary",
                    onClick: () => {
                      if (key && hasChecked.value) {
                        data[key] = true;
                        localStorage.setItem("notShowAgain", JSON.stringify(data));
                      }
                      d.destroy();
                      reslove(true);
                    },
                  },
                  positiveText || "继续",
                ),
              ],
            );
            return h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                },
              },
              [checkbox, btns],
            );
          },
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
