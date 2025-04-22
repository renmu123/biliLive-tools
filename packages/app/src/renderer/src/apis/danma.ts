import request from "./request";

export const mergeXml = async (
  inputFiles: { videoPath: string; danmakuPath: string }[],
  options: {
    output?: string;
    saveOriginPath: boolean;
  },
) => {
  const res = await request.post("/danma/mergeXml", {
    inputFiles,
    options,
  });
  return res.data;
};

const danma = {
  mergeXml,
};

export default danma;
