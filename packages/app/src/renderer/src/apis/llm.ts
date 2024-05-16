import request from "./request";

export const getModelList = async (baseUrl: string): Promise<string[]> => {
  return request.get(`/llm/ollama/modelList`, {
    params: {
      baseUrl,
    },
  });
};
