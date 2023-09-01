import type { File, OriginFile } from "../types";
import { parse } from "path";
import { exec } from "child_process";
import iconv from "iconv-lite";

export const formatFile = (file: OriginFile): File => {
  const filename = file.name;
  const path = file.path;

  const data = parse(path);

  return {
    ...data,
    filename,
    path,
  };
};

export const executeCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: "buffer" }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        const stdoutUtf8 = iconv.decode(stdout, "cp936");
        const stderrUtf8 = iconv.decode(stderr, "cp936");
        resolve({ stdout: stdoutUtf8, stderr: stderrUtf8 });
      }
    });
  });
};
