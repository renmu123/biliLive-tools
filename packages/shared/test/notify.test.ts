import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../src/utils/log.js", () => ({
  default: logger,
}));

import { sendByFeishuBot, sendByWeComBot } from "../src/notify.js";

describe("notify bot senders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ ok: true });
  });

  it("sends text message to feishu bot webhook", async () => {
    await sendByFeishuBot("直播总结已生成", "飞书文档：https://feishu.cn/docx/doc", {
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/token",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://open.feishu.cn/open-apis/bot/v2/hook/token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          msg_type: "text",
          content: {
            text: "直播总结已生成\n\n飞书文档：https://feishu.cn/docx/doc",
          },
        }),
      }),
    );
  });

  it("sends text message to enterprise wechat bot webhook", async () => {
    await sendByWeComBot("直播总结已生成", "Notion：https://www.notion.so/0123", {
      webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          msgtype: "text",
          text: {
            content: "直播总结已生成\n\nNotion：https://www.notion.so/0123",
          },
        }),
      }),
    );
  });
});
