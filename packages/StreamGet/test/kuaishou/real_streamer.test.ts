import { describe, test, expect } from "vitest";
import { KuaishouParser } from "../../src/kuaishou/parser.js";

describe("快手真实主播测试", () => {
  test("tw728999999 在播，提取流地址", async () => {
    const parser = new KuaishouParser();

    const info = await parser.getRoomInfo("tw728999999");
    console.log("主播:", info.owner, "在播:", info.living);

    if (info.living) {
      const sources = await parser.getStreams("tw728999999");
      console.log("CDN 数量:", sources.length);
      for (const s of sources) {
        console.log("  CDN:", s.name, "流数:", s.streams.length);
        for (const st of s.streams) {
          console.log("    " + st.quality + " " + st.format + " " + st.bitrate + "kbps");
        }
      }
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0].streams.length).toBeGreaterThan(0);
      expect(sources[0].streams[0].url).toContain("tx-origin");
    } else {
      console.log("主播未开播，跳过流测试");
    }

    expect(info.platform).toBe("kuaishou");
    expect(info.roomId).toBe("tw728999999");
  }, 15000);
});
