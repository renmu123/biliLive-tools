import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { expect, describe, it } from "vitest";
import { parseDesc, formatOptions } from "../src/task/bili";
import { uuid } from "../src/utils/index";

import type { BiliupConfig } from "@biliLive-tools/types";

const safeRm = (path: string) => {
  if (fs.existsSync(path)) {
    fs.removeSync(path);
  }
};

describe.concurrent("parseDesc", () => {
  it("应该有艾特", () => {
    const input = "Hello [World]<123>! This is a [test]<456>.";
    const expected = [
      { raw_text: "Hello ", type: 1, biz_id: "" },
      { raw_text: "World", type: 2, biz_id: "123" },
      { raw_text: "! This is a ", type: 1, biz_id: "" },
      { raw_text: "test", type: 2, biz_id: "456" },
      { raw_text: ".", type: 1, biz_id: "" },
    ];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });
  it("应该有艾特，更复杂的格式", () => {
    const input = "大家好，我是[暮色312]<10995238>\n，你是[皮皮]<3333>十[]是<>";
    const expected = [
      { raw_text: "大家好，我是", type: 1, biz_id: "" },
      { raw_text: "暮色312", type: 2, biz_id: "10995238" },
      { raw_text: "\n，你是", type: 1, biz_id: "" },
      { raw_text: "皮皮", type: 2, biz_id: "3333" },
      { raw_text: "十[]是<>", type: 1, biz_id: "" },
    ];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });

  it("应该为空", () => {
    const input = "";
    const expected = [];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });

  it("应该没有艾特", () => {
    const input = "你好，我是简介";
    const expected = [{ raw_text: "你好，我是简介", type: 1, biz_id: "" }];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });
  // Add more test cases as needed
});

describe("formatOptions", () => {
  const defaultOptions: BiliupConfig = {
    cover: undefined,
    title: "Test Video",
    tid: 123,
    tag: ["tag1", "tag2"],
    desc: "This is a test video",
    dolby: 1,
    noReprint: 1,
    closeDanmu: 0,
    closeReply: 0,
    selectiionReply: 0,
    openElec: 1,
    recreate: 1,
    no_disturbance: 1,
    copyright: 2,
    hires: 0,
    watermark: 1,
    space_hidden: 2,
  };
  it("should format options without desc_v2", () => {
    const options: BiliupConfig = {
      cover: undefined,
      title: "Test Video",
      tid: 123,
      tag: ["tag1", "tag2"],
      desc: "This is a test video",
      dolby: 1,
      noReprint: 1,
      closeDanmu: 0,
      closeReply: 0,
      selectiionReply: 0,
      openElec: 1,
      recreate: 1,
      no_disturbance: 1,
      copyright: 1,
      hires: 0,
      space_hidden: 2,
    };

    const result = formatOptions(options);

    expect(result.desc_v2).toEqual(undefined);
  });

  it("should format options with desc_v2", () => {
    const options: BiliupConfig = {
      cover: undefined,
      title: "Test Video",
      tid: 123,
      tag: ["tag1", "tag2"],
      desc: "Hello [World]<123>! This is a [test]<456>.",
      dolby: 0,
      noReprint: 1,
      closeDanmu: 0,
      closeReply: 0,
      openElec: 0,
      recreate: -1,
      no_disturbance: 0,
      copyright: 1,
      hires: 0,
    };

    const result = formatOptions(options);

    expect(result.desc_v2).toEqual([
      { raw_text: "Hello ", type: 1, biz_id: "" },
      { raw_text: "World", type: 2, biz_id: "123" },
      { raw_text: "! This is a ", type: 1, biz_id: "" },
      { raw_text: "test", type: 2, biz_id: "456" },
      { raw_text: ".", type: 1, biz_id: "" },
    ]);
  });
  it("should format options with topic_name", () => {
    const options: BiliupConfig = {
      cover: undefined,
      title: "Test Video",
      tid: 123,
      tag: ["tag1", "tag2"],
      desc: "This is a test video",
      dolby: 1,
      noReprint: 1,
      closeDanmu: 0,
      closeReply: 0,
      selectiionReply: 0,
      openElec: 1,
      recreate: 1,
      no_disturbance: 1,
      copyright: 1,
      hires: 0,
      topic_name: "Test Topic",
      topic_id: 123456,
      mission_id: 123456,
    };

    const result = formatOptions(options);

    // @ts-expect-error
    expect(result["topic_name"]).toEqual(undefined);
  });
  it("should format options with topic_name and tag length equal 10", () => {
    const options: BiliupConfig = {
      cover: undefined,
      title: "Test Video",
      tid: 123,
      tag: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
      desc: "This is a test video",
      dolby: 1,
      noReprint: 1,
      closeDanmu: 0,
      closeReply: 0,
      selectiionReply: 0,
      openElec: 1,
      recreate: 1,
      no_disturbance: 1,
      copyright: 1,
      hires: 0,
      topic_name: "Test Topic",
      topic_id: 123456,
      mission_id: 123456,
    };

    const result = formatOptions(options);

    expect(result.tag).toEqual("Test Topic,tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9");
  });

  it("should format options with absolute cover path", ({ onTestFinished }) => {
    const cover = path.join(os.tmpdir(), `${uuid()}.jpg`);
    fs.writeFileSync(cover, "test");

    const options: BiliupConfig = {
      ...defaultOptions,
      cover: cover,
    };

    const result = formatOptions(options, os.tmpdir());

    expect(result.cover).toEqual(cover);

    onTestFinished(() => {
      // clean
      safeRm(cover);
    });
  });

  it("should format options with relative cover path", ({ onTestFinished }) => {
    const coverName = `${uuid()}.jpg`;
    const cover = path.join(os.tmpdir(), coverName);

    fs.ensureDirSync(path.dirname(cover));
    fs.writeFileSync(cover, "test");

    const options: BiliupConfig = {
      ...defaultOptions,
      cover: coverName,
    };

    const result = formatOptions(options, os.tmpdir());

    expect(result.cover).toEqual(cover);

    onTestFinished(() => {
      // clean
      safeRm(cover);
    });
  });

  it("should format options without cover", () => {
    const options: BiliupConfig = {
      ...defaultOptions,
      cover: undefined,
    };

    const result = formatOptions(options);

    expect(result.cover).toEqual(undefined);
  });

  it("should set watermark state when copyright is original and watermark enabled", () => {
    const options: BiliupConfig = {
      cover: undefined,
      title: "Test Video",
      tid: 123,
      tag: ["tag1", "tag2"],
      desc: "This is a test video",
      dolby: 1,
      noReprint: 1,
      closeDanmu: 0,
      closeReply: 0,
      selectiionReply: 0,
      openElec: 1,
      recreate: 1,
      no_disturbance: 1,
      copyright: 1,
      hires: 0,
      watermark: 1,
      space_hidden: 2,
    };

    const result = formatOptions(options);

    expect(result.watermark).toEqual({ state: 1 });
  });

  it("should set watermark state to 0 when disabled and copyright is original", () => {
    const options: BiliupConfig = {
      ...defaultOptions,
      copyright: 1,
      watermark: 0,
    };

    const result = formatOptions(options);

    expect(result.watermark).toEqual({ state: 0 });
  });

  it("should omit watermark when copyright is reprint", () => {
    const options: BiliupConfig = {
      ...defaultOptions,
      copyright: 2,
      watermark: 1,
    };
    const result = formatOptions(options);

    expect(result.watermark).toEqual(undefined);
  });

  it("should tid all time be 21", () => {
    const options = {
      ...defaultOptions,
      tid: 123,
    };
    const result = formatOptions(options);

    expect(result.tid).toEqual(21);
  });
});
