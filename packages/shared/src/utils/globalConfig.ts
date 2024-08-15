interface ConfigData {
  videoPresetPath: string;
  danmuPresetPath: string;
  ffmpegPresetPath: string;
  configPath: string;
  logPath: string;
}

export default class Config {
  data!: ConfigData;
  constructor(data?: ConfigData) {
    if (data) {
      this.data = data;
    }
  }
  init(data: ConfigData) {
    this.data = data;
  }
  check() {
    if (!this.data) {
      throw new Error("Config not init");
    }
  }
  get<K extends keyof ConfigData>(key: K): ConfigData[K] {
    this.check();
    return this.data[key];
  }
}
