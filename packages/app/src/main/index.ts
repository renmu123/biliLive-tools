import { join } from "node:path";
import fs from "fs-extra";
import semver from "semver";
import Store from "electron-store";
import contextMenu from "electron-context-menu";
import {
  app,
  dialog,
  BrowserWindow,
  ipcMain,
  shell,
  Tray,
  Menu,
  net,
  nativeTheme,
  crashReporter,
} from "electron";
import { createContainer } from "awilix";

import installExtension from "electron-devtools-installer";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

import log from "./utils/log";
import { notify } from "./utils/index";
import { init, createRecorderManager } from "@biliLive-tools/shared";
import { serverStart } from "@biliLive-tools/http";

import { cookieHandlers } from "./cookie";
import { commonHandlers, getTempPath } from "./common";
import { configHandlers, ffmpegHandlers } from "./handlers";
// import icon from "../../resources/icon.png?asset";
import {
  FFMPEG_PATH,
  FFPROBE_PATH,
  DANMUKUFACTORY_PATH,
  LOG_PATH,
  MESIO_PATH,
  __dirname,
  getConfigPath,
} from "./appConstant";

import type { OpenDialogOptions } from "../types";
import type { IpcMainInvokeEvent, IpcMain, SaveDialogOptions } from "electron";
import type { Theme, GlobalConfig } from "@biliLive-tools/types";
// import type { AwilixContainer } from "awilix";
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
  registerHandlers(ipcMain, configHandlers);
  registerHandlers(ipcMain, commonHandlers);
  registerHandlers(ipcMain, cookieHandlers);
};

function createWindow(): void {
  Object.assign(windowConfig, WindowState.get("winBounds"));

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    ...windowConfig,
    show: false,
    autoHideMenuBar: false,
    minHeight: 400,
    minWidth: 600,
    ...(process.platform === "linux" ? { icon: join(__dirname, "../../resources/icon.png") } : {}),
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

  // 添加更多渲染进程相关的事件监听
  content.on("crashed" as any, (_event, killed) => {
    log.error("=== 渲染进程崩溃 (Renderer Process Crashed) ===");
    log.error("是否被杀死:", killed);
    log.error("崩溃时间:", new Date().toISOString());
    log.error("进程ID:", content.getOSProcessId());
    log.error("=== 渲染进程崩溃结束 ===");
  });

  content.on("unresponsive" as any, () => {
    log.error("=== 渲染进程无响应 (Renderer Process Unresponsive) ===");
    log.error("无响应时间:", new Date().toISOString());
    log.error("进程ID:", content.getOSProcessId());
    log.error("=== 渲染进程无响应结束 ===");
  });

  content.on("responsive" as any, () => {
    log.info("=== 渲染进程恢复响应 (Renderer Process Responsive) ===");
    log.info("恢复时间:", new Date().toISOString());
    log.info("进程ID:", content.getOSProcessId());
    log.info("=== 渲染进程恢复响应结束 ===");
  });

  content.on(
    "did-fail-load" as any,
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      log.error("=== 页面加载失败 (Page Load Failed) ===");
      log.error("错误代码:", errorCode);
      log.error("错误描述:", errorDescription);
      log.error("验证URL:", validatedURL);
      log.error("是否主框架:", isMainFrame);
      log.error("失败时间:", new Date().toISOString());
      log.error("=== 页面加载失败结束 ===");
    },
  );

  content.on(
    "did-fail-provisional-load" as any,
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      log.error("=== 临时页面加载失败 (Provisional Load Failed) ===");
      log.error("错误代码:", errorCode);
      log.error("错误描述:", errorDescription);
      log.error("验证URL:", validatedURL);
      log.error("是否主框架:", isMainFrame);
      log.error("失败时间:", new Date().toISOString());
      log.error("=== 临时页面加载失败结束 ===");
    },
  );

  // content.on("console-message" as any, (_event, level, message, line, sourceId) => {
  //   if (level >= 2) {
  //     // 只记录警告和错误级别的控制台消息
  //     log.warn("=== 渲染进程控制台消息 ===");
  //     log.warn("级别:", level);
  //     log.warn("消息:", message);
  //     log.warn("行号:", line);
  //     log.warn("源ID:", sourceId);
  //     log.warn("时间:", new Date().toISOString());
  //     log.warn("=== 渲染进程控制台消息结束 ===");
  //   }
  // });

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
  const tray = new Tray(join(__dirname, "../../resources/icon.png"));
  // 托盘名称
  tray.setToolTip("biliLive-tools");
  // 托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示",
      click: () => {
        mainWin.show();
      },
    },
    {
      label: "重启",
      click: () => {
        relaunch();
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

type createRecorderManagerType = Awaited<ReturnType<typeof createRecorderManager>>;

const canQuit = async () => {
  const taskQueue = container.resolve<TaskQueue>("taskQueue");
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");

  const tasks = taskQueue.list();
  const isRunningTask = tasks.some((task) =>
    ["running", "paused", "pending"].includes(task.status),
  );
  let isRecordingTask = recorderManager.manager.recorders.some(
    (item) => item.state === "recording",
  );
  if (isRunningTask || isRecordingTask) {
    const confirm = await dialog.showMessageBox(mainWin, {
      message: "检测到有未完成的任务或录制，是否退出？",
      buttons: ["取消", "退出"],
    });
    if (confirm.response === 1) {
      // 手动停止正在录制的直播
      for (const recorder of recorderManager.manager.recorders) {
        if (recorder.state === "recording") {
          await recorderManager.manager.stopRecord(recorder.id);
        }
      }
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
    Object.assign(
      windowConfig,
      {
        isMaximized: false,
      },
      mainWin.getNormalBounds(),
    );

    WindowState.set("winBounds", windowConfig); // saves window's properties using electron-store
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
  crashReporter.start({
    uploadToServer: false,
  });
  app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.electron");
    installExtension("nhdogjmejiglipccpnnnanhbledajbpd")
      .then(({ name }) => log.debug(`Added Extension:  ${name}`))
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
    log.error("=== 未捕获异常 (Uncaught Exception) ===");
    log.error("错误信息:", error.message);
    log.error("错误堆栈:", error.stack);
    log.error("错误名称:", error.name);
    log.error("错误代码:", (error as any).code);
    log.error("内存使用:", {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
    });

    if (error.message.includes("listen EADDRINUSE")) {
      setTimeout(() => {
        const appConfig = container.resolve<AppConfig>("appConfig");
        notify(mainWin.webContents, {
          type: "error",
          content: `检查是否有其他程序占用了${appConfig.get("port")}端口，请尝试更换端口或重启设备`,
        });
      }, 1000);
    }
    log.error("=== 未捕获异常结束 ===");
  });

  process.on("unhandledRejection", function (reason, promise) {
    log.error("拒绝原因:", reason, promise);

    if (reason instanceof Error) {
      log.error("错误名称:", reason.name);
      log.error("错误消息:", reason.message);
      log.error("错误堆栈:", reason.stack);
    }

    // 发送通知到渲染进程
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send("notify", {
        type: "error",
        content: String(reason),
      });
    }
  });

  // 添加更多进程事件监听
  process.on("warning", function (warning) {
    log.warn("=== 进程警告 (Process Warning) ===");
    log.warn("警告名称:", warning.name);
    log.warn("警告消息:", warning.message);
    log.warn("警告堆栈:", warning.stack);
    log.warn("警告代码:", (warning as any).code);
    log.warn("=== 进程警告结束 ===");
  });

  process.on("exit", function (code) {
    log.info("=== 进程退出 (Process Exit) ===");
    log.info("退出代码:", code);
    log.info("退出时间:", new Date().toISOString());
    log.info("=== 进程退出结束 ===");
  });

  process.on("SIGTERM", function () {
    log.info("=== 收到SIGTERM信号 ===");
    log.info("时间:", new Date().toISOString());
    log.info("=== SIGTERM信号处理结束 ===");
  });

  process.on("SIGINT", function () {
    log.info("=== 收到SIGINT信号 ===");
    log.info("时间:", new Date().toISOString());
    log.info("=== SIGINT信号处理结束 ===");
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

  // 记录应用启动信息
  log.info("=== 应用启动信息 ===");
  log.info("应用版本:", app.getVersion());
  log.info("Electron版本:", process.versions.electron);
  log.info("Node版本:", process.versions.node);
  log.info("Chrome版本:", process.versions.chrome);
  log.info("V8版本:", process.versions.v8);
  log.info("操作系统:", process.platform);
  log.info("架构:", process.arch);
  log.info("启动时间:", new Date().toISOString());
  log.info("用户数据路径:", app.getPath("userData"));
  log.info("临时文件路径:", app.getPath("temp"));
  log.info("日志路径:", app.getPath("logs"));
  log.info("=== 应用启动信息结束 ===");

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
    defaultMesioPath: MESIO_PATH,
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
    try {
      await checkUpdate();
    } catch (error) {
      log.error("自动更新检查失败:", error);
    }
  }
  // taskQueueListen(container);
};

// const taskQueueListen = (container: AwilixContainer) => {
//   const taskQueue = container.resolve<TaskQueue>("taskQueue");
//   taskQueue.on("task-start", ({ taskId }) => {
//     mainWin.webContents.send("task-start", { taskId: taskId });
//   });
//   taskQueue.on("task-end", ({ taskId }) => {
//     mainWin.webContents.send("task-end", {
//       taskId: taskId,
//       output: taskQueue.queryTask(taskId)?.output,
//     });
//   });
//   taskQueue.on("task-error", ({ taskId }) => {
//     mainWin.webContents.send("task-error", { taskId: taskId });
//   });
//   taskQueue.on("task-progress", ({ taskId }) => {
//     mainWin.webContents.send("task-progress", { taskId: taskId });
//   });
// };

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
      buttons: ["取消", "备用", "确认"],
    });
    if (confirm.response === 2) {
      shell.openExternal("https://github.com/renmu123/biliLive-tools/releases");
    } else if (confirm.response === 1) {
      shell.openExternal("https://pan.quark.cn/s/6da253a1ecb8");
    }
    return false;
  }
  return true;
};
