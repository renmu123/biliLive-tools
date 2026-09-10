import { describe, expect, it } from "vitest";

import {
  BiliUploadRouteScheduler,
  getSanitizedUploadEndpointHost,
  normalizeBiliUploadLines,
  normalizeBiliUploadRouteConfig,
  parseBiliUploadRouteSelector,
} from "../src/biliUploadRoute.js";

describe("normalizeBiliUploadRouteConfig", () => {
  it("将旧单线路配置迁移为固定线路池", () => {
    expect(normalizeBiliUploadRouteConfig({ line: "cs-qn" })).toMatchObject({
      line: "cs-qn",
      lines: ["cs-qn"],
      lineStrategy: "fixed",
    });
    expect(normalizeBiliUploadRouteConfig({ line: "auto" })).toMatchObject({
      line: "auto",
      lines: ["auto"],
      lineStrategy: "fixed",
    });
  });

  it("去重、过滤未知线路并回填兼容 line", () => {
    expect(
      normalizeBiliUploadRouteConfig({
        line: "auto",
        lines: ["cs-qn", "unknown", "cs-qn", "cs-alia"],
        lineStrategy: "random",
      }),
    ).toMatchObject({
      line: "cs-qn",
      lines: ["cs-qn", "cs-alia"],
      lineStrategy: "random",
    });
  });

  it("保证 auto 与固定线路互斥，并为空数组提供旧字段回退", () => {
    expect(normalizeBiliUploadLines(["auto", "cs-qn"], "cs-qn")).toEqual(["auto"]);
    expect(normalizeBiliUploadLines(["cs-qn", "auto"], "auto")).toEqual(["cs-qn"]);
    expect(normalizeBiliUploadLines([], "cs-alia")).toEqual(["cs-alia"]);
    expect(normalizeBiliUploadLines(["unknown"], "cs-qn")).toEqual(["cs-qn"]);
  });

  it("endpoint 日志值只保留主机名", () => {
    expect(
      getSanitizedUploadEndpointHost(
        "https://user:password@upos.example.com/path/video?auth=sensitive&signature=secret",
      ),
    ).toBe("upos.example.com");
    expect(getSanitizedUploadEndpointHost("not-a-url?auth=sensitive")).toBe("unknown");
  });

  it("多线路的无效或固定策略回退为轮询", () => {
    expect(
      normalizeBiliUploadRouteConfig({
        line: "cs-qn",
        lines: ["cs-qn", "cs-alia"],
        lineStrategy: "fixed",
      }).lineStrategy,
    ).toBe("round-robin");
  });
});

describe("BiliUploadRouteScheduler", () => {
  it("fixed 始终选择第一条并拆分 zone/line", () => {
    const scheduler = new BiliUploadRouteScheduler();
    const context = {
      accountId: "1",
      taskId: "task-1",
      lines: ["cs-qn", "cs-alia"],
      strategy: "fixed" as const,
    };

    expect(scheduler.select(context)).toEqual({ selector: "cs-qn", zone: "cs", line: "qn" });
    expect(scheduler.select(context)).toEqual({ selector: "cs-qn", zone: "cs", line: "qn" });
    expect(parseBiliUploadRouteSelector("auto")).toEqual({
      selector: "auto",
      zone: "",
      line: "auto",
    });
  });

  it("round-robin 按账号独立循环", () => {
    const scheduler = new BiliUploadRouteScheduler();
    const select = (accountId: string) =>
      scheduler.select({
        accountId,
        taskId: `task-${accountId}`,
        lines: ["cs-qn", "cs-alia"],
        strategy: "round-robin",
      }).selector;

    expect([select("1"), select("1"), select("1")]).toEqual(["cs-qn", "cs-alia", "cs-qn"]);
    expect([select("2"), select("2")]).toEqual(["cs-qn", "cs-alia"]);
  });

  it("random 只从用户线路池选择且可注入 RNG", () => {
    const first = new BiliUploadRouteScheduler(() => 0);
    const last = new BiliUploadRouteScheduler(() => 0.999999);
    const context = {
      accountId: "1",
      taskId: "task-1",
      lines: ["cs-qn", "cs-alia"],
      strategy: "random" as const,
    };

    expect(first.select(context).selector).toBe("cs-qn");
    expect(last.select(context).selector).toBe("cs-alia");
  });
});
