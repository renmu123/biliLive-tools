import { app } from "electron";
import path from "path";
import fs from "fs";

export default class Config {
  filename: string;
  data: {
    [propName: string]: any;
  };
  constructor(filename: string, autoInit = true) {
    this.filename = filename;
    this.data = {};

    const exePath = app.getPath("exe");
    // 判断exe文件夹中是否存在filename的文件，不存在则创建
    // const configPath = path.join(exePath, filename);
    // console.log(configPath);
    if (!fs.existsSync(filename)) {
      if (autoInit) {
        this.init({});
      }
    } else {
      this.read();
    }
  }
  set(key: string, value: any) {
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
    fs.writeFileSync(this.filename, JSON.stringify(this.data));
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
    this.data = JSON.parse(fs.readFileSync(this.filename, "utf-8"));
  }
}
