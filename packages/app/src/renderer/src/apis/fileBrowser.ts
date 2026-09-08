import request from "./request";

export interface FileBrowserItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  mtimeMs: number;
  canDelete: boolean;
  fileKind?: "video" | "danmaku";
}

export interface FileBrowserListResponse {
  rootPath: string;
  currentPath: string;
  parentPath: string | null;
  deleteEnabled: boolean;
  list: FileBrowserItem[];
}

export async function list(path?: string): Promise<FileBrowserListResponse> {
  const res = await request.get("/files/list", {
    params: path ? { path } : undefined,
  });
  return res.data;
}

export async function createDownloadUrl(filePath: string): Promise<string> {
  const res = await request.post("/files/download", {
    path: filePath,
  });
  return `${request.defaults.baseURL}/assets/download/${res.data.fileId}`;
}

export async function removeFile(filePath: string): Promise<{ message: string; path: string }> {
  const res = await request.post("/files/delete", {
    path: filePath,
  });
  return res.data;
}

export default {
  list,
  createDownloadUrl,
  removeFile,
};
