#!/usr/bin/env node
// Cross-platform helper for CI artifact-related tasks (ESM).
// Usage examples:
//   node ./scripts/github-ci-artifacts.js check-prebuilt --path packages/CLI/lib

import fs from "node:fs";
import path from "node:path";

function appendGithubOutput(name, value) {
  try {
    const out = process.env.GITHUB_OUTPUT;
    if (out) {
      fs.appendFileSync(out, `${name}=${value}\n`);
    }
  } catch (e) {
    console.warn("[github-ci-artifacts] failed to write GITHUB_OUTPUT:", e?.message || e);
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
  console.log(
    `github-ci-artifacts helper\n\n` +
      `Commands:\n` +
      `  check-prebuilt [--path <dir>]  Check if directory exists and is non-empty; writes found=true/false to GITHUB_OUTPUT.\n` +
      `  validate-release --tag <tag> [--name <name>]  Validate required inputs for release; outputs sanitized values.\n` +
      `\nExamples:\n` +
      `  node ./scripts/github-ci-artifacts.js check-prebuilt --path packages/CLI/lib\n`,
  );
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
      process.exit(0);
      return;
    }
    case "validate-release": {
      const tag = (flags.tag ?? "").trim();
      let name = (flags.name ?? "").trim();
      if (!tag) {
        console.error("[github-ci-artifacts] release_tag is required when is_release=true");
        process.exit(1);
        return;
      }
      if (!name) name = tag;
      console.log(`[github-ci-artifacts] release inputs ok, tag='${tag}', name='${name}'`);
      appendGithubOutput("release_tag", tag);
      appendGithubOutput("release_name", name);
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

