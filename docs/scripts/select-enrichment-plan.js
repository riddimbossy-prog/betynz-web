"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const core = require("../olympian-engine-core.js");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.js");
const PLAN_FILE = path.join(__dirname, "enrichment-plan.json");
const FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"]);

function loadMatches(file) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return Array.isArray(context.window.MATCHES) ? context.window.MATCHES : [];
}

function num(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function hoursToKickoff(m) {
  const t = Date.parse(m.kickoff || "");
  return Number.isFinite(t) ? (t - Date.now()) / 36e5 : 999;
}

function oddsCount(m) {
  if (!m || !m.odds || typeof m.odds !== "object") return 0;
  return Object.values(m.odds).filter(v => Number.isFinite(Number(v)) && Number(v) > 1).length;
}

function ppg(m, side) {
  const direct = num(m[`${side}PPG`]);
  if (direct != null) return direct;
  const played = num(m[`${side}Played`]);
  const pts = num(m[`${side}Pts`]);
  return played && pts != null ? pts / played : null;
}

function venuePpg(m, side) {
  const direct = num(m[`${side}VenuePPG`]);
  if (direct != null) return direct;
  const games = num(m[`${side}VenueGames`]);
  const pts = num(m[`${side}VenuePts`]);
  return games && pts != null ? pts / games : null;
}

function scoreMatch(m) {
  let score = 0;
  const quality = core.dataQuality(m);
  score += quality.score * 0.55;

  const oCount = oddsCount(m);
  score += Math.min(14, oCount * 1.75);

  const hPpg = ppg(m, "home");
  const aPpg = ppg(m, "away");
  const hVenue = venuePpg(m, "home");
  const aVenue = venuePpg(m, "away");
  if (hPpg != null && aPpg != null) score += Math.min(12, Math.abs(hPpg - aPpg) * 8);
  if (hVenue != null && aVenue != null) score += Math.min(12, Math.abs(hVenue - aVenue) * 8);

  const goalInputs = [
    num(m.homeScoredAtHome), num(m.homeConcededAtHome),
    num(m.awayScoredAway), num(m.awayConcededAway),
    num(m.leagueAvg && m.leagueAvg.goalsPerGame)
  ].filter(Number.isFinite);
  if (goalInputs.length >= 4) {
    const expected = goalInputs.reduce((a, b) => a + b, 0) / goalInputs.length;
    score += Math.min(10, Math.abs(expected - 2.5) * 8 + 2);
  }

  const hours = hoursToKickoff(m);
  if (hours >= -1 && hours <= 6) score += 16;
  else if (hours > 6 && hours <= 24) score += 12;
  else if (hours > 24 && hours <= 48) score += 6;

  if (!m.statsReal) score += 5;
  if (!m.homeRecent10PPG || !m.awayRecent10PPG) score += 5;
  if (!m.leagueTrends || !m.leagueTrends.sample) score += 4;
  if (!m.xgReal) score += 3;

  try {
    const evaluated = core.evaluateMatch(m);
    if (evaluated && evaluated.decision) {
      score += 8 + Math.max(0, (num(evaluated.decision.confidence, 75) - 75) * 0.45);
      if (evaluated.decision.grade === "A1") score += 8;
      else if (evaluated.decision.grade === "A2") score += 5;
    }
  } catch (_) {}

  if (m.isTournament && !m.sameGroup) score -= 6;
  return Math.round(score * 100) / 100;
}

function main() {
  const maxLeagues = Math.max(1, num(process.env.DEEP_MAX_LEAGUES, 18));
  const maxMatches = Math.max(4, num(process.env.DEEP_MAX_MATCHES, 48));
  const tsaMax = Math.max(0, num(process.env.TSA_MAX_MATCHES, 24));
  const today = new Date().toISOString().slice(0, 10);
  const matches = loadMatches(DATA_FILE)
    .filter(m => !FINISHED.has(String(m.status || "").toUpperCase()))
    .filter(m => !m.matchDate || m.matchDate === today || hoursToKickoff(m) >= -1)
    .map(m => ({ ...m, __priority: scoreMatch(m) }))
    .sort((a, b) => b.__priority - a.__priority);

  const groups = new Map();
  for (const m of matches) {
    const leagueId = num(m.leagueId);
    if (!leagueId) continue;
    const season = String(m.season || new Date().getUTCFullYear());
    const key = `${leagueId}|${season}`;
    if (!groups.has(key)) groups.set(key, { key, leagueId, season, league: m.league, country: m.country, matches: [] });
    groups.get(key).matches.push(m);
  }

  const rankedGroups = [...groups.values()].map(g => {
    g.matches.sort((a, b) => b.__priority - a.__priority);
    const top = g.matches.slice(0, 2);
    g.priority = Math.round((top.reduce((s, m) => s + m.__priority, 0) / Math.max(1, top.length)) * 100) / 100;
    return g;
  }).sort((a, b) => b.priority - a.priority);

  const selected = [];
  let selectedMatchCount = 0;
  for (const g of rankedGroups) {
    if (selected.length >= maxLeagues) break;
    const count = g.matches.length;
    if (selected.length && selectedMatchCount + count > maxMatches) continue;
    selected.push(g);
    selectedMatchCount += count;
  }
  if (!selected.length && rankedGroups.length) selected.push(rankedGroups[0]);

  const selectedFixtureIds = selected.flatMap(g => g.matches.map(m => String(m.id))).filter(Boolean);
  const selectedSet = new Set(selectedFixtureIds);
  const tsaFixtureIds = matches.filter(m => selectedSet.has(String(m.id))).slice(0, tsaMax).map(m => String(m.id));

  const plan = {
    generatedAt: new Date().toISOString(),
    mode: "adaptive-two-pass",
    today,
    limits: { maxLeagues, maxMatches, tsaMax },
    coverage: { fixtures: matches.length, leagues: groups.size },
    selected: {
      leagues: selected.length,
      fixtures: selectedFixtureIds.length,
      leagueIds: selected.map(g => g.leagueId),
      leagueSeasons: selected.map(g => ({ leagueId: g.leagueId, season: g.season, league: g.league, country: g.country, fixtureCount: g.matches.length, priority: g.priority })),
      fixtureIds: selectedFixtureIds,
      tsaFixtureIds
    },
    topCandidates: matches.slice(0, 20).map(m => ({
      id: m.id, home: m.home, away: m.away, league: m.league, leagueId: m.leagueId,
      kickoff: m.kickoff, priority: m.__priority, dataQuality: core.dataQuality(m).score
    }))
  };

  fs.writeFileSync(PLAN_FILE, JSON.stringify(plan, null, 2) + "\n");
  console.log(`Adaptive plan: ${plan.coverage.fixtures} fixtures in ${plan.coverage.leagues} leagues.`);
  console.log(`Deep pass: ${plan.selected.fixtures} fixtures across ${plan.selected.leagues} leagues.`);
  console.log(`TheStatsAPI priority scope: ${tsaFixtureIds.length} fixtures.`);
  console.log(`Selected league IDs: ${plan.selected.leagueIds.join(",") || "none"}`);
}

main();
