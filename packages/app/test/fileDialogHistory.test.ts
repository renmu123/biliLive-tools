import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FileDialogHistory, type FileDialogPaths } from "../src/main/utils/fileDialogHistory";

const createStore = (paths: FileDialogPaths = {}) => {
  return {
    get: (type: keyof FileDialogPaths) => paths[type],
    set: (type: keyof FileDialogPaths, directory: string) => {
      paths[type] = directory;
    },
  };
};

describe("FileDialogHistory", () => {
  const directory = join(process.cwd(), "recordings");

  it("reopens the selected file's directory, including after recreating the history", () => {
    const store = createStore();
    const history = new FileDialogHistory(store);
    history.remember("openFile", join(directory, "video.mp4"));

    expect(new FileDialogHistory(store).getDefaultPath()).toBe(directory);
  });

  it("remembers the selected folder itself for directory dialogs", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openDirectory", directory);

    expect(history.getDefaultPath()).toBe(directory);
  });

  it("shares the latest selected directory across all dialog types", () => {
    const store = createStore();
    const history = new FileDialogHistory(store);
    history.remember("openFile", join(directory, "video.mp4"));

    expect(history.getDefaultPath()).toBe(directory);

    history.remember("save", join(process.cwd(), "output", "result.mp4"));

    expect(history.getDefaultPath()).toBe(join(process.cwd(), "output"));

    history.remember("openDirectory", join(process.cwd(), "cache"));

    expect(new FileDialogHistory(store).getDefaultPath()).toBe(join(process.cwd(), "cache"));
  });

  it("uses an existing path from the previous per-dialog storage", () => {
    const history = new FileDialogHistory(createStore({ openFile: directory }));

    expect(history.getDefaultPath()).toBe(directory);
    expect(history.getDefaultPath("result.mp4")).toBe(join(directory, "result.mp4"));
  });

  it("preserves explicitly supplied absolute paths", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "video.mp4"));
    const explicitPath = join(process.cwd(), "tools", "ffmpeg.exe");

    expect(history.getDefaultPath(explicitPath)).toBe(explicitPath);
  });

  it("uses the remembered save directory with a suggested filename", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "previous.mp4"));

    expect(history.getDefaultPath("result.mp4")).toBe(join(directory, "result.mp4"));
  });

  it("does not replace the remembered path when there is no selection", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "video.mp4"));
    history.remember("openFile");
    history.remember("openFile", "");

    expect(history.getDefaultPath()).toBe(directory);
  });

  it("leaves Electron's defaults unchanged before the first selection", () => {
    const history = new FileDialogHistory(createStore());

    expect(history.getDefaultPath()).toBeUndefined();
    expect(history.getDefaultPath("result.mp4")).toBe("result.mp4");
  });
});
