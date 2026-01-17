import request from "./request";

const asrRecognize = async () => {
  const res = await request.post("/ai/asr");
  return res.data;
};

const llm = async (message: string, systemPrompt?: string) => {
  const res = await request.post("/ai/llm", {
    message,
    systemPrompt,
  });
  return res.data;
};

const ai = {
  asrRecognize,
  llm,
};

export default ai;
