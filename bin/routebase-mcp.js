#!/usr/bin/env node
// routebase-mcp npm shim (MIT) — downloads the self-contained CLI binary for
// this platform from releases.routebase.dev (pinned to this package version,
// SHA-256 verified against the checksums baked in at publish time), caches it
// under ~/.routebase/bin/<version>/, then execs it.
//
// IMPORTANT: the CLI speaks MCP over stdio — stdout belongs to the protocol.
// All shim output goes to stderr. The downloaded binary is governed by the
// Routebase terms (https://routebase.dev/); this shim itself is MIT.
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const https = require("node:https");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const pkg = require("../package.json");
const checksums = require("../checksums.json");

const RID_MAP = {
  "darwin arm64": "osx-arm64",
  "darwin x64": "osx-x64",
  "win32 x64": "win-x64",
  "linux x64": "linux-x64",
};

function fail(message) {
  process.stderr.write(`routebase-mcp: ${message}\n`);
  process.exit(1);
}

const rid = RID_MAP[`${process.platform} ${process.arch}`];
if (!rid) {
  fail(
    `unsupported platform ${process.platform}/${process.arch} — supported: macOS (arm64/x64), Windows (x64), Linux (x64)`,
  );
}

const ext = rid === "win-x64" ? ".exe" : "";
const fileName = `routebase-mcp-${rid}${ext}`;
const expectedSha = checksums[fileName];
if (!expectedSha) {
  fail(`no checksum for ${fileName} in this package — refusing to download`);
}

const cacheDir = path.join(os.homedir(), ".routebase", "bin", pkg.version);
const binPath = path.join(cacheDir, fileName);

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error("too many redirects"));
    https
      .get(url, (res) => {
        if (res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location) {
          res.resume();
          return resolve(download(res.headers.location, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const tmp = `${dest}.download`;
        const out = fs.createWriteStream(tmp, { mode: 0o755 });
        res.pipe(out);
        out.on("finish", () => out.close(() => resolve(tmp)));
        out.on("error", reject);
      })
      .on("error", reject);
  });
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function ensureBinary() {
  if (fs.existsSync(binPath)) return;
  const url = `https://releases.routebase.dev/cli/${pkg.version}/${fileName}`;
  process.stderr.write(`routebase-mcp: downloading ${url} (first run)\n`);
  fs.mkdirSync(cacheDir, { recursive: true });
  const tmp = await download(url, binPath);
  const actual = sha256(tmp);
  if (actual !== expectedSha) {
    fs.rmSync(tmp, { force: true });
    fail(`checksum mismatch for ${fileName} (expected ${expectedSha}, got ${actual})`);
  }
  fs.renameSync(tmp, binPath);
  process.stderr.write(`routebase-mcp: cached at ${binPath}\n`);
}

ensureBinary()
  .then(() => {
    const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
    if (result.error) fail(result.error.message);
    process.exit(result.status ?? 1);
  })
  .catch((err) => fail(err.message));
