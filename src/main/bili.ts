import fs from "fs-extra";

import { Client } from "@renmu/bili-api";
import { BILIUP_COOKIE_PATH } from "./appConstant";
import { type IpcMainInvokeEvent } from "electron";

type ClientInstance = InstanceType<typeof Client>;

const client = new Client();
client.loadCookieFile(BILIUP_COOKIE_PATH);

async function loadCookie() {
  if (await fs.pathExists(BILIUP_COOKIE_PATH)) {
    await client.loadCookieFile(BILIUP_COOKIE_PATH);
  }
}

async function getArchives(
  _event: IpcMainInvokeEvent,
  params: Parameters<ClientInstance["getArchives"]>[0],
): ReturnType<ClientInstance["getArchives"]> {
  await loadCookie();
  return client.getArchives(params);
}

async function checkTag(
  _event: IpcMainInvokeEvent,
  tag: string,
): ReturnType<ClientInstance["checkTag"]> {
  await loadCookie();
  return client.checkTag(tag);
}

async function getMyInfo(): ReturnType<ClientInstance["getMyInfo"]> {
  await loadCookie();
  return client.getMyInfo();
}

export default {
  getArchives,
  checkTag,
  getMyInfo,
  client,
};
