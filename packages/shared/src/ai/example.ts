// /**
//  * 使用通义千问 LLM 示例
//  */
// export async function llm(
//   message: string,
//   systemPrompt?: string,
//   opts: {
//     key?: string;
//     enableSearch?: boolean;
//     jsonResponse?: boolean;
//     stream?: boolean;
//   } = {},
// ) {
//   console.log("=== 示例: 使用通义千问 LLM ===");
//   const apiKey = opts.key ?? getApiKey();

//   const llm = new QwenLLM({
//     apiKey: apiKey,
//     model: "qwen-plus",
//   });

//   try {
//     // const testData = fs.readFileSync(
//     //   "C:\\Users\\renmu\\Downloads\\新建文件夹 (2)\\cleaned_data.json",
//     // );
//     // console.log("读取测试数据，长度:", message + testData, testData.length);
//     const response = await llm.sendMessage(message, systemPrompt, {
//       // responseFormat: zodResponseFormat(Song, "song"),
//       enableSearch: opts.enableSearch ?? false,
//       responseFormat: opts.jsonResponse ? { type: "json_object" } : undefined,
//       // @ts-ignore
//       stream: opts.stream ?? undefined,
//       searchOptions: {
//         forcedSearch: opts.enableSearch ?? false,
//       },
//     });

//     if ("content" in response) {
//       logger.info("LLM 请求成功", JSON.stringify(response));
//       // console.log("提问:", response);
//       // console.log("回复:", response.content);
//       // console.log("Token 使用:", response.usage);
//       return response;
//     }
//     throw new Error("LLM 未返回预期的响应内容");
//   } catch (error) {
//     console.error("LLM 请求失败:", error);
//     throw error;
//   }
// }
