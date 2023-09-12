const { spawn } = require("child_process");
const { join } = require("path");

const BILIUP_PATH = join(__dirname, "../../../resources/bin/biliup.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);

class Biliup {
  constructor() {
    this.params = [];
  }

  uploadVideo(videoPath) {
    this.biliup = spawn(BILIUP_PATH, ["upload", videoPath]);
    this.biliup.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    this.biliup.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    this.biliup.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
  addParam(key, value) {
    this.params.push(key);
    this.params.push(value);
  }
}

// const uploadVideo = () => {
//   const biliup = spawn(BILIUP_PATH, ["upload", "aa.mp4"]);
//   biliup.stdout.on("data", (data) => {
//     console.log(`stdout: ${data}`);
//   });

//   biliup.stderr.on("data", (data) => {
//     console.error(`stderr: ${data}`);
//   });

//   biliup.on("close", (code) => {
//     console.log(`child process exited with code ${code}`);
//   });
// };
// uploadVideo();

const biliup = new Biliup();
biliup.uploadVideo("aa.mp4");
