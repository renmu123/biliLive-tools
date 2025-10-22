#!/usr/bin/env node
// Cross-platform helper for CI artifact-related tasks.
// Usage examples:
//   node ./scripts/github-ci-artifacts.cjs check-prebuilt --path packages/CLI/lib

const fs = require("fs");
const path = require("path");

function appendGithubOutput(name, value) {
  try {
    const out = process.env.GITHUB_OUTPUT;
    if (out) {
      fs.appendFileSync(out, `${name}=${value}\n`);
    }
  } catch (e) {
    console.warn("[github-ci-artifacts] failed to write GITHUB_OUTPUT:", e && e.message ? e.message : e);
  }
}

function isDirNonEmpty(dir) {
  try {
    const stat = fs.existsSync(dir) && fs.statSync(dir);
    if (!stat || !stat.isDirectory()) return false;
    const entries = fs.readdirSync(dir);
    return entries && entries.length > 0;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const action = args[0];
  const res = { action, flags: {} };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") res.flags.help = true;
    else if (a === "--path" || a === "-p") {
      res.flags.path = args[i + 1];
      i++;
    } else if (a.startsWith("--path=")) {
      res.flags.path = a.slice("--path=".length);
    } else {
      // ignore unknown flags for forward-compatibility
    }
  }
  return res;
}

function printHelp() {
  console.log(`github-ci-artifacts helper\n\n` +
    `Commands:\n` +
    `  check-prebuilt [--path <dir>]  Check if directory exists and is non-empty; writes found=true/false to GITHUB_OUTPUT.\n` +
    `\nExamples:\n` +
    `  node ./scripts/github-ci-artifacts.cjs check-prebuilt --path packages/CLI/lib\n`);
}

async function main() {
  const { action, flags } = parseArgs(process.argv);
  if (!action || flags.help) {
    printHelp();
    process.exit(action ? 0 : 1);
    return;
  }

  switch (action) {
    case "check-prebuilt": {
      const dir = flags.path || path.join("packages", "CLI", "lib");
      const found = isDirNonEmpty(dir);
      console.log(`[github-ci-artifacts] prebuilt exists in '${dir}':`, found);
      appendGithubOutput("found", String(found));
      // Do not fail the step; consumers can branch on the output.
      process.exit(0);
      return;
    }
    default:
      console.error(`[github-ci-artifacts] Unknown action: ${action}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((e) => {
  console.error("[github-ci-artifacts] Unexpected error:", e);
  process.exit(1);
});
