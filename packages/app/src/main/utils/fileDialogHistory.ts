import { dirname, isAbsolute, join } from "node:path";

export type FileDialogType = "openFile" | "openDirectory" | "save";
export type FileDialogPaths = Partial<Record<FileDialogType | "directory", string>>;

interface PathStore {
  get: (key: FileDialogType | "directory") => string | undefined;
  set: (key: "directory", directory: string) => void;
}

export class FileDialogHistory {
  private store: PathStore;

  constructor(store: PathStore) {
    this.store = store;
  }

  getDefaultPath(defaultPath?: string): string | undefined {
    if (defaultPath && isAbsolute(defaultPath)) {
      return defaultPath;
    }

    const directory =
      this.store.get("directory") ??
      this.store.get("openFile") ??
      this.store.get("openDirectory") ??
      this.store.get("save");
    if (!directory) {
      return defaultPath;
    }

    return defaultPath ? join(directory, defaultPath) : directory;
  }

  remember(type: FileDialogType, selectedPath?: string) {
    if (!selectedPath) return;
    this.store.set("directory", type === "openDirectory" ? selectedPath : dirname(selectedPath));
  }
}
