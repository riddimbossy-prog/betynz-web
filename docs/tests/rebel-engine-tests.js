"use strict";
const fs=require("fs"),path=require("path");
const {evaluateGoalMarket,evaluateFavorite}=require("../rebel-engine-core.js");
const tests=JSON.parse(fs.readFileSync(path.join(__dirname,"rebel-sample-fixtures.json"),"utf8"));
let failed=0;
for(const test of tests){
  const result=test.type==="favorite"?evaluateFavorite(test.input,test.engine):evaluateGoalMarket(test.input,test.engine);
  const pass=result.market===test.expected;
  console.log(`${pass?"PASS":"FAIL"} — ${test.name}`);
  if(!pass){console.log(`  expected: ${test.expected}`);console.log(`  received: ${result.market}`);console.log(`  reason: ${result.reason}`);failed++;}
}
if(failed)process.exitCode=1;
