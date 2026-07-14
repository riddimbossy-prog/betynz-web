"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const COVERAGE_FILE = path.join(ROOT, "data.js");
const DEEP_FILE = path.join(__dirname, "data.js");
const PLAN_FILE = path.join(__dirname, "enrichment-plan.json");
const { removePackagedDemoFixtures } = require("./seed-guard");

function load(file) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  const cleaned = removePackagedDemoFixtures(Array.isArray(context.window.MATCHES) ? context.window.MATCHES : []);
  if (cleaned.removed) console.log(`Purged ${cleaned.removed} packaged demo fixture(s) while loading ${path.basename(file)}.`);
  return {
    matches: cleaned.matches,
    updated: context.window.DATA_UPDATED || null
  };
}

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function mergePreferUseful(base, overlay) {
  if (overlay == null) return base;
  if (Array.isArray(overlay)) return overlay.length ? overlay : (Array.isArray(base) ? base : overlay);
  if (isPlainObject(overlay)) {
    const out = isPlainObject(base) ? { ...base } : {};
    for (const [k, v] of Object.entries(overlay)) out[k] = mergePreferUseful(out[k], v);
    return out;
  }
  return overlay;
}

function main() {
  const coverage = load(COVERAGE_FILE);
  const deep = load(DEEP_FILE);
  let plan = null;
  try { plan = JSON.parse(fs.readFileSync(PLAN_FILE, "utf8")); } catch (_) {}

  const deepById = new Map(deep.matches.filter(m => m && m.id != null).map(m => [String(m.id), m]));
  let enriched = 0;
  const merged = coverage.matches.map(m => {
    const d = deepById.get(String(m.id));
    if (!d) return { ...m, enrichmentTier: m.enrichmentTier || "coverage" };
    enriched++;
    const combined = mergePreferUseful(m, d);
    combined.enrichmentTier = "deep";
    combined.deepEnrichedAt = new Date().toISOString();
    combined.deepData = {
      statsReal: !!combined.statsReal,
      trends: !!(combined.leagueTrends && combined.leagueTrends.sample),
      h2h: !!(combined.h2h && combined.h2h.played),
      recent10: combined.homeRecent10PPG != null && combined.awayRecent10PPG != null
    };
    return combined;
  });

  const known = new Set(merged.map(m => String(m.id)));
  for (const m of deep.matches) {
    if (m && m.id != null && !known.has(String(m.id))) {
      merged.push({ ...m, enrichmentTier: "deep", deepEnrichedAt: new Date().toISOString() });
    }
  }
  merged.sort((a, b) => String(a.kickoff || "").localeCompare(String(b.kickoff || "")));

  const updated = new Date().toISOString();
  const finalClean = removePackagedDemoFixtures(merged);
  if (finalClean.removed) console.log(`Blocked ${finalClean.removed} packaged demo fixture(s) before publishing adaptive data.`);
  const publicMatches = finalClean.matches;
  const header =
    `/* AUTO-GENERATED adaptive Betynz board. */\n\n` +
    `window.BETYNZ_DEMO = false;\n` +
    `window.BETYNZ_READY = true;\n` +
    `window.DATA_UPDATED = ${JSON.stringify(updated)};\n` +
    `window.ENRICHMENT_META = ${JSON.stringify({
      mode: "adaptive-two-pass",
      coverageFixtures: coverage.matches.length,
      deepFixtures: enriched,
      selectedLeagues: plan && plan.selected ? plan.selected.leagues : null,
      generatedAt: updated
    }, null, 2)};\n` +
    `window.MATCHES = ${JSON.stringify(publicMatches, null, 2)};\n`;

  fs.writeFileSync(COVERAGE_FILE, header, "utf8");
  fs.writeFileSync(DEEP_FILE, header, "utf8");
  console.log(`Merged ${enriched} deeply enriched fixtures into ${coverage.matches.length} globally covered fixtures; ${publicMatches.length} verified fixtures published.`);
}

main();
