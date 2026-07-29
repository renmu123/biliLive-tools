import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HttpClient } from "../src/http.js";

describe("HttpClient.getText", () => {
  const html = "<html><title>斗鱼直播</title></html>";
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "Content-Encoding": "gzip",
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(gzipSync(html));
  });
  let url: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("测试服务器启动失败");
    url = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it("解压 gzip 响应后再解码文本", async () => {
    await expect(new HttpClient().getText(url)).resolves.toBe(html);
  });
});
