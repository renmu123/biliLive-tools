#!/usr/bin/env node
// Zip packages/CLI/lib contents into bililive-cli-lib-<os>-<arch>.zip at repo root.
// Usage: node ./scripts/zip_lib.js --os <ubuntu|macos|windows> --arch <x64|arm64>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const cliRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--os') { flags.os = args[++i] || ''; }
    else if (a.startsWith('--os=')) { flags.os = a.slice(5); }
    else if (a === '--arch') { flags.arch = args[++i] || ''; }
    else if (a.startsWith('--arch=')) { flags.arch = a.slice(7); }
  }
  return flags;
}

function ensureNonEmptyDir(dir) {
  if (!fs.existsSync(dir)) throw new Error(`Directory not found: ${dir}`);
  const list = fs.readdirSync(dir);
  if (!list || list.length === 0) throw new Error(`No files in directory: ${dir}`);
}

async function main() {
  const { os, arch } = parseArgs(process.argv);
  if (!os || !arch) {
    throw new Error('Missing required flags: --os and --arch');
  }
  const libDir = path.resolve(cliRoot, 'lib');
  ensureNonEmptyDir(libDir);

  const outName = `bililive-cli-lib-${os}-${arch}.zip`;
  const outPath = path.resolve(repoRoot, outName);
  if (fs.existsSync(outPath)) fs.rmSync(outPath, { force: true });

  const require = createRequire(import.meta.url);
  const bestzip = require('bestzip');
  // Use libDir as cwd so zip root doesn't contain 'lib/' folder
  await bestzip({ cwd: libDir, source: ['**/*'], destination: outPath });
  const size = fs.statSync(outPath).size;
  console.log(`[zip_lib] Created ${outName} (${size} bytes)`);
}

main().catch((e) => {
  console.error('[zip_lib] Failed:', e?.stack || e?.message || e);
  process.exit(1);
});
