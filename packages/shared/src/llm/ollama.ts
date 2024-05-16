import ollama, { Ollama } from "ollama";

function getModelList(host: string) {
  const ollama = new Ollama({ host });
  return ollama.list();
}

export default {
  getModelList,
};
