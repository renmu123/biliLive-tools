import request from "./request";

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

const danma = {
  mergeXml,
  parseForArtPlayer,
};

export default danma;
