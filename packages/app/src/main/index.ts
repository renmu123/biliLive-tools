import { join } from "node:path";
import fs from "fs-extra";
import semver from "semver";
import Store from "electron-store";
import contextMenu from "electron-context-menu";
import { app, dialog, BrowserWindow, ipcMain, shell, Tray, Menu, net, nativeTheme } from "electron";
import { createContainer } from "awilix";

import installExtension from "electron-devtools-installer";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

import log from "./utils/log";
import { notify } from "./utils/index";
import { init } from "@biliLive-tools/shared";
import { serverStart } from "@biliLive-tools/http";

import { handlers as danmuHandlers } from "./danmu";
import { commonHandlers, getTempPath } from "./common";
import { configHandlers, ffmpegHandlers } from "./handlers";
import { handlers as notidyHandlers } from "./notify";
import icon from "../../resources/icon.png?asset";
import {
  FFMPEG_PATH,
  FFPROBE_PATH,
  DANMUKUFACTORY_PATH,
  LOG_PATH,
  __dirname,
  getConfigPath,
} from "./appConstant";

import type { OpenDialogOptions } from "../types";
import type { IpcMainInvokeEvent, IpcMain, SaveDialogOptions } from "electron";
import type { Theme, GlobalConfig } from "@biliLive-tools/types";
import type { AwilixContainer } from "awilix";
import type { AppConfig, TaskQueue } from "@biliLive-tools/shared";

export let mainWin: BrowserWindow;
export let container = createContainer();

contextMenu({
  showSelectAll: false,
  showSearchWithGoogle: false,
  showSaveImageAs: false,
});

const WindowState = new Store<{
  winBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
    isMaximized: boolean;
  };
}>({
  name: "window-state",
});

const windowConfig = {
  width: 900,
  height: 750,
  isMaximized: false,
};

const registerHandlers = (
  ipcMain: IpcMain,
  handlers: {
    [key: string]: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any;
  },
) => {
  Object.keys(handlers).forEach((key) => {
    ipcMain.handle(key, handlers[key]);
  });
};

const genHandler = (ipcMain: IpcMain) => {
  // 通用函数
  ipcMain.handle("dialog:openDirectory", openDirectory);
  ipcMain.handle("dialog:openFile", openFile);
  ipcMain.handle("dialog:save", saveDialog);
  ipcMain.handle("common:relaunch", relaunch);
  ipcMain.handle("common:setOpenAtLogin", setOpenAtLogin);
  ipcMain.handle("common:setTheme", setTheme);

  registerHandlers(ipcMain, ffmpegHandlers);
  registerHandlers(ipcMain, danmuHandlers);
  registerHandlers(ipcMain, configHandlers);
  registerHandlers(ipcMain, notidyHandlers);
  registerHandlers(ipcMain, commonHandlers);
};

function createWindow(): void {
  Object.assign(windowConfig, WindowState.get("winBounds"));
  console.log("windowConfig", windowConfig);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    ...windowConfig,
    show: false,
    autoHideMenuBar: false,
    minHeight: 400,
    minWidth: 600,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      webSecurity: false,
      // nodeIntegrationInWorker: true,
    },
  });
  if (windowConfig.isMaximized) {
    mainWindow.maximize();
  }
  mainWindow.on("close", () => {
    Object.assign(
      windowConfig,
      {
        isMaximized: mainWindow.isMaximized(),
      },
      mainWindow.getNormalBounds(),
    );
    console.log(
      "close",
      windowConfig,
      {
        isMaximized: mainWindow.isMaximized(),
      },
      mainWindow.getNormalBounds(),
    );
    WindowState.set("winBounds", windowConfig); // saves window's properties using electron-store
  });

  mainWindow.on("ready-to-show", () => {
    if (is.dev) {
      // mainWindow.webContents.openDevTools();
      mainWindow.showInactive();
    } else {
      mainWindow.show();
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
  mainWin = mainWindow;
  const content = mainWindow.webContents;

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // const url = details.url;
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    } else {
      return { action: "allow" };
    }
  });

  content.on("render-process-gone", (_event, details) => {
    log.error(`render-process-gone: ${JSON.stringify(details)}`);
  });
  // content.on("unresponsive", (event) => {
  //   log.error(`unresponsive: ${JSON.stringify(event)}`);
  // });
  content.on("preload-error", (_event, preloadPath, error) => {
    log.error(`preload-error: ${preloadPath},${error}`);
  });

  // 触发关闭时触发
  mainWin.on("close", (event) => {
    const appConfig = container.resolve<AppConfig>("appConfig");

    const closeToTray = appConfig.get("closeToTray");
    event.preventDefault();

    if (closeToTray) {
      mainWin.hide();
      mainWin.setSkipTaskbar(true);
    } else {
      quit();
    }
  });
  // 窗口最小化
  mainWin.on("minimize", () => {
    const appConfig = container.resolve<AppConfig>("appConfig");
    const minimizeToTray = appConfig.get("minimizeToTray");
    if (minimizeToTray) {
      // event.preventDefault();
      // mainWin.hide();
      mainWin.setSkipTaskbar(true);
    }
  });

  // 新建托盘
  const tray = new Tray(join(icon));
  // 托盘名称
  tray.setToolTip("biliLive-tools");
  // 托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "打开log文件夹",
      click: () => {
        shell.openPath(app.getPath("logs"));
      },
    },
    {
      label: "显示",
      click: () => {
        mainWin.show();
      },
    },
    {
      label: "退出",
      click: async () => {
        quit();
      },
    },
  ]);
  // 载入托盘菜单
  tray.setContextMenu(contextMenu);
  // 双击触发
  tray.on("double-click", () => {
    mainWin.isVisible() ? mainWin.hide() : mainWin.show();
    mainWin.isVisible() ? mainWin.setSkipTaskbar(false) : mainWin.setSkipTaskbar(true);
  });
}

function createMenu(): void {
  const menu = Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [
        {
          label: "设置",
          click: () => {
            mainWin.show();
            mainWin.webContents.send("open-setting");
          },
        },
        {
          label: "查看log",
          click: () => {
            mainWin.show();
            mainWin.webContents.send("open-log");
          },
        },
        {
          label: "打开配置文件夹",
          click: async () => {
            const { userDataPath } = await getConfigPath();
            shell.openPath(userDataPath);
          },
        },
        {
          label: "打开log文件夹",
          click: () => {
            shell.openPath(app.getPath("logs"));
          },
        },
        {
          label: "退出",
          click: async () => {
            quit();
          },
        },
      ],
    },
    {
      label: "开发者工具",
      role: "viewMenu",
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "赞助",
          click: async () => {
            shell.openExternal("https://afdian.com/a/renmu123");
          },
        },
        {
          label: "更新记录",
          click: () => {
            mainWin.show();
            mainWin.webContents.send("open-changelog");
          },
        },
        {
          label: "常见问题",
          click: async () => {
            shell.openExternal(
              "https://github.com/renmu123/biliLive-tools?tab=readme-ov-file#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98",
            );
          },
        },
        {
          label: "检测更新",
          click: async () => {
            try {
              const status = await checkUpdate();
              if (status) {
                dialog.showMessageBox(mainWin, {
                  message: "当前已经是最新版本",
                  buttons: ["确认"],
                });
              }
            } catch (error) {
              log.error(error);
              const confirm = await dialog.showMessageBox(mainWin, {
                message: "检查更新失败，请前往仓库查看",
                buttons: ["取消", "确认"],
              });
              if (confirm.response === 1) {
                shell.openExternal("https://github.com/renmu123/biliLive-tools/releases");
              }
            }
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

const canQuit = async () => {
  const taskQueue = container.resolve<TaskQueue>("taskQueue");

  const tasks = taskQueue.list();
  const isRunning = tasks.some((task) => ["running", "paused", "pending"].includes(task.status));
  if (isRunning) {
    const confirm = await dialog.showMessageBox(mainWin, {
      message: "检测到有未完成的任务，是否退出？",
      buttons: ["取消", "退出"],
    });
    if (confirm.response === 1) {
      return true;
    } else {
      return false;
    }
  }
  return true;
};

// 退出应用时检测任务
const quit = async () => {
  try {
    Object.assign(
      windowConfig,
      {
        isMaximized: mainWin.isMaximized(),
      },
      mainWin.getNormalBounds(),
    );

    console.log(
      "quit",
      windowConfig,
      {
        isMaximized: mainWin.isMaximized(),
      },
      mainWin.getNormalBounds(),
    );

    WindowState.set("winBounds", windowConfig); // saves window's properties using electron-store

    const canQuited = await canQuit();
    if (canQuited) {
      await fs.emptyDir(getTempPath());
      mainWin.destroy();
      app.quit();
    }
  } catch (e) {
    log.error("quit error", e);
    mainWin.destroy();
    app.quit();
  }
};

export const relaunch = async () => {
  const canQuited = await canQuit();
  if (canQuited) {
    app.relaunch();
    app.exit(0);
  }
};

export const setOpenAtLogin = (_event: IpcMainInvokeEvent, openAtLogin: boolean) => {
  app.setLoginItemSettings({
    openAtLogin,
  });
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.electron");
    installExtension("nhdogjmejiglipccpnnnanhbledajbpd")
      .then((name) => log.debug(`Added Extension:  ${name}`))
      .catch((err) => log.debug("An error occurred: ", err));

    log.info(`app start, version: ${app.getVersion()}`);
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    createWindow();
    createMenu();
    genHandler(ipcMain);
    appInit();

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  process.on("uncaughtException", function (error) {
    if (error.message.includes("listen EADDRINUSE")) {
      setTimeout(() => {
        const appConfig = container.resolve<AppConfig>("appConfig");
        notify(mainWin.webContents, {
          type: "error",
          content: `检查是否有其他程序占用了${appConfig.get("port")}端口，请尝试更换端口或重启设备`,
        });
      }, 1000);
    }
    log.error("uncaughtException", error);
    // log.error(error);
  });
  process.on("unhandledRejection", function (error) {
    log.error("unhandledRejection", error);
    // event.sender.send("notify", data);
    mainWin.webContents.send("notify", {
      type: "error",
      content: String(error),
    });
  });

  app.on("second-instance", () => {
    // 有人试图运行第二个实例，我们应该关注我们的窗口
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
    }
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    log.info("app quit");
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

// 业务相关的初始化
const appInit = async () => {
  fs.ensureDir(getTempPath());

  const {
    APP_CONFIG_PATH,
    FFMPEG_PRESET_PATH,
    VIDEO_PRESET_PATH,
    DANMU_PRESET_PATH,
    userDataPath,
  } = await getConfigPath();

  const globalConfig: GlobalConfig = {
    videoPresetPath: VIDEO_PRESET_PATH,
    ffmpegPresetPath: FFMPEG_PRESET_PATH,
    danmuPresetPath: DANMU_PRESET_PATH,
    configPath: APP_CONFIG_PATH,
    logPath: LOG_PATH,
    defaultFfmpegPath: FFMPEG_PATH,
    defaultFfprobePath: FFPROBE_PATH,
    defaultDanmakuFactoryPath: DANMUKUFACTORY_PATH,
    userDataPath,
    version: app.getVersion(),
  };
  container = await init(globalConfig);
  const appConfig = container.resolve<AppConfig>("appConfig");

  await serverStart(
    {
      port: appConfig.get("port"),
      host: appConfig.get("host"),
      auth: true,
      passKey: appConfig.get("passKey"),
    },
    container,
  );
  nativeTheme.themeSource = appConfig.get("theme");

  // 检测更新
  if (appConfig.get("autoUpdate")) {
    checkUpdate();
  }
  taskQueueListen(container);
};

const taskQueueListen = (container: AwilixContainer) => {
  const taskQueue = container.resolve<TaskQueue>("taskQueue");
  taskQueue.on("task-start", ({ taskId }) => {
    mainWin.webContents.send("task-start", { taskId: taskId });
  });
  taskQueue.on("task-end", ({ taskId }) => {
    mainWin.webContents.send("task-end", {
      taskId: taskId,
      output: taskQueue.queryTask(taskId)?.output,
    });
  });
  taskQueue.on("task-error", ({ taskId }) => {
    mainWin.webContents.send("task-error", { taskId: taskId });
  });
  taskQueue.on("task-progress", ({ taskId }) => {
    mainWin.webContents.send("task-progress", { taskId: taskId });
  });
};

const openDirectory = async (
  _event: IpcMainInvokeEvent,
  opts: {
    defaultPath?: string;
    buttonLabel?: string;
    title?: string;
  } = {},
) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
    ...opts,
    properties: ["openDirectory"],
  });
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
};
const openFile = async (_event: IpcMainInvokeEvent, options: OpenDialogOptions) => {
  const properties: ("openFile" | "multiSelections")[] = ["openFile"];
  if (options.multi) {
    properties.push("multiSelections");
  }

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
    properties,
    ...options,
  });
  if (canceled) {
    return;
  } else {
    return filePaths;
  }
};

const saveDialog = async (_event: IpcMainInvokeEvent, options: SaveDialogOptions) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWin, options);
  if (canceled) {
    return;
  } else {
    return filePath;
  }
};

const setTheme = (_event: IpcMainInvokeEvent, theme: Theme) => {
  nativeTheme.themeSource = theme;
};

const checkUpdate = async () => {
  await app.whenReady();
  const res = await net.fetch(
    "https://githubraw.irenmu.com/renmu123/biliLive-tools/master/package.json",
  );
  const data = await res.json();
  const latestVersion = data.version;
  const version = app.getVersion();

  if (semver.gt(latestVersion, version)) {
    const confirm = await dialog.showMessageBox(mainWin, {
      message: "检测到有新版本，是否前往下载？",
      buttons: ["取消", "确认"],
    });
    if (confirm.response === 1) {
      shell.openExternal("https://github.com/renmu123/biliLive-tools/releases");
    }
    return false;
  }
  return true;
};
