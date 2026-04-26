import request from "./request";

import type { StreamerDetailAPI } from "@biliLive-tools/http/types/streamerDetail.js";

const query = async (
  params: StreamerDetailAPI["query"]["Args"],
): Promise<StreamerDetailAPI["query"]["Resp"]> => {
  const res = await request.get(`/streamerDetail/list`, { params });
  return res.data.payload;
};

export default {
  query,
};
