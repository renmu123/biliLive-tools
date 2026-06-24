import request from "./request";

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

export const getParsedContentById = async (
  danmaId: string,
): Promise<{
  danmaType: "ass" | "xml";
  content: string | ArtplayerDanmuItem[];
}> => {
  const res = await request.get(`/danma/content/${danmaId}`);
  return res.data;
};

const danma = {
  mergeXml,
  parseForArtPlayer,
  getParsedContentById,
};

export default danma;
