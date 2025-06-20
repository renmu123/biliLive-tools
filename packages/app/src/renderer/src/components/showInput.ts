import { App, createApp } from "vue";
import InputDialog from "./InputDialog.vue";

export default async function showInput(
  options: {
    title?: string;
    placeholder?: string;
    defaultValue?: string;
    type?: "text" | "password" | "textarea";
    maxlength?: number;
    showCount?: boolean;
    rows?: number;
    required?: boolean;
    errorMessage?: string;
  } = {},
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const mountNode = document.createElement("div");
    let dialogApp: App<Element> | undefined = createApp(InputDialog, {
      visible: true,
      ...options,
      close: () => {
        resolve(undefined);
        if (dialogApp) {
          dialogApp.unmount();
          document.body.removeChild(mountNode);
          dialogApp = undefined;
        }
      },
      confirm: (value: string) => {
        resolve(value);
        dialogApp?.unmount();
        document.body.removeChild(mountNode);
        dialogApp = undefined;
      },
    });
    document.body.appendChild(mountNode);
    dialogApp.mount(mountNode);
  });
}
