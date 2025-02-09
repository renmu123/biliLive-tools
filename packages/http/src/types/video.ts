type Platform = "douyu" | "bilibili" | "huya";

export type VideoAPI = {
  parseVideo: {
    Args: { url: string };
    Resp: {
      platform: Platform;
      videoId: string;
      title: string;
      resolutions: { label: string; value: string }[];
      parts: { name: string; partId: string; isEditing: boolean; extra?: Record<string, any> }[];
      extra?: Record<string, any>;
    };
  };
  downloadVideo: {
    Args: {
      id: string;
      platform: Platform;
      savePath: string;
      filename: string;
      resolution?: string;
      extra?: Record<string, any>;
      danmu: "none" | "xml";
      override: boolean;
      onlyAudio?: boolean;
    };
  };
};
