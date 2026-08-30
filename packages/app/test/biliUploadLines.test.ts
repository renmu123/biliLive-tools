import { describe, expect, it } from "vitest";

import { resolveBiliUploadLineSelection } from "../src/renderer/src/pages/setting/biliUploadLines";

describe("BiliSetting upload line selection", () => {
  it("选择 auto 时替换已有固定线路", () => {
    expect(resolveBiliUploadLineSelection(["cs-qn", "cs-alia", "auto"], ["cs-qn", "cs-alia"]))
      .toEqual(["auto"]);
  });

  it("从 auto 选择固定线路时移除 auto", () => {
    expect(resolveBiliUploadLineSelection(["auto", "cs-qn"], ["auto"])).toEqual(["cs-qn"]);
  });

  it("拒绝清空最后一条线路和未知 selector", () => {
    expect(resolveBiliUploadLineSelection([], ["cs-qn"])).toEqual(["cs-qn"]);
    expect(resolveBiliUploadLineSelection(["unknown"], ["cs-qn"])).toEqual(["cs-qn"]);
  });
});
