"use strict";
const assert=require("assert");
const core=require("../olympian-engine-core.js");
function fixture(overrides={}){
  const base={id:771,home:"Home",away:"Away",league:"Test League",kickoff:"2026-07-21T18:00:00Z",homeTeamId:1,awayTeamId:2,
    homePPG:2.10,awayPPG:.80,homeVenuePPG:2.20,awayVenuePPG:.70,homePlayed:18,awayPlayed:18,homeVenueGames:9,awayVenueGames:9,
    homeForm:"WWDWW",awayForm:"LLDLL",homeScoredAtHome:1.9,awayScoredAway:.7,homeConcededAtHome:.9,awayConcededAway:1.2,statsReal:true,
    leagueAvg:{goalsPerGame:2.65,gamesPlayed:100},leagueTrends:{sample:100,gpg:2.65},odds:{home:1.55,away:6.2,draw:3.4,under25:1.75,under35:1.30,bttsYes:1.70}};
  return {...base,...overrides,leagueAvg:{...base.leagueAvg,...(overrides.leagueAvg||{})},leagueTrends:{...base.leagueTrends,...(overrides.leagueTrends||{})},odds:{...base.odds,...(overrides.odds||{})}};
}
let m=fixture();
let r=core.universalResultRule(m,{});assert.equal(r.pass,true);assert.equal(r.decision.market,"Home Win");
console.log("PASS — 2.00+ PPG versus sub-1.00 PPG with medium opponent defence becomes Home Win");
r=core.universalResultRule(fixture({awayConcededAway:.90}),{});assert.equal(r.pass,false);
console.log("PASS — tight opponent defence blocks the automatic win");
let protectedOut=core.applyBoardSafetyGates(fixture({homePPG:1.85,homeVenuePPG:1.90}),{bet:true,engine:"Nike",primary:"Home Win",confidence:86,reasons:[],warnings:[],dataQuality:90});
assert.equal(protectedOut.primary,"Home DNB");assert.equal(protectedOut.downgradedFrom,"Home Win");
console.log("PASS — a straight-win signal missing the full standard is downgraded to DNB");
protectedOut=core.applyBoardSafetyGates(m,{bet:true,engine:"Nike",primary:"Home Win",confidence:86,reasons:[],warnings:[],dataQuality:90});assert.equal(protectedOut.primary,"Home Win");
console.log("PASS — a fully qualified straight-win signal remains a win");
const lowBase={homePPG:.90,awayPPG:.80,homeVenuePPG:.85,awayVenuePPG:.70,leagueAvg:{goalsPerGame:2.40},leagueTrends:{gpg:2.40},odds:{draw:2.90,under25:1.72,under35:1.28},homeConcededAtHome:.90,awayConcededAway:1.20};
r=core.universalLowPPGUnderRule(fixture(lowBase),{});assert.equal(r.pass,true);assert.equal(r.decision.market,"Under 2.5 Goals");
console.log("PASS — low-PPG teams with no leaky defence route to Under 2.5");
r=core.universalLowPPGUnderRule(fixture({...lowBase,awayConcededAway:1.60}),{});assert.equal(r.pass,true);assert.equal(r.decision.market,"Under 3.5 Goals");
console.log("PASS — a leaky defence changes the low-PPG route to Under 3.5");
r=core.universalLowPPGUnderRule(fixture({...lowBase,odds:{draw:3.01,under25:1.72,under35:1.28}}),{});assert.equal(r.pass,false);
console.log("PASS — draw odds above 3.00 reject the low-PPG under rule");
const final=core.evaluateMatch(m);assert.equal(final.decision.market,"Home Win");assert.equal(final.decision.universalRule,"PPG_2_VS_SUB1_WIN_V1");
console.log("PASS — automatic result rule reaches the final board");
