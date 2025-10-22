#!/usr/bin/env node
// Cross-platform helper for CI artifact-related tasks (ESM).
// Usage examples:
//   node ./scripts/github-ci-artifacts.js check-prebuilt --path packages/CLI/lib

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

async function ghRequest(method, urlPath, body) {
  const repo = process.env.GITHUB_REPOSITORY || "";
  const token = process.env.GITHUB_TOKEN || process.env.TOKEN || "";
  if (!repo || !token) {
    throw new Error("GITHUB_REPOSITORY or GITHUB_TOKEN is not set in environment");
  }
  const [owner, repoName] = repo.split("/");
  const api = `https://api.github.com/repos/${owner}/${repoName}${urlPath}`;
  const res = await fetch(api, {
    method,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": body ? "application/json" : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

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
    } else if (a === "--tag" || a === "-t") {
      res.flags.tag = args[i + 1] ?? "";
      i++;
    } else if (a.startsWith("--tag=")) {
      res.flags.tag = a.slice("--tag=".length);
    } else if (a === "--name" || a === "-n") {
      res.flags.name = args[i + 1] ?? "";
      i++;
    } else if (a.startsWith("--name=")) {
      res.flags.name = a.slice("--name=".length);
    } else if (a === "--sha") {
      res.flags.sha = args[i + 1] ?? "";
      i++;
    } else if (a.startsWith("--sha=")) {
      res.flags.sha = a.slice("--sha=".length);
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
      `  check-release --tag <tag>  Check if a release and/or tag exists; outputs release_exists and tag_exists.\n` +
      `  move-tag --tag <tag> [--sha <sha>]  Force move (or create) tag to the given sha (defaults to GITHUB_SHA).\n` +
      `\nExamples:\n` +
      `  node ./scripts/github-ci-artifacts.js check-prebuilt --path packages/CLI/lib\n` +
      `  node ./scripts/github-ci-artifacts.js validate-release --tag v1.2.3 --name "Release v1.2.3"\n`,
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
    case "check-release": {
      const tag = (flags.tag ?? "").trim();
      if (!tag) {
        console.error("[github-ci-artifacts] --tag is required for check-release");
        process.exit(1);
        return;
      }
      try {
        const relRes = await ghRequest("GET", `/releases/tags/${encodeURIComponent(tag)}`);
        const releaseExists = relRes.status === 200;
        const tagRes = await ghRequest("GET", `/git/refs/tags/${encodeURIComponent(tag)}`);
        const tagExists = tagRes.status === 200;
        console.log(`[github-ci-artifacts] check-release: releaseExists=${releaseExists}, tagExists=${tagExists}`);
        appendGithubOutput("release_exists", String(releaseExists));
        appendGithubOutput("tag_exists", String(tagExists));
        process.exit(0);
      } catch (e) {
        console.error("[github-ci-artifacts] check-release failed:", e?.message || e);
        process.exit(1);
      }
      return;
    }
    case "move-tag": {
      const tag = (flags.tag ?? "").trim();
      const sha = (flags.sha ?? process.env.GITHUB_SHA ?? "").trim();
      if (!tag || !sha) {
        console.error("[github-ci-artifacts] --tag and --sha (or GITHUB_SHA) are required for move-tag");
        process.exit(1);
        return;
      }
      try {
        // delete ref if exists
        const delRes = await ghRequest("DELETE", `/git/refs/tags/${encodeURIComponent(tag)}`);
        if (delRes.status !== 204 && delRes.status !== 404) {
          const txt = await delRes.text();
          console.warn(`[github-ci-artifacts] delete tag returned ${delRes.status}: ${txt}`);
        } else {
          console.log(`[github-ci-artifacts] deleted existing tag '${tag}' (or not present).`);
        }
        // create ref pointing to sha
        const createRes = await ghRequest("POST", `/git/refs`, { ref: `refs/tags/${tag}`, sha });
        if (createRes.status !== 201) {
          const txt = await createRes.text();
          throw new Error(`create tag failed: ${createRes.status} ${txt}`);
        }
        console.log(`[github-ci-artifacts] tag '${tag}' now points to ${sha}`);
        appendGithubOutput("moved_tag", tag);
        appendGithubOutput("tag_sha", sha);
        process.exit(0);
      } catch (e) {
        console.error("[github-ci-artifacts] move-tag failed:", e?.message || e);
        process.exit(1);
      }
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

