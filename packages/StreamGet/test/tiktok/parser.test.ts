import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http.js";
import { TikTokParser } from "../../src/tiktok/parser.js";
import type { TikTokResponse } from "../../src/tiktok/types.js";

function makeStreamData(codec = "H264") {
  return {
    pull_data: {
      stream_data: JSON.stringify({
        data: {
          origin: {
            main: {
              flv: "https://example.com/live/origin.flv",
              hls: "https://example.com/live/origin.m3u8?token=abc",
              sdk_params: JSON.stringify({
                VCodec: codec,
                definition: "origin",
                resolution: "1920x1080",
                vbitrate: 6000000,
              }),
            },
          },
          hd: {
            main: {
              flv: "https://example.com/live/hd.flv",
              hls: "https://example.com/live/hd.m3u8",
              sdk_params: JSON.stringify({
                VCodec: codec,
                definition: "hd",
                resolution: "1280x720",
                vbitrate: 3000000,
              }),
            },
          },
        },
      }),
    },
  };
}

function makeLiveResponse(): TikTokResponse {
  return {
    data: {
      user: {
        nickname: "主播",
        uniqueId: "example",
        status: 2,
        avatarThumb: "https://example.com/avatar.jpg",
        avatarMedium: "https://example.com/avatar.jpg",
        avatarLarger: "https://example.com/avatar.jpg",
      },
      liveRoom: {
        title: "测试直播",
        startTime: 1710000000,
        coverUrl: "https://example.com/cover.jpg",
        streamData: makeStreamData(),
        hevcStreamData: makeStreamData("H265"),
      },
    },
  };
}

describe("TikTokParser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("解析标准直播链接和用户 ID", async () => {
    const parser = new TikTokParser();

    await expect(parser.extractRoomId("https://www.tiktok.com/@example/live")).resolves.toBe(
      "example",
    );
    await expect(parser.extractRoomId("@example")).resolves.toBe("example");
  });

  it("从 app 接口解析直播信息和全部画质", async () => {
    // vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const parser = new TikTokParser();

    const result = await parser.getStreams("ocomelover0214", {
      api: "app",
      hevc: true,
      // cookie:
      //   "ttwid=1%7CItBq58-RE3hsfSRU48sKlQ_RFoQzqFVdHdFMWvDIoYQ%7C1784908775%7Ca0273aed265df31485b27f1d1a0dab9611b5b223f47df2dd66500257bf7ad62f; tt_chain_token=YMLx3yv3mMY7EKlvDl8l7A==; msToken=SilGOMKhrP_vg3m--YRQyBLTiVmNLWV7uSFMceg1HesZGfbDqGC56EI8CVdVlZ9lNAhFeFgp3-Op7vVqkd4FTaXZmi5kRF_EGybySubEYI6eG6NwUslLtiW_wma-FIZkWiyvX8JM0F354g98J2oYqa-fFVtOTA==; odin_tt=7baeaad02e60685d0136139d4876429d4bfa2211b16eb7e52e5e41575eddf4d01e08c363b80f70c7eabe4d9f834764aed6d4d3d3b9d1e37b4404119dc2ae749fad831dad5ba98b3bdce3a7009ef45052; tt_csrf_token=gKjbi9Yz-ELpJpX3ma4Ma0y9O06s0DUqPluY; csrfToken=aiouAu5z-oNp3MNvaz-GnUHdYHO2ivSnolQA; s_v_web_id=verify_mrzzmgnd_x7HVWhnd_PIop_47Ci_9cpq_IEkr0Vjtesyq; multi_sids=7666125918078764053%3A2b028ceebf1c972ab1c8bc94d55026bb; cmpl_token=AgQYAPOq_hfkTtK6XWJAXrLdLPACEtBG17-DIWCmaJA; passport_auth_status=9bc3cd26b6189c496c595a5de9fcbac9%2C; passport_auth_status_ss=9bc3cd26b6189c496c595a5de9fcbac9%2C; sid_guard=2b028ceebf1c972ab1c8bc94d55026bb%7C1784960893%7C15552000%7CThu%2C+21-Jan-2027+06%3A28%3A13+GMT; uid_tt=b7cb11e4bb68c4c07a15fe2dceae40f6a3a223ef2d13bdb74eed48b430803a71; uid_tt_ss=b7cb11e4bb68c4c07a15fe2dceae40f6a3a223ef2d13bdb74eed48b430803a71; sid_tt=2b028ceebf1c972ab1c8bc94d55026bb; sessionid=2b028ceebf1c972ab1c8bc94d55026bb; sessionid_ss=2b028ceebf1c972ab1c8bc94d55026bb; tt_session_tlb_tag=sttt%7C4%7CKwKM7r8clyqxyLyU1VAmu__________QLJzMC7iQLvVaAZcprzxpp2C9YvPs1TBFD9t3ixYmQE8%3D; sid_ucp_v1=1.0.1-KDdkNTI4MTU5MTYwOTZjYWVkMmZiMzc3YzY1Y2I5YTU1YTM4ODBlOWQKIQiViIC0_ZzjsWoQ_a6R0wYYswsgDDD4mY7TBjgIQBJIBBADGgNteTIiIDJiMDI4Y2VlYmYxYzk3MmFiMWM4YmM5NGQ1NTAyNmJiMk4KIJhXEZcDt1zagvJUxV8lGR_7hVGPdybJbXgBY6df7cVOEiA8W43Ot03Em5u1CUKSENBsw4I9yGoVGjEkQ1wBkZ3YaBgCIgZ0aWt0b2s; ssid_ucp_v1=1.0.1-KDdkNTI4MTU5MTYwOTZjYWVkMmZiMzc3YzY1Y2I5YTU1YTM4ODBlOWQKIQiViIC0_ZzjsWoQ_a6R0wYYswsgDDD4mY7TBjgIQBJIBBADGgNteTIiIDJiMDI4Y2VlYmYxYzk3MmFiMWM4YmM5NGQ1NTAyNmJiMk4KIJhXEZcDt1zagvJUxV8lGR_7hVGPdybJbXgBY6df7cVOEiA8W43Ot03Em5u1CUKSENBsw4I9yGoVGjEkQ1wBkZ3YaBgCIgZ0aWt0b2s; store-idc=alisg; store-country-sign=MEIEDKOvQNtMAdT0TNXH0AQgbqNI1t36c9sYXFRYzevWrWIY6Obsl-2Hpg7D5XPzdScEEOLFnj9vvdJUU02eCYtcjrY; store-country-code=jp; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=n767dlQTu-de4oSxlYus7a_uJmPdsR96DLGPQxIdf2Pjevf45lh8CkPIvLj3uAV45TKBYbyuYk1vz8k8_DOnjqTVSWa1e4mQCQV1YkchahxtTxOWRsUxCkQEOEONWO5h7bNnWm1EQcMyJCT0JGOcPFe7ZSeKfeKUxxrmrMCpd88CHhJgdW3aNy69Xizp8FTvAMhdofT18mu2HCzc6Pe_HH0wsoKWxDy5KYBb3Z0yusfnaXeTXiFIMkVh0jk4TR0QO9aOnV0Gp1uwsmuTCpE6pnaea7LVoq9FrbooJJj_4b3aPeLQkiQD3JQOWM1eZoHF2DtPoFZQ2b3xo2Rh9laZNNUVCNOEkpkofr7regK0lSX0hr4SeqjPrUWWA6Iq46QTQv1p-Ei2QLQai-C3SYz2aWHawOaKB53eKvDmSxv0oBqHQfMuAHtHLyrPThgeG6W3R-fyC9V6zPHMdzDGZXtRPRmmwzU-zOpdgMUL6eHiCCNQZwhjnJ0cFSE8lrGr5JYm",
    });
    console.log(JSON.stringify(result, null, 2));
    // expect(result.liveInfo).toMatchObject({
    //   platform: "tiktok",
    //   roomId: "example",
    //   living: true,
    //   title: "测试直播",
    //   owner: "主播",
    //   avatar: "https://example.com/avatar.jpg",
    //   cover: "https://example.com/cover.jpg",
    // });
    // expect(result.sources).toHaveLength(1);
    // expect(result.sources[0].streams).toHaveLength(4);
    // expect(result.sources[0].streams[0]).toMatchObject({
    //   quality: "origin",
    //   qualityDesc: "origin",
    //   format: "flv",
    //   codec: "H264",
    //   bitrate: 6000000,
    //   resolution: "1920x1080",
    //   url: "https://example.com/live/origin.flv?codec=H264",
    // });
    // expect(result.sources[0].streams[1].url).toBe(
    //   "https://example.com/live/origin.m3u8?token=abc&codec=H264",
    // );
    // expect(HttpClient.prototype.get).toHaveBeenCalledOnce();
  });

  it("支持 HEVC 和格式筛选", async () => {
    vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const parser = new TikTokParser();

    const streams = await parser.getStreams("example", {
      api: "app",
      format: ["hls"],
      hevc: true,
    });

    expect(streams[0].streams).toHaveLength(2);
    expect(streams[0].streams.every((stream) => stream.format === "hls")).toBe(true);
    expect(streams[0].streams.every((stream) => stream.codec === "H265")).toBe(true);
  });

  it("未开播时返回空流列表", async () => {
    const response = makeLiveResponse();
    response.data!.user!.status = 4;
    vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(response);
    const parser = new TikTokParser();

    const result = await parser.parse("example", { api: "app" });

    expect(result.liveInfo.living).toBe(false);
    expect(result.sources).toEqual([]);
  });

  it("支持网页 SIGI_STATE 数据", async () => {
    const response: TikTokResponse = {
      LiveRoom: { liveRoomUserInfo: makeLiveResponse().data! },
    };
    vi.spyOn(HttpClient.prototype, "getText").mockResolvedValue(
      `<html><script type="application/json" id="SIGI_STATE">${JSON.stringify(response)}</script></html>`,
    );
    const parser = new TikTokParser();

    const info = await parser.getRoomInfo("example", { api: "web" });

    expect(info.living).toBe(true);
    expect(info.title).toBe("测试直播");
  });
});
