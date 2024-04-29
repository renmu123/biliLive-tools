import type { WebContents } from "electron";

export const notify = (
  sender: WebContents,
  data: {
    type: "info" | "success" | "warning" | "error";
    content: string;
  },
) => {
  sender.send("notify", data);
};
