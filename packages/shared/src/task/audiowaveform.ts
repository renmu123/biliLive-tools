import { spawn } from "node:child_process";
import logger from "../utils/log.js";

import { getBinPath } from "./video.js";

export function generateAudioWaveform(
  audioFilePath: string,
  outputJsonPath: string,
): Promise<void> {
  const { audiowaveformPath } = getBinPath();
  return new Promise((resolve, reject) => {
    const args = ["-i", audioFilePath, "-o", outputJsonPath];
    const process = spawn(audiowaveformPath, args);
    logger.info(`audiowaveform process started: ${audiowaveformPath} ${args.join(" ")}`);
    process.on("error", (err) => {
      logger.error("audiowaveform process error:", err);
      reject(err);
    });
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}
