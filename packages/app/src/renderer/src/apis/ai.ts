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

const songRecognize = async (
  file: string,
  startTime: number,
  endTime: number,
): Promise<{
  lyrics: string;
  name: string;
}> => {
  const res = await request.post("/ai/song_recognize", {
    file,
    startTime,
    endTime,
  });
  return res.data;
};

const ai = {
  asrRecognize,
  llm,
  songRecognize,
};

export default ai;
