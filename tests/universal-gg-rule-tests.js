"use strict";
const {universalGGRule,evaluateMatch}=require("../olympian-engine-core.js");

function fixture(overrides={}){
  const base={
    id:999001,
    home:"Alpha FC",
    away:"Beta FC",
    league:"Example High League",
    kickoff:"2026-07-20T18:00:00Z",
    homePPG:1.72,
    awayPPG:1.68,
    homePlayed:18,
    awayPlayed:18,
    homeVenuePPG:1.80,
    awayVenuePPG:1.64,
    homeVenueGames:9,
    awayVenueGames:9,
    homeForm:"WDWWD",
    awayForm:"DWWDW",
    homeScoredAtHome:1.75,
    awayScoredAway:1.62,
    homeConcededAtHome:1.22,
    awayConcededAway:1.30,
    leagueAvg:{goalsPerGame:2.92,gamesPlayed:120},
    leagueTrends:{sample:120,gpg:2.92},
    odds:{home:2.42,away:2.54,draw:3.82,under35:1.66,fhOver15:1.94,bttsYes:1.68}
  };
  return {...base,...overrides,leagueAvg:{...base.leagueAvg,...(overrides.leagueAvg||{})},leagueTrends:{...base.leagueTrends,...(overrides.leagueTrends||{})},odds:{...base.odds,...(overrides.odds||{})}};
}

const cases=[
  ["all mandatory gates qualify",fixture(),true],
  ["home PPG must be greater than 1.50",fixture({homePPG:1.50}),false],
  ["away PPG must be greater than 1.50",fixture({awayPPG:1.50}),false],
  ["league must be high-scoring",fixture({leagueAvg:{goalsPerGame:2.79},leagueTrends:{gpg:2.79}}),false],
  ["Under 3.5 must be greater than 1.60",fixture({odds:{under35:1.60}}),false],
  ["draw must be greater than 3.70",fixture({odds:{draw:3.70}}),false],
  ["1X2 odds must be balanced",fixture({odds:{home:1.72,away:4.80}}),false],
  ["first-half Over 1.5 must be below 2.00",fixture({odds:{fhOver15:2.00}}),false],
  ["GG must be 1.70 or lower",fixture({odds:{bttsYes:1.71}}),false],
  ["missing mandatory odds reject",fixture({odds:{fhOver15:null}}),false]
];

let failed=0;
for(const [name,input,expected] of cases){
  const out=universalGGRule(input,{});
  const pass=out.pass===expected;
  console.log(`${pass?"PASS":"FAIL"} — ${name}`);
  if(!pass){console.log(`  expected: ${expected}`);console.log(`  received: ${out.pass}`);console.log(`  checks: ${JSON.stringify(out.checks)}`);failed++;}
}
const final=evaluateMatch(fixture());
const finalPass=final.decision&&final.decision.market==="BTTS Yes"&&["A1","A2"].includes(final.decision.grade);
console.log(`${finalPass?"PASS":"FAIL"} — qualifying fixture becomes final-board GG decision`);
if(!finalPass){console.log(final.decision);failed++;}
if(failed)process.exitCode=1;
