import { app, dialog, BrowserWindow, ipcMain, shell } from "electron";
import type { IpcMainInvokeEvent, IpcMain } from "electron";
import { join, parse } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

import ffmpeg from "fluent-ffmpeg";
import type { File, OriginFile, OpenDialogOptions } from "../types";
import { formatFile } from "./utils";

import { saveDanmuConfig, getDanmuConfig, convertDanmu2Ass } from "./danmu";

const FFMPEG_PATH = join(__dirname, "../../bin/ffmpeg.exe");
const FFPROBE_PATH = join(__dirname, "../../bin/ffprobe.exe");

const genHandler = (ipcMain: IpcMain) => {
  ipcMain.handle("dialog:openDirectory", openDirectory);
  ipcMain.handle("dialog:openFile", openFile);

  ipcMain.handle("convertFile2Mp4", convertFile2Mp4);

  ipcMain.handle("saveDanmuConfig", saveDanmuConfig);
  ipcMain.handle("getDanmuConfig", getDanmuConfig);
  ipcMain.handle("convertDanmu2Ass", convertDanmu2Ass);
};

let mainWin: BrowserWindow;
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
  mainWin = mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();
  genHandler(ipcMain);

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const convertFile2Mp4 = (_event: IpcMainInvokeEvent, file: OriginFile) => {
  // 相同文件覆盖提示
  const { name, path, dir } = formatFile(file);

  const output = join(dir, `${name}.mp4`);
  const command = ffmpeg(path)
    .setFfmpegPath(FFMPEG_PATH)
    .setFfprobePath(FFPROBE_PATH)
    .output(output)
    .videoCodec("copy");
  command.run();

  command.on("start", (commandLine: string) => {
    console.log("Conversion start");
    mainWin.webContents.send("task-start", commandLine);
  });

  command.on("end", () => {
    console.log("Conversion ended");
    mainWin.webContents.send("task-end");
  });

  command.on("error", (err) => {
    console.log(`An error occurred: ${err.message}`);
    mainWin.webContents.send("task-error", err);
  });

  command.on("progress", (progress) => {
    console.log(progress);

    console.log(`Processing: ${progress.percent}% done`);
    mainWin.webContents.send("task-progress-update", progress);
  });
};

const openDirectory = async (_event: IpcMainInvokeEvent) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
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
