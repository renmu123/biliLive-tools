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
        });
      }),
  };
};
