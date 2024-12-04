import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  // 移除package.json中的devDependencies
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  delete packageJson.devDependencies;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

main();
