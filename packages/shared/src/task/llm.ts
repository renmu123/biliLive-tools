import fs from "fs-extra";
import { stringifySync, parseSync } from "subtitle";
import ollama from "../llm/ollama.js";

import type { NodeList } from "subtitle";

async function addTranslateTask(input: string, output: string) {
  return handleSrt(input, output);
  return {
    task: "translate",
    data: {
      text: "Hello World",
      from: "en",
      to: "es",
    },
  };
}

/**
 * 解析srt文件
 */
async function parseSrt(file: string): Promise<NodeList> {
  console.log("file", file);
  const content = await fs.readFile(file);
  const nodes = parseSync(content.toString());
  nodes.map((node) => {
    if (node.type === "cue") {
      node.data.text = node.data.text.replace(/\n/g, " ");
    }
  });
  return nodes;
}

/**
 * 写入srt文件
 */
function writeSrt(file: string, nodes: NodeList) {
  const srt = stringifySync(nodes, { format: "SRT" });
  console.log(srt);
  fs.writeFileSync(file, srt);
}

async function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

/**
 * 处理srt字幕
 */
async function handleSrt(input: string, output: string) {
  const nodes = await parseSrt(input);
  const system = [
    {
      role: "system",
      content: `
请将以下英文文本翻译成中文：
翻译要求：
确保翻译后的中文文本准确地传达原文的意思，不漏译、不错译。
不要添加额外细节，不要在翻译中添加原文中没有的内容。
使用之前的文字作为翻译参考，确保翻译风格一致。
除翻译外不要有多余的输出`,
    },
  ];
  const messages = [];
  for (const node of nodes) {
    if (node.type === "cue") {
      // 增加重试机制
      const response = await ollama.chat({
        model: "qwen:14b",
        messages: [...system, ...messages, { role: "user", content: node.data.text }],
        options: {
          temperature: 0.1,
        },
      });
      node.data.text = response.message.content;
      console.log("111111111111123", response);

      if (messages.length >= 6) {
        messages.shift();
        messages.shift();
      }
      messages.push({ role: "user", content: node.data.text });
      messages.push({ role: "assistant", content: `${node.data.text}` });
      console.log("111111111111", messages.length);

      // console.log(node.data.text);
      sleep(1000);
    }
  }
  writeSrt(output, nodes);
  return nodes;
}

const srt = {
  parseSrt,
  writeSrt,
  handleSrt,
};

export { addTranslateTask, srt };
