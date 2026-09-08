import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/log.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

import Config, { AppConfig } from "../src/config.js";

describe("Config", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "shared-config-test-"));
    configPath = path.join(tempDir, "config.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("初始化新文件时会写入默认配置", () => {
    const config = new Config();

    config.init(configPath, { foo: "bar", count: 1 });

    expect(fs.existsSync(configPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({
      foo: "bar",
      count: 1,
    });
  });

  it("get、set、setAll、clear 会同步文件并触发 update 事件", () => {
    const config = new Config();
    const onUpdate = vi.fn();

    config.init(configPath, { count: 1 });
    config.on("update", onUpdate);

    expect(config.get("count")).toBe(1);

    config.set("count", 2);
    expect(config.get("count")).toBe(2);
    expect(onUpdate).toHaveBeenNthCalledWith(1, { count: 2 }, { count: 1 });
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({ count: 2 });

    config.setAll({ enabled: true });
    expect(onUpdate).toHaveBeenNthCalledWith(2, { enabled: true }, { count: 2 });
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({ enabled: true });

    config.clear();
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({});
  });

  it("get 和 set 支持使用点路径读写嵌套字段", () => {
    const config = new Config();
    const onUpdate = vi.fn();

    config.init(configPath, {
      nested: {
        value: 1,
      },
    });
    config.on("update", onUpdate);

    expect(config.get("nested.value")).toBe(1);
    expect(config.get("nested.missing")).toBeUndefined();

    config.set("nested.value", 2);
    config.set("nested.extra.label", "ok");

    expect(config.get("nested.value")).toBe(2);
    expect(config.get("nested.extra.label")).toBe("ok");
    expect(onUpdate).toHaveBeenNthCalledWith(
      1,
      {
        nested: {
          value: 2,
        },
      },
      {
        nested: {
          value: 1,
        },
      }
    );
    expect(onUpdate).toHaveBeenNthCalledWith(
      2,
      {
        nested: {
          value: 2,
          extra: {
            label: "ok",
          },
        },
      },
      {
        nested: {
          value: 2,
        },
      }
    );
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({
      nested: {
        value: 2,
        extra: {
          label: "ok",
        },
      },
    });
  });

  it("已有配置文件时会与初始化默认值深度合并", () => {
    fs.writeFileSync(configPath, JSON.stringify({ nested: { keep: true }, count: 2 }));

    const config = new Config();
    config.init(configPath, {
      nested: { keep: false, append: "value" },
      extra: "default",
    });

    expect(config.read()).toEqual({
      nested: { keep: true, append: "value" },
      count: 2,
      extra: "default",
    });
  });

  it("配置文件损坏时会回退到初始化数据", () => {
    fs.writeFileSync(configPath, "{broken-json");

    const config = new Config();
    config.init(configPath, { recovered: true });

    expect(config.read()).toEqual({ recovered: true });
  });
});

describe("AppConfig", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-config-test-"));
    configPath = path.join(tempDir, "app-config.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("会合并默认配置并保留传入覆盖值", () => {
    const config = new AppConfig();

    config.init(configPath, {
      host: "0.0.0.0",
      tool: {
        download: {
          savePath: "D:/records",
        },
      },
    });

    expect(config.get("host")).toBe("0.0.0.0");
    expect(config.get("port")).toBe(18010);
    expect(config.getDeep("tool.download.savePath")).toBe("D:/records");
    expect(config.getDeep("tool.download.override")).toBe(false);

    const persisted = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(persisted.host).toBe("0.0.0.0");
    expect(persisted.tool.download.savePath).toBe("D:/records");
    expect(persisted.port).toBe(18010);
  });

  it("支持通过点路径更新和读取嵌套配置", () => {
    const config = new AppConfig();

    config.init(configPath, {
      tool: {
        download: {
          savePath: "D:/records",
        },
      },
    });

    config.set("tool.download.override", true);

    expect(config.get("tool.download.override")).toBe(true);
    expect(config.get("tool.download.savePath")).toBe("D:/records");

    const persisted = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(persisted.tool.download.override).toBe(true);
  });
});
