import { exec } from "child_process";

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

export const escaped = (s: string) => {
  s = s.replaceAll("\\", "/");
  s = s.replaceAll(":", "\\\\:");
  return s;
};
