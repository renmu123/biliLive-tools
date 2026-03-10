import { XhsParser } from "../../src/xhs/parser.js";
import { describe, it, expect } from "vitest";

describe("xhs链接解析", () => {
  it("短链解析", async () => {
    const parser = new XhsParser();
    const roomId = await parser.extractRoomId("http://xhslink.com/m/5OUfMYyJsAz");
    expect(roomId).toBe("570180068897685033");
  });
  it("正常链接解析", async () => {
    const parser = new XhsParser();
    const roomId = await parser.extractRoomId(
      "https://www.xiaohongshu.com/livestream/570180068897685033",
    );
    expect(roomId).toBe("570180068897685033");
  });
  it("数据解析", async () => {
    const parser = new XhsParser();
    const liveInfo = await parser.getLiveInfo("570180068897685033");
    console.log(liveInfo);
    // expect(liveInfo).toHaveProperty("anchor_name");
    // expect(liveInfo).toHaveProperty("is_live");
    // expect(liveInfo).toHaveProperty("title");
  });
});
