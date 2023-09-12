import { join } from "path";
import { spawn } from "child_process";

const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);

const uploadVideo = () => {
  const biliup = spawn(BILIUP_PATH, ["-h"]);
  biliup.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  biliup.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  biliup.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
};
uploadVideo();
