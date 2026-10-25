import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FileDialogHistory, type FileDialogPaths } from "../src/main/utils/fileDialogHistory";

const createStore = () => {
  const paths: FileDialogPaths = {};
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

    expect(new FileDialogHistory(store).getDefaultPath("openFile")).toBe(directory);
  });

  it("remembers the selected folder itself for directory dialogs", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openDirectory", directory);

    expect(history.getDefaultPath("openDirectory")).toBe(directory);
  });

  it("keeps input files, output files and directory selections independent", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "video.mp4"));
    history.remember("save", join(process.cwd(), "output", "result.mp4"));
    history.remember("openDirectory", join(process.cwd(), "cache"));

    expect(history.getDefaultPath("openFile")).toBe(directory);
    expect(history.getDefaultPath("save")).toBe(join(process.cwd(), "output"));
    expect(history.getDefaultPath("openDirectory")).toBe(join(process.cwd(), "cache"));
  });

  it("preserves explicitly supplied absolute paths", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "video.mp4"));
    const explicitPath = join(process.cwd(), "tools", "ffmpeg.exe");

    expect(history.getDefaultPath("openFile", explicitPath)).toBe(explicitPath);
  });

  it("uses the remembered save directory with a suggested filename", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("save", join(directory, "previous.mp4"));

    expect(history.getDefaultPath("save", "result.mp4")).toBe(join(directory, "result.mp4"));
  });

  it("does not replace the remembered path when there is no selection", () => {
    const history = new FileDialogHistory(createStore());
    history.remember("openFile", join(directory, "video.mp4"));
    history.remember("openFile");
    history.remember("openFile", "");

    expect(history.getDefaultPath("openFile")).toBe(directory);
  });

  it("leaves Electron's defaults unchanged before the first selection", () => {
    const history = new FileDialogHistory(createStore());

    expect(history.getDefaultPath("openFile")).toBeUndefined();
    expect(history.getDefaultPath("save", "result.mp4")).toBe("result.mp4");
  });
});
