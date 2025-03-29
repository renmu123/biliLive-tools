import showDialog from "@renderer/components/showDirectoryDialog";

export const showSaveDialog = async (options: {
  defaultPath?: string;
}): Promise<string | undefined> => {
  if (window.isWeb) {
    const filePath = (
      await showDialog({
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

export const showDirectoryDialog = async (options: {
  defaultPath?: string;
}): Promise<string | undefined> => {
  if (window.isWeb) {
    const filePath = (
      await showDialog({
        type: "directory",
      })
    )?.[0];
    return filePath;
  } else {
    const file = await window.api.openDirectory({
      defaultPath: options.defaultPath,
    });
    return file;
  }
};

export const showFileDialog = async (options: { defaultPath?: string }) => {
  if (window.isWeb) {
    const filePath = (
      await showDialog({
        type: "file",
      })
    )?.[0];
    return filePath;
  } else {
    const files = await window.api.openFile({
      multi: false,
      defaultPath: options.defaultPath,
    });
    return files?.[0];
  }
};
