import axios from "axios";

import { utils } from "@bililive-tools/manager";
import { assert, getFormatSources } from "./utils.js";
import { initInfo } from "./anticode.js";
import type { Recorder } from "@bililive-tools/manager";

import type { StreamResult, StreamProfile } from "./types.js";

const requester = axios.create({
  timeout: 10e3,
});

export async function getRoomInfo(
  roomIdOrShortId: string,
  opts: {
    formatPriorities?: Array<"flv" | "hls">;
    quality?: Recorder["quality"];
  } = {},
) {
  const res = await requester.get<string>(`https://www.huya.com/${roomIdOrShortId}`);
  const html = res.data;
  const match = html.match(/var hyPlayerConfig = ({[^]+?};)/);
  const hyPlayerConfigString = match?.[1];

  const hyPlayerConfig: HYPlayerConfig = new Function(`return ${hyPlayerConfigString}`)();
  assert(hyPlayerConfig, `Unexpected resp, hyPlayerConfig is null`);

  // console.log(JSON.stringify(hyPlayerConfig, null, 2));

  const { vMultiStreamInfo } = hyPlayerConfig.stream;
  const streams: StreamProfile[] = vMultiStreamInfo.map((info) => ({
    desc: info.sDisplayName,
    bitRate: info.iBitRate,
  }));
  streams.push({ desc: "真原画", bitRate: -1 });

  const data = hyPlayerConfig.stream.data[0];
  assert(data, `Unexpected resp, data is null`);

  const sources = {
    flv: [],
    hls: [],
  } as StreamResult;

  // const sources: SourceProfile[] = data.gameStreamInfoList.map((info) => ({
  //   name: info.sCdnType,
  //   url: initInfo({
  //     sFlvUrl: info.sFlvUrl,
  //     sStreamName: info.sStreamName,
  //     sFlvAntiCode: info.sFlvAntiCode,
  //     _sessionId: Date.now(),
  //   }),
  // }));
  for (const item of data?.gameStreamInfoList ?? []) {
    if (item.sFlvAntiCode && item.sFlvAntiCode.length > 0) {
      let sStreamName = item.sStreamName;
      if (opts.quality === -1) {
        sStreamName = sStreamName.replace("-imgplus", "");
      }
      const url = initInfo({
        baseUrl: item.sFlvUrl,
        sStreamName: sStreamName,
        antiCode: item.sFlvAntiCode,
        suffix: item.sFlvUrlSuffix,
        _sessionId: Date.now(),
      });
      sources.flv.push({
        name: item.sCdnType,
        url,
      });
    }
    if (item.sHlsAntiCode && item.sHlsAntiCode.length > 0) {
      let sStreamName = item.sStreamName;
      if (opts.quality === -1) {
        sStreamName = sStreamName.replace("-imgplus", "");
      }
      const url = initInfo({
        baseUrl: item.sHlsUrl,
        sStreamName: sStreamName,
        antiCode: item.sHlsAntiCode,
        suffix: item.sHlsUrlSuffix,
        _sessionId: Date.now(),
      });
      sources.hls.push({
        name: item.sCdnType,
        url,
      });
    }
  }

  const startTime = new Date(data.gameLiveInfo?.startTime * 1000);
  const formatSources = getFormatSources(sources, opts.formatPriorities);
  return {
    living: vMultiStreamInfo.length > 0 && data.gameStreamInfoList.length > 0,
    id: data.gameLiveInfo.profileRoom,
    owner: data.gameLiveInfo.nick,
    title: data.gameLiveInfo.introduction,
    roomId: data.gameLiveInfo.profileRoom,
    avatar: data.gameLiveInfo.avatar180,
    cover: data.gameLiveInfo.screenshot,
    streams,
    sources: formatSources?.sources ?? [],
    startTime,
    liveId: utils.md5(`${roomIdOrShortId}-${startTime?.getTime()}`),
    gid: data.gameLiveInfo.gid,
  };
}

interface HYPlayerConfig {
  html5: number;
  WEBYYSWF: string;
  vappid: number;
  stream: {
    count: number;
    data: {
      gameLiveInfo: {
        activityCount: number;
        activityId: number;
        attendeeCount: number;
        avatar180: string;
        bitRate: number;
        bussType: number;
        cameraOpen: number;
        channel: number;
        codecType: number;
        contentIntro: string;
        gameFullName: string;
        gameHostName: string;
        gameType: number;
        gid: number;
        introduction: string;
        isSecret: number;
        level: number;
        liveChannel: number;
        liveCompatibleFlag: number;
        liveId: string;
        liveSourceType: number;
        multiStreamFlag: number;
        nick: string;
        privateHost: string;
        profileHomeHost: string;
        profileRoom: number;
        recommendStatus: number;
        recommendTagName: string;
        roomName: string;
        screenType: number;
        screenshot: string;
        sex: number;
        shortChannel: number;
        startTime: number;
        totalCount: number;
        uid: number;
        yyid: number;
      };
      gameStreamInfoList: {
        iIsHEVCSupport: number;
        iIsMaster: number;
        iIsMultiStream: number;
        iIsP2PSupport: number;
        iLineIndex: number;
        iMobilePriorityRate: number;
        iPCPriorityRate: number;
        iWebPriorityRate: number;
        lChannelId: number;
        lFreeFlag: number;
        lPresenterUid: number;
        lSubChannelId: number;
        lTimespan: string;
        mpExtArgs: unknown;
        sCdnType: "WS";
        sFlvAntiCode: string;
        sFlvUrl: string;
        sFlvUrlSuffix: string;
        sHlsAntiCode: string;
        sHlsUrl: string;
        sHlsUrlSuffix: string;
        sP2pAntiCode: string;
        sP2pUrl: string;
        sP2pUrlSuffix: string;
        sStreamName: string;
        vFlvIPList: unknown;
        vP2pIPList: unknown;
        _classname: string;
      }[];
    }[];
    iFrameRate: number;
    iWebDefaultBitRate: number;
    vMultiStreamInfo: {
      iBitRate: number;
      iCodecType: number;
      iCompatibleFlag: number;
      iHEVCBitRate: number;
      sDisplayName: string;
      _classname: string;
    }[];
  };
}
