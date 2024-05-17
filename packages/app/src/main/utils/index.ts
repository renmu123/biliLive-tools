import type { IpcMainInvokeEvent, WebContents } from "electron";

export const notify = (
  sender: WebContents,
  data: {
    type: "info" | "success" | "warning" | "error";
    content: string;
  },
) => {
  sender.send("notify", data);
};

export const invokeWrap = <T extends (...args: any[]) => any>(fn: T) => {
  return (_event: IpcMainInvokeEvent, ...args: Parameters<T>): ReturnType<T> => {
    return fn(...args);
  };
};
