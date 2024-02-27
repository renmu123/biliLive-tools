import { exec } from "child_process";
import fs from "fs-extra";

export const executeCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, {}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export const uuid = () => {
  return Math.random().toString(36).slice(2);
};
export const pathExists = async (path: string) => {
  return await fs.pathExists(path);
};

export async function getFileSize(filePath: string) {
  const stats = await fs.promises.stat(filePath);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

type IterationCallback = (counter: number) => Promise<boolean>;
export async function runWithMaxIterations(
  callback: IterationCallback,
  interval: number,
  maxIterations: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let counter = 0;

    const intervalId = setInterval(async () => {
      if (counter < maxIterations) {
        if (!(await callback(counter))) {
          clearInterval(intervalId);
          resolve();
        }
        counter++;
      } else {
        clearInterval(intervalId);
        resolve();
      }
    }, interval);
  });
}
