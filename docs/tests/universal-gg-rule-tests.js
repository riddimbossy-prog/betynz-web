"use strict";
const {universalGGRule,evaluateMatch}=require("../olympian-engine-core.js");
function fixture(overrides={}){
  const base={
    id:999001,home:"Alpha FC",away:"Beta FC",league:"Example High League",kickoff:"2026-07-20T18:00:00Z",
    homeTeamId:1,awayTeamId:2,homePPG:1.70,awayPPG:1.60,homePlayed:18,awayPlayed:18,
    homeVenuePPG:1.80,awayVenuePPG:1.55,homeVenueGames:9,awayVenueGames:9,
    homeForm:"WDWWD",awayForm:"DWWDW",homeScoredAtHome:1.75,awayScoredAway:1.62,
    homeConcededAtHome:1.20,awayConcededAway:1.35,statsReal:true,
    leagueAvg:{goalsPerGame:2.92,gamesPlayed:120},leagueTrends:{sample:120,gpg:2.92},
    odds:{home:2.42,away:2.54,draw:3.70,bttsYes:1.78}
  };
  return {...base,...overrides,leagueAvg:{...base.leagueAvg,...(overrides.leagueAvg||{})},leagueTrends:{...base.leagueTrends,...(overrides.leagueTrends||{})},odds:{...base.odds,...(overrides.odds||{})}};
}
const cases=[
  ["all new mandatory GG gates qualify",fixture(),true],
  ["home overall PPG must be at least 1.50",fixture({homePPG:1.49}),false],
  ["away split PPG must be at least 1.50",fixture({awayVenuePPG:1.49}),false],
  ["league must be high scoring",fixture({leagueAvg:{goalsPerGame:2.79},leagueTrends:{gpg:2.79}}),false],
  ["draw odds may equal 3.70",fixture({odds:{draw:3.70}}),true],
  ["draw odds below 3.70 reject",fixture({odds:{draw:3.69}}),false],
  ["both defences must be medium or leaky",fixture({homeConcededAtHome:.99}),false],
  ["GG price must be available",fixture({odds:{bttsYes:null}}),false],
  ["overall and split PPG direction must agree",fixture({awayVenuePPG:1.90}),false]
];
let failed=0;
for(const [name,input,expected] of cases){const out=universalGGRule(input,{}),ok=out.pass===expected;console.log(`${ok?"PASS":"FAIL"} — ${name}`);if(!ok){console.log(out.checks);failed++;}}
const final=evaluateMatch(fixture());const finalPass=final.decision&&final.decision.market==="BTTS Yes"&&["A1","A2"].includes(final.decision.grade);
console.log(`${finalPass?"PASS":"FAIL"} — qualifying fixture becomes final-board GG decision`);if(!finalPass){console.log(final.decision);failed++;}
if(failed)process.exitCode=1;
