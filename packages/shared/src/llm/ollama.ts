// import { appConfig } from "../index.js";

import { Ollama } from "ollama";

function getModelList(host: string) {
  const ollama = new Ollama({ host });
  return ollama.list();
}

function chat(params: { model: string; messages: any[]; options: any }) {
  const host = "http://localhost:1300";
  const ollama = new Ollama({ host: host });
  return ollama.chat({
    model: params.model,
    messages: params.messages,
    options: params.options,
  });
}

export default {
  getModelList,
  chat,
};
