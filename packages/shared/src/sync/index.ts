import { BaiduPCS } from "./baiduPCS.js";
import { AliyunPan } from "./aliyunpan.js";
import { Alist } from "./alist.js";
import { LocalCopy } from "./localCopy.js";

export { BaiduPCS } from "./baiduPCS.js";
export { AliyunPan } from "./aliyunpan.js";
export { Alist } from "./alist.js";
export { LocalCopy } from "./localCopy.js";

export type SyncClient = BaiduPCS | AliyunPan | Alist | LocalCopy;
