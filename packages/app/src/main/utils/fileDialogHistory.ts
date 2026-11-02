import { dirname, isAbsolute, join } from "node:path";

export type FileDialogType = "openFile" | "openDirectory" | "save";
export type FileDialogPaths = Partial<Record<FileDialogType, string>>;

interface PathStore {
  get: (type: FileDialogType) => string | undefined;
  set: (type: FileDialogType, directory: string) => void;
}

export class FileDialogHistory {
  private store: PathStore;

  constructor(store: PathStore) {
    this.store = store;
  }

  getDefaultPath(type: FileDialogType, defaultPath?: string): string | undefined {
    if (defaultPath && isAbsolute(defaultPath)) {
      return defaultPath;
    }

    const directory = this.store.get(type);
    if (!directory) {
      return defaultPath;
    }

    return defaultPath ? join(directory, defaultPath) : directory;
  }

  remember(type: FileDialogType, selectedPath?: string) {
    if (!selectedPath) return;
    this.store.set(type, type === "openDirectory" ? selectedPath : dirname(selectedPath));
  }
}
