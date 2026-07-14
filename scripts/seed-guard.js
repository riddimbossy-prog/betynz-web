"use strict";

const DEMO_ID_MIN = 900001;
const DEMO_ID_MAX = 900020;

function isPackagedDemoFixture(match) {
  if (!match || typeof match !== "object") return false;
  if (Array.isArray(match.demoPredictions) && match.demoPredictions.length) return true;
  if (match.demoFixture === true || match.syntheticDemo === true) return true;
  const source = String(match.dataSource || match.source || "").toLowerCase();
  if (source === "demo" || source === "sample" || source === "synthetic") return true;
  const id = Number(match.id);
  return Number.isInteger(id) && id >= DEMO_ID_MIN && id <= DEMO_ID_MAX;
}

function isPackagedDemoRecord(record) {
  if (!record || typeof record !== "object") return false;
  const id = Number(record.fixtureId ?? record.id);
  if (Number.isInteger(id) && id >= DEMO_ID_MIN && id <= DEMO_ID_MAX) return true;
  const source = String(record.dataSource || record.source || "").toLowerCase();
  return source === "demo" || source === "sample" || source === "synthetic";
}

function removePackagedDemoFixtures(matches) {
  const list = Array.isArray(matches) ? matches : [];
  const clean = list.filter(match => !isPackagedDemoFixture(match));
  return { matches: clean, removed: list.length - clean.length };
}

function assertNoPackagedDemoFixtures(matches, label = "public data") {
  const offenders = (Array.isArray(matches) ? matches : []).filter(isPackagedDemoFixture);
  if (!offenders.length) return;
  const details = offenders.slice(0, 8).map(m => `${m.id ?? "?"}:${m.home ?? "?"} vs ${m.away ?? "?"}`).join(", ");
  throw new Error(`${label} still contains ${offenders.length} packaged demo fixture(s): ${details}`);
}

module.exports = {
  DEMO_ID_MIN,
  DEMO_ID_MAX,
  isPackagedDemoFixture,
  isPackagedDemoRecord,
  removePackagedDemoFixtures,
  assertNoPackagedDemoFixtures
};
