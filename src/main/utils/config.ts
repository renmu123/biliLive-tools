import path from "path";
import fs from "fs";
import { app } from "electron";

export const CONFIG_PATH = app.getPath("userData");

export default class Config {
  filename: string;
  protected data: {
    [propName: string]: any;
  };
  path: string;
  constructor(filename: string, autoInit = true) {
    this.filename = filename;
    this.data = {};

    // const exePath = app.getPath("exe");
    // 判断exe文件夹中是否存在filename的文件，不存在则创建
    this.path = path.join(CONFIG_PATH, filename);
    if (!fs.existsSync(this.path)) {
      if (autoInit) {
        this.init({});
      }
    } else {
      this.read();
    }
  }
  set(key: string | number, value: any) {
    this.data[key] = value;
    this.save();
  }
  setAll(data: { [propName: string]: any }) {
    this.data = data;
    this.save();
  }
  get(key: string) {
    return this.data[key];
  }
  save() {
    // 保存文件
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
  init(data: { [propName: string]: any }) {
    // 初始化文件
    this.data = data;
    this.save();
  }
  clear() {
    // 清空文件
    this.data = {};
    this.save();
  }
  read() {
    // 读取文件
    this.data = JSON.parse(fs.readFileSync(this.path, "utf-8"));
    return this.data;
  }
}
