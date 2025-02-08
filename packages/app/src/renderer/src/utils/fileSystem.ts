import showDirectoryDialog from "@renderer/components/showDirectoryDialog";

export const showSaveDialog = async (options: {
  defaultPath?: string;
}): Promise<string | undefined> => {
  if (window.isWeb) {
    const filePath = (
      await showDirectoryDialog({
        type: "save",
        extension: "mp4",
      })
    )?.[0];
    return filePath;
  } else {
    const outputPath = await window.api.showSaveDialog({
      defaultPath: options.defaultPath,
      filters: [
        { name: "视频文件", extensions: ["mp4"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    });
    return outputPath;
  }
};
