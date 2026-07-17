#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const SOURCE_ROOT = path.resolve(__dirname, "..");

function run(cmd, args, cwd, allowFailure = false) {
  try {
    return cp.execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    if (allowFailure) return String(error.stdout || "") + String(error.stderr || "");
    throw error;
  }
}

function writeBoard(root, rows, demo = false) {
  const source = [
    `window.BETYNZ_DEMO = ${demo};`,
    "window.BETYNZ_READY = true;",
    `window.DATA_UPDATED = ${JSON.stringify(new Date().toISOString())};`,
    `window.MATCHES = ${JSON.stringify(rows)};`,
    ""
  ].join("\n");
  fs.writeFileSync(path.join(root, "data.js"), source);
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, "scripts", "data.js"), source);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "betynz-live-guard-"));
fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
fs.copyFileSync(path.join(SOURCE_ROOT, "scripts", "ensure-live-data.js"), path.join(root, "scripts", "ensure-live-data.js"));
fs.copyFileSync(path.join(SOURCE_ROOT, "scripts", "seed-guard.js"), path.join(root, "scripts", "seed-guard.js"));
run("git", ["init"], root);
run("git", ["config", "user.email", "tests@betynz.local"], root);
run("git", ["config", "user.name", "Betynz Tests"], root);

writeBoard(root, [{ id: 12345, home: "Live Home", away: "Live Away", dataSource: "api-football" }], false);
run("git", ["add", "."], root);
run("git", ["commit", "-m", "verified live board"], root);

writeBoard(root, [{ id: 900001, home: "Manchester City", away: "Brighton", dataSource: "demo" }], true);
run("git", ["add", "."], root);
run("git", ["commit", "-m", "accidental demo board"], root);

const output = run("node", ["scripts/ensure-live-data.js", "--restore-history", "--require-live"], root);
const restored = fs.readFileSync(path.join(root, "data.js"), "utf8");
if (!output.includes("restored 1 verified live fixtures")) throw new Error(`Expected historical live recovery. Output:\n${output}`);
if (!restored.includes("Live Home") || restored.includes("Manchester City")) throw new Error("Demo board was not replaced by verified live history.");

writeBoard(root, [
  { id: 900002, home: "Demo Home", away: "Demo Away", dataSource: "demo" },
  { id: 54321, home: "API Home", away: "API Away", dataSource: "api-football" }
], false);
const mixedOutput = run("node", ["scripts/ensure-live-data.js", "--restore-history", "--require-live"], root);
const mixedClean = fs.readFileSync(path.join(root, "data.js"), "utf8");
if (!mixedOutput.includes("preserved 1 live fixture")) throw new Error(`Expected mixed-board cleanup. Output:\n${mixedOutput}`);
if (mixedClean.includes("Demo Home") || !mixedClean.includes("API Home")) throw new Error("Mixed-board cleanup removed the wrong fixtures.");

console.log("Live-data guard tests passed.");
