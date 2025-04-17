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

export const showFileDialog = async (options: { extensions: string[]; multi?: boolean }) => {
  let files: string[] | undefined = [];
  if (window.isWeb) {
    files = await showDialog({
      type: "file",
      multi: options.multi,
      exts: options.extensions,
    });
  } else {
    files = await window.api.openFile({
      multi: options.multi,
      filters: [
        {
          name: "file",
          extensions: options.extensions,
        },
        {
          name: "所有文件",
          extensions: ["*"],
        },
      ],
    });
  }
  return files;
};
