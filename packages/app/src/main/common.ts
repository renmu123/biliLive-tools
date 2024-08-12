import os from "os";
import path from "path";

export const getTempPath = () => {
  return path.join(os.tmpdir(), "biliLive-tools");
};

export const commonHandlers = {
  "common:getTempPath": () => {
    return getTempPath();
  },
};
