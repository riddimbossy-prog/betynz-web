#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.resolve(__dirname,"..");
const {assertNoPackagedDemoFixtures}=require("./seed-guard");
const required=["index.html","styles.css","nav-core.js","boot.js","app.js","rebel-engine-core.js","olympian-engine-core.js","data.js","manifest.webmanifest","service-worker.js","CNAME"];
for(const file of required){if(!fs.existsSync(path.join(ROOT,file)))throw new Error(`Missing ${file}`)}
for(const file of ["nav-core.js","boot.js","app.js","rebel-engine-core.js","olympian-engine-core.js","scripts/build-snapshot.js","scripts/fetch-data.js","scripts/fetch-scores.js","scripts/enrich-rebel-odds.js"]){
  new vm.Script(fs.readFileSync(path.join(ROOT,file),"utf8"),{filename:file});
}
const index=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
if(/app-launch-splash|onboarding-modal|community-features\.js|backend-client\.js|monetization-config\.js|supabase-js/i.test(index))throw new Error("Removed startup layers are still referenced by index.html");
if(!/nav-core\.js\?v=6\.0\.0/.test(index))throw new Error("Immediate navigation core is missing");
if(!/window\.history\[method\]/.test(fs.readFileSync(path.join(ROOT,"app.js"),"utf8")))throw new Error("Navigation history fix is missing");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,"data.js"),"utf8"),ctx);
if(!Array.isArray(ctx.window.MATCHES))throw new Error("window.MATCHES is missing");
assertNoPackagedDemoFixtures(ctx.window.MATCHES,"validated public data");
const ids=new Set();
for(const match of ctx.window.MATCHES){
  if(!match.home||!match.away)throw new Error("Fixture without teams");
  const id=String(match.id);if(ids.has(id))throw new Error(`Duplicate fixture ${id}`);ids.add(id);
  if(match.zeusDecision&&(!match.zeusDecision.market||!Number.isFinite(Number(match.zeusDecision.confidence))))throw new Error(`Invalid Zeus decision on ${id}`);
}
if(/API_KEY\s*=\s*[A-Za-z0-9_-]{20,}/.test(fs.readFileSync(path.join(ROOT,"data.js"),"utf8")))throw new Error("Possible API key leaked into public data");
console.log(`Betynz Core validation passed: ${ctx.window.MATCHES.length} fixtures.`);
