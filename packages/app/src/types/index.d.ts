import { biliApi } from "../main/bili";

import type { OpenDialogOptions as ElectronOpenDialogOptions } from "electron";

export type BiliApi = typeof biliApi;

export interface OpenDialogOptions extends ElectronOpenDialogOptions {
  multi?: boolean;
}
