import axios from "axios";

import type { AxiosInstance } from "axios";

export default class BiliApi {
  _request: AxiosInstance;
  constructor(cookie: string) {
    const instance = axios.create({
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/63.0.3239.108",
        Referer: "https://www.bilibili.com/",
        Connection: "keep-alive",
        Cookie: cookie,
      },
    });

    instance.interceptors.response.use((response) => {
      return response.data;
    });
    this._request = instance;
  }
  checkTag(tag: string) {
    return this._request.get(`https://member.bilibili.com/x/vupre/web/topic/tag/check`, {
      params: {
        tag: tag,
      },
    });
  }
}
