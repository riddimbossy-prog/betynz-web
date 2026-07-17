#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
const {
  isPackagedDemoFixture,
  removePackagedDemoFixtures
} = require("./seed-guard");

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
    return {
      valid: false,
      matches: [],
      cleanMatches: [],
      demoCount: 0,
      ready: false,
      demoFlag: false,
      meta: {},
      history: [],
      source: String(source || ""),
      error
    };
  }

  const matches = Array.isArray(context.window.MATCHES) ? context.window.MATCHES : [];
  const cleanResult = removePackagedDemoFixtures(matches);
  const meta = context.window.BETYNZ_META && typeof context.window.BETYNZ_META === "object"
    ? context.window.BETYNZ_META
    : {};

  return {
    valid: Array.isArray(context.window.MATCHES),
    matches,
    cleanMatches: cleanResult.matches,
    demoCount: cleanResult.removed,
    ready: context.window.BETYNZ_READY === true,
    demoFlag: context.window.BETYNZ_DEMO === true || meta.isDemo === true,
    meta,
    history: Array.isArray(context.window.BETYNZ_HISTORY) ? context.window.BETYNZ_HISTORY : [],
    dataUpdated: context.window.DATA_UPDATED || meta.dataUpdated || null,
    source: String(source || "")
  };
}

function isVerifiedLiveBoard(board) {
  if (!board || !board.valid) return false;
  if (!Array.isArray(board.matches) || board.matches.length === 0) return false;
  if (board.demoFlag || board.demoCount > 0) return false;
  if (String(board.meta && board.meta.source || "") === "waiting-for-live-sync") return false;
  return board.matches.every(match => !isPackagedDemoFixture(match));
}

function readFile(file) {
  if (!fs.existsSync(file)) {
    return { valid: false, matches: [], cleanMatches: [], demoCount: 0, ready: false, demoFlag: false, meta: {}, history: [] };
  }
  return inspectSource(fs.readFileSync(file, "utf8"), file);
}

function git(command) {
  return cp.execFileSync("git", command, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function findHistoricalBoard() {
  let commits = [];
  try {
    commits = git(["rev-list", "--all", "--", "data.js"])
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 400);
  } catch (error) {
    console.log(`Live-board recovery: git history is unavailable (${error.message}).`);
    return null;
  }

  let skippedDemoBoards = 0;
  for (const sha of commits) {
    let source = "";
    try {
      source = git(["show", `${sha}:data.js`]);
    } catch (_) {
      continue;
    }

    const board = inspectSource(source, `${sha}:data.js`);
    if (board.demoFlag || board.demoCount > 0) {
      skippedDemoBoards += 1;
      continue;
    }
    if (isVerifiedLiveBoard(board)) {
      if (skippedDemoBoards) {
        console.log(`Live-board recovery: skipped ${skippedDemoBoards} demo/synthetic board revision(s).`);
      }
      return { ...board, sha };
    }
  }

  if (skippedDemoBoards) {
    console.log(`Live-board recovery: skipped ${skippedDemoBoards} demo/synthetic board revision(s), but found no verified live board.`);
  }
  return null;
}

function buildCleanSource(board, reason) {
  const cleanMatches = Array.isArray(board.cleanMatches) ? board.cleanMatches : [];
  const meta = {
    ...(board.meta || {}),
    source: "recovered-live-board",
    recoveryReason: reason,
    isDemo: false,
    isReady: true,
    fixtureCount: cleanMatches.length,
    dataUpdated: board.dataUpdated || new Date().toISOString()
  };

  return [
    "/* AUTO-RECOVERED verified live board — packaged demo fixtures removed. */",
    "window.BETYNZ_DEMO = false;",
    "window.BETYNZ_READY = true;",
    `window.DATA_UPDATED = ${JSON.stringify(board.dataUpdated || new Date().toISOString())};`,
    `window.BETYNZ_META = ${JSON.stringify(meta, null, 2)};`,
    `window.BETYNZ_HISTORY = ${JSON.stringify(board.history || [], null, 2)};`,
    `window.MATCHES = ${JSON.stringify(cleanMatches, null, 2)};`,
    ""
  ].join("\n");
}

function sync(source) {
  fs.writeFileSync(ROOT_DATA, source, "utf8");
  fs.mkdirSync(path.dirname(SCRIPT_DATA), { recursive: true });
  fs.writeFileSync(SCRIPT_DATA, source, "utf8");
}

const current = readFile(ROOT_DATA);
if (isVerifiedLiveBoard(current)) {
  const scriptBoard = readFile(SCRIPT_DATA);
  if (!isVerifiedLiveBoard(scriptBoard) || scriptBoard.matches.length !== current.matches.length) {
    fs.mkdirSync(path.dirname(SCRIPT_DATA), { recursive: true });
    fs.copyFileSync(ROOT_DATA, SCRIPT_DATA);
  }
  console.log(`Live-board guard: current board is verified live (${current.matches.length} fixtures).`);
  process.exit(0);
}

if (current.valid && current.matches.length > 0) {
  const reason = current.demoFlag
    ? "board is explicitly marked as demo"
    : `${current.demoCount} packaged demo fixture(s) detected`;
  console.log(`Live-board guard: current data.js is not a verified live board (${reason}).`);

  // A mixed board may contain valid API fixtures alongside old packaged rows.
  // Preserve only the valid rows instead of throwing away genuine live data.
  if (!current.demoFlag && current.cleanMatches.length > 0) {
    sync(buildCleanSource(current, "removed-packaged-demo-fixtures"));
    console.log(`Live-board guard: removed ${current.demoCount} packaged demo fixture(s) and preserved ${current.cleanMatches.length} live fixture(s).`);
    process.exit(0);
  }
}

if (restoreHistory) {
  const recovered = findHistoricalBoard();
  if (recovered) {
    sync(recovered.source);
    console.log(`Live-board guard: restored ${recovered.matches.length} verified live fixtures from commit ${recovered.sha.slice(0, 10)}.`);
    process.exit(0);
  }
}

const message = "Live-board guard: no verified non-demo board is available.";
if (requireLive) {
  console.error(`${message} Refusing to deploy demo or empty data. Run Smart Global Coverage and Deep Enrichment first.`);
  process.exit(1);
}
console.log(`${message} The data refresh workflow may continue and replace it from the APIs.`);
