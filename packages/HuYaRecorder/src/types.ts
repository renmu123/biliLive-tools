export interface StreamResult {
  flv: SourceProfile[];
  hls: SourceProfile[];
}

export interface StreamProfile {
  desc: string;
  bitRate: number;
}

export interface SourceProfile {
  name: string;
  url: string;
  streamName: string;
  presenterUid: number;
  subChannelId: number;
  channelId: number;
  suffix: string;
}
