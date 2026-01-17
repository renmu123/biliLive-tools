import request from "./request";

const asrRecognize = async () => {
  const res = await request.post("/ai/asr");
  return res.data;
};

const ai = {
  asrRecognize,
};

export default ai;
