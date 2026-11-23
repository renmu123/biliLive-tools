import request from "./request";
import type { SuperChatItem } from "@renderer/components/Artplayer/artplayer-plugin-sc";

export interface ArtplayerDanmuItem {
  text: string;
  time: number;
  mode: 0 | 1 | 2;
  color: string;
  border: boolean;
  style: {};
}

export const mergeXml = async (
  inputFiles: { videoPath: string; danmakuPath: string }[],
  options: {
    output?: string;
    saveOriginPath: boolean;
    saveMeta?: boolean;
  },
) => {
  const res = await request.post("/danma/mergeXml", {
    inputFiles,
    options,
  });
  return res.data;
};

export const parseForArtPlayer = async (filepath: string) => {
  const res = await request.post("/danma/parseForArtPlayer", {
    filepath,
  });
  return res.data;
};

export const parseSCForArtPlayer = async (filepath: string): Promise<SuperChatItem[]> => {
  const res = await request.post("/danma/parseSCForArtPlayer", { filepath });
  return res.data;
};

export const getParsedContentById = async (
  danmaId: string,
): Promise<{
  danmaType: "ass" | "xml";
  content: string | ArtplayerDanmuItem[];
  sc?: SuperChatItem[];
}> => {
  const res = await request.get(`/danma/content/${danmaId}`);
  return res.data;
};

const danma = {
  mergeXml,
  parseForArtPlayer,
  parseSCForArtPlayer,
  getParsedContentById,
};

export default danma;
