"use strict";
const {evaluateGoalMarket}=require("../rebel-engine-core.js");

function base(engine,overrides={}){
  return {
    bookmakerCount:engine==="leonidas"?7:5,
    bookmakerAgreement:engine==="leonidas"?.78:.68,
    confirmations:engine==="leonidas"?3:2,
    contradictions:0,
    odds:{},movement:{},signals:{},
    ...overrides,
    odds:{...(overrides.odds||{})},
    movement:{...(overrides.movement||{})},
    signals:{...(overrides.signals||{})}
  };
}
const cases=[
  ["A — Spartacus Over 2.5 qualifies","spartacus",base("spartacus",{odds:{over25:1.58,under35:1.68,over15:1.24},movement:{over25:.06,under35:-.01,over15:.01},signals:{over15StrongSupported:true}}),"OVER_2_5"],
  ["A2 — Leonidas Over 2.5 qualifies at preferred movement","leonidas",base("leonidas",{odds:{over25:1.58,under35:1.68,over15:1.24},movement:{over25:.08,under35:-.01,over15:.01},signals:{over15StrongSupported:true}}),"OVER_2_5"],
  ["B — Over 2.5 rejected when Under 3.5 is 1.60 or lower","spartacus",base("spartacus",{odds:{over25:1.62,under35:1.52,over15:1.27},movement:{over25:.06,over15:.01}}),"OVER_1_5"],
  ["C — Leonidas Under 2.5 qualifies","leonidas",base("leonidas",{odds:{under25:1.64,over15:1.72,under35:1.28,over25:1.92},movement:{under25:.08,over25:-.02,under35:.01},signals:{under35Supported:true}}),"UNDER_2_5"],
  ["D — Under 2.5 rejected when Over 1.5 is 1.60 or lower","spartacus",base("spartacus",{odds:{under25:1.55,over15:1.28,under35:1.36},movement:{under25:.06,over15:.01}}),"OVER_1_5"],
  ["E — Under 3.5 automatic switch","spartacus",base("spartacus",{odds:{under35:1.48,over15:1.27},movement:{under35:0,over15:0}}),"OVER_1_5"],
  ["F — Under 3.5 and Over 1.5 both rejected","spartacus",base("spartacus",{odds:{under35:1.46,over15:1.38},movement:{under35:0,over15:0}}),"NO_BET"],
  ["G — Over 3.5 qualifies below 1.90","spartacus",base("spartacus",{odds:{over35:1.84,over25:1.55,under35:1.72,fhOver15:1.82,bttsYes:1.72},movement:{over35:.07,over25:.05,under35:-.01,fhOver15:.02,bttsYes:.02},signals:{fhOver15Supported:true,bttsYesSupported:true}}),"OVER_3_5"],
  ["H — Over 3.5 at 1.90+ downgrades to Over 2.5","spartacus",base("spartacus",{odds:{over35:1.96,over25:1.64,under35:1.67,over15:1.28},movement:{over35:.08,over25:.06,under35:-.01,over15:.01},signals:{over15StrongSupported:true}}),"OVER_2_5"],
  ["Boundary — Over 3.5 at exactly 1.90 is rejected","spartacus",base("spartacus",{odds:{over35:1.90,over25:1.75,under35:1.70,over15:1.31},movement:{over35:.08}}),"NO_BET"],
  ["Boundary — Under 3.5 at exactly 1.40 can qualify","spartacus",base("spartacus",{odds:{under35:1.40,over15:1.34},movement:{under35:.06},signals:{under35Supported:true}}),"UNDER_3_5"],
  ["Boundary — Under 3.5 at 1.41 switches only to safe Over 1.5","spartacus",base("spartacus",{odds:{under35:1.41,over15:1.30},movement:{under35:0,over15:0}}),"OVER_1_5"],
  ["Leonidas 6–7.99% Over 2.5 uses protected Over 2.0 Asian","leonidas",base("leonidas",{odds:{over25:1.58,under35:1.68,over15:1.24},movement:{over25:.065,under35:-.01,over15:.01},signals:{over15StrongSupported:true}}),"OVER_2_0_ASIAN"],
  ["Spartacus 4–5.99% Under 2.5 uses Under 3.0 Asian","spartacus",base("spartacus",{odds:{under25:1.60,over15:1.72,under35:1.35,over25:1.90},movement:{under25:.045,over25:-.01,under35:.01},signals:{under35Supported:true}}),"UNDER_3_0_ASIAN"],
  ["Over 1.5 above 1.30 is always rejected","spartacus",base("spartacus",{odds:{under35:1.48,over15:1.31},movement:{over15:.03}}),"NO_BET"],
  ["Strong low-scoring contradiction blocks Over 2.5","spartacus",base("spartacus",{odds:{over25:1.55,under35:1.68,over15:1.26},movement:{over25:.07,under35:-.01,over15:.01,bttsNo:.07,fhUnder15:.07},signals:{over15StrongSupported:true,bttsNoStrong:true,fhUnder15Strong:true,lowScoringContradiction:true,majorLowScoringHtFt:true}}),"NO_BET"],
  ["Decision order does not override stronger valid market","spartacus",base("spartacus",{odds:{over35:1.84,over25:1.55,under35:1.35,under25:1.58,over15:1.72},movement:{over35:.045,over25:-.01,under25:.07,under35:.01},signals:{fhOver15Supported:true,bttsYesSupported:true,under35Supported:true}}),"UNDER_2_5"]
];
let failed=0;
for(const [name,engine,input,expected] of cases){
  const out=evaluateGoalMarket(input,engine);const pass=out.market===expected;
  console.log(`${pass?"PASS":"FAIL"} — ${name}`);
  if(!pass){console.log(`  expected: ${expected}`);console.log(`  received: ${out.market}`);console.log(`  reason: ${out.reason}`);failed++;}
}
if(failed)process.exitCode=1;
