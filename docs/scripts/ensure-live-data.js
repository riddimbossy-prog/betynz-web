#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const ROOT_DATA = path.join(ROOT, "data.js");
const SCRIPT_DATA = path.join(ROOT, "scripts", "data.js");
const args = new Set(process.argv.slice(2));
const requireLive = args.has("--require-live");
const restoreHistory = args.has("--restore-history");

function inspectSource(source, label = "data.js") {
  const context = { window: {} };
  vm.createContext(context);
  try {
    vm.runInContext(String(source || ""), context, { filename: label, timeout: 5000 });
  } catch (error) {
    return { valid: false, matches: [], ready: false, meta: {}, error };
  }
  return {
    valid: Array.isArray(context.window.MATCHES),
    matches: Array.isArray(context.window.MATCHES) ? context.window.MATCHES : [],
    ready: context.window.BETYNZ_READY === true,
    meta: context.window.BETYNZ_META && typeof context.window.BETYNZ_META === "object" ? context.window.BETYNZ_META : {},
    source: String(source || "")
  };
}

function readFile(file) {
  if (!fs.existsSync(file)) return { valid: false, matches: [], ready: false, meta: {} };
  return inspectSource(fs.readFileSync(file, "utf8"), file);
}

function git(command) {
  return cp.execFileSync("git", command, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function findHistoricalBoard() {
  let commits = [];
  try {
    commits = git(["rev-list", "--all", "--", "data.js"]).trim().split(/\s+/).filter(Boolean).slice(0, 250);
  } catch (error) {
    console.log(`Live-board recovery: git history is unavailable (${error.message}).`);
    return null;
  }

  for (const sha of commits) {
    let source = "";
    try {
      source = git(["show", `${sha}:data.js`]);
    } catch (_) {
      continue;
    }
    const board = inspectSource(source, `${sha}:data.js`);
    if (board.valid && board.matches.length > 0) {
      return { ...board, sha };
    }
  }
  return null;
}

function sync(source) {
  fs.writeFileSync(ROOT_DATA, source, "utf8");
  fs.writeFileSync(SCRIPT_DATA, source, "utf8");
}

const current = readFile(ROOT_DATA);
if (current.valid && current.matches.length > 0) {
  if (!fs.existsSync(SCRIPT_DATA) || readFile(SCRIPT_DATA).matches.length !== current.matches.length) {
    fs.copyFileSync(ROOT_DATA, SCRIPT_DATA);
  }
  console.log(`Live-board guard: current board is healthy (${current.matches.length} fixtures).`);
  process.exit(0);
}

if (restoreHistory) {
  const recovered = findHistoricalBoard();
  if (recovered) {
    sync(recovered.source);
    console.log(`Live-board guard: restored ${recovered.matches.length} fixtures from commit ${recovered.sha.slice(0, 10)}.`);
    process.exit(0);
  }
}

const message = "Live-board guard: no non-empty verified board is available.";
if (requireLive) {
  console.error(`${message} Refusing to deploy an empty UI build. Run Smart Global Coverage and Deep Enrichment first.`);
  process.exit(1);
}
console.log(message);
