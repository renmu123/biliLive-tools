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

import { APP_DEFAULT_CONFIG } from "../src/enum.js";
import { _send, sendByFeishuBot, sendByWeComBot } from "../src/notify.js";

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

describe("notify dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ ok: true });
  });

  it("sends one notification to every configured notification type", async () => {
    const config = {
      ...APP_DEFAULT_CONFIG,
      notification: {
        ...APP_DEFAULT_CONFIG.notification,
        setting: {
          ...APP_DEFAULT_CONFIG.notification.setting,
          feishuBot: {
            webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/token",
          },
          wecomBot: {
            webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
          },
        },
      },
    };

    await _send("标题", "内容", config, ["feishuBot", "wecomBot"]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://open.feishu.cn/open-apis/bot/v2/hook/token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("attempts later notification types when an earlier one fails", async () => {
    const config = {
      ...APP_DEFAULT_CONFIG,
      notification: {
        ...APP_DEFAULT_CONFIG.notification,
        setting: {
          ...APP_DEFAULT_CONFIG.notification.setting,
          feishuBot: {
            webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/token",
          },
          wecomBot: {
            webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
          },
        },
      },
    };
    fetchMock.mockRejectedValueOnce(new Error("feishu failed")).mockResolvedValueOnce({ ok: true });

    await expect(_send("标题", "内容", config, ["feishuBot", "wecomBot"])).rejects.toThrow(
      "通知发送失败：feishuBot",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=token",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
