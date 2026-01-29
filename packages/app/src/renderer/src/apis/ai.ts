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

const subtitleRecognize = async (
  file: string,
  startTime: number,
  endTime: number,
  vendorId: string,
  options?: {
    offset?: number;
  },
): Promise<{
  srt: string;
}> => {
  const res = await request.post("/ai/subtitle", {
    file,
    vendorId,
    startTime,
    endTime,
    offset: options?.offset,
  });
  return res.data;
};

const ai = {
  asrRecognize,
  llm,
  songRecognize,
  subtitleRecognize,
};

export default ai;
