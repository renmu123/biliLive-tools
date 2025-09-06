import { BrowserWindow, session } from "electron";

import type { IpcMainInvokeEvent } from "electron";

export const cookieHandlers = {
  "cookie:baidu": async (_event: IpcMainInvokeEvent) => {
    return new Promise((resolve, reject) => {
      const win = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        webPreferences: {
          webSecurity: false,
        },
      });
      win.loadURL("https://pan.baidu.com/disk/main", {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
      });

      win.on("closed", async () => {
        const cookies = await session.defaultSession.cookies.get({ domain: "pan.baidu.com" });
        if (cookies.length) {
          resolve(
            cookies
              .map((cookie) => {
                return `${cookie.name}=${cookie.value}`;
              })
              .join("; "),
          );
        } else {
          reject(new Error("cookie not found"));
        }
      });
    });
  },
};
