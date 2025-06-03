export interface StreamResult {
  flv: {
    name: string;
    url: string;
  }[];
  hls: {
    name: string;
    url: string;
  }[];
}

export interface StreamProfile {
  desc: string;
  bitRate: number;
}

export interface SourceProfile {
  name: string;
  url: string;
}
