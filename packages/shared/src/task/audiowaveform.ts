import { spawn } from "node:child_process";

import { getBinPath } from "./video.js";

export function generateAudioWaveform(
  audioFilePath: string,
  outputJsonPath: string,
): Promise<void> {
  const { audiowaveformPath } = getBinPath();
  return new Promise((resolve, reject) => {
    const args = ["-i", audioFilePath, "-o", outputJsonPath];
    const process = spawn(audiowaveformPath, args);

    process.on("error", (err) => {
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
