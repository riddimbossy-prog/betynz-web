"use strict";
const {ppgDirectionAgreement,applyPPGDirectionGate,universalGGRule,evaluateMatch}=require("../olympian-engine-core.js");

function fixture(overrides={}){
  const base={
    id:954001,home:"Alpha FC",away:"Beta FC",league:"High League",kickoff:"2026-07-21T18:00:00Z",
    homePPG:1.82,awayPPG:1.61,homePlayed:20,awayPlayed:20,
    homeVenuePPG:1.91,awayVenuePPG:1.55,homeVenueGames:10,awayVenueGames:10,
    homeForm:"WWDWW",awayForm:"WDWDW",homeScoredAtHome:1.80,awayScoredAway:1.55,
    homeConcededAtHome:1.10,awayConcededAway:1.35,
    leagueAvg:{goalsPerGame:2.95,gamesPlayed:120},leagueTrends:{sample:120,gpg:2.95},
    odds:{home:2.42,away:2.54,draw:3.82,under35:1.66,fhOver15:1.94,bttsYes:1.68}
  };
  return {...base,...overrides,leagueAvg:{...base.leagueAvg,...(overrides.leagueAvg||{})},leagueTrends:{...base.leagueTrends,...(overrides.leagueTrends||{})},odds:{...base.odds,...(overrides.odds||{})}};
}

const tests=[];
function test(name,fn){tests.push([name,fn]);}
function assert(value,message){if(!value)throw new Error(message||"assertion failed");}

test("overall and split both pointing home pass",()=>{
  const g=ppgDirectionAgreement(fixture());assert(g.pass&&g.direction==="home",JSON.stringify(g));
});

test("overall and split both pointing away pass",()=>{
  const g=ppgDirectionAgreement(fixture({homePPG:1.45,awayPPG:1.85,homeVenuePPG:1.40,awayVenuePPG:1.92}));
  assert(g.pass&&g.direction==="away",JSON.stringify(g));
});

test("overall/split disagreement rejects",()=>{
  const g=ppgDirectionAgreement(fixture({homeVenuePPG:1.40,awayVenuePPG:1.90}));
  assert(!g.pass&&g.overallDirection==="home"&&g.splitDirection==="away",JSON.stringify(g));
});

test("missing split PPG rejects",()=>{
  const g=ppgDirectionAgreement(fixture({homeVenuePPG:null}));assert(!g.pass&&g.missing.length,JSON.stringify(g));
});

test("home result market is rejected when both PPG views point away",()=>{
  const m=fixture({homePPG:1.45,awayPPG:1.85,homeVenuePPG:1.40,awayVenuePPG:1.92});
  const out=applyPPGDirectionGate(m,{bet:true,engine:"Test",primary:"Home DNB",confidence:80,reasons:["candidate"],warnings:[],dataQuality:80});
  assert(!out.bet&&out.primary==="No Bet",JSON.stringify(out));
});

test("goal market passes when both PPG views agree",()=>{
  const out=applyPPGDirectionGate(fixture(),{bet:true,engine:"Test",primary:"Over 1.5 Goals",confidence:80,reasons:["candidate"],warnings:[],dataQuality:80});
  assert(out.bet&&out.ppgAgreement&&out.ppgAgreement.pass,JSON.stringify(out));
});

test("universal GG requires split PPG above 1.50 and same direction",()=>{
  const lowSplit=universalGGRule(fixture({awayVenuePPG:1.49}),{});
  assert(!lowSplit.pass,JSON.stringify(lowSplit.checks));
  const conflict=universalGGRule(fixture({homeVenuePPG:1.55,awayVenuePPG:1.90}),{});
  assert(!conflict.pass&&!conflict.checks.ppgDirectionAgreement,JSON.stringify(conflict.checks));
});

test("conflicting PPG directions remove every publishable board decision",()=>{
  const result=evaluateMatch(fixture({homeVenuePPG:1.45,awayVenuePPG:1.90}));
  assert(result.decision===null,JSON.stringify(result.decision));
  assert(Object.values(result.predictions).every(x=>!x.bet),"at least one specialist escaped the gate");
});

let failed=0;
for(const [name,fn] of tests){
  try{fn();console.log(`PASS — ${name}`);}catch(err){failed++;console.error(`FAIL — ${name}`);console.error(`  ${err.message}`);}
}
if(failed)process.exitCode=1;
