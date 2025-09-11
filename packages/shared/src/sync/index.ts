import { BaiduPCS } from "./baiduPCS.js";
import { AliyunPan } from "./aliyunpan.js";
import { Alist } from "./alist.js";
import { LocalCopy } from "./localCopy.js";
import { Pan123 } from "./pan123.js";

export { BaiduPCS } from "./baiduPCS.js";
export { AliyunPan } from "./aliyunpan.js";
export { Alist } from "./alist.js";
export { LocalCopy } from "./localCopy.js";
export { Pan123 } from "./pan123.js";

export type SyncClient = BaiduPCS | AliyunPan | Alist | LocalCopy | Pan123;
