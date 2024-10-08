import { App, createApp } from "vue";
import FileBrowserDialog from "./FileBrowserDialog.vue";

export default async function showDirectoryDialog(
  options: {
    type?: "file" | "directory";
    multi?: boolean;
  } = {},
): Promise<string[] | undefined> {
  return new Promise((resolve) => {
    const mountNode = document.createElement("div");
    let dialogApp: App<Element> | undefined = createApp(FileBrowserDialog, {
      visible: true,
      ...options,
      close: () => {
        if (dialogApp) {
          dialogApp.unmount();
          document.body.removeChild(mountNode);
          dialogApp = undefined;
          resolve(undefined);
        }
      },
      confirm: (path: string[]) => {
        resolve(path);
        dialogApp?.unmount();
        document.body.removeChild(mountNode);
        dialogApp = undefined;
      },
    });
    document.body.appendChild(mountNode);
    dialogApp.mount(mountNode);
  });
}
