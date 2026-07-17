#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.resolve(__dirname,"..");
const {assertNoPackagedDemoFixtures}=require("./seed-guard");
const required=["index.html","styles.css","app.js","community-features.js","engine-audit.js","rebel-engine-core.js","olympian-engine-core.js","data.js","manifest.webmanifest","service-worker.js","backend-config.js","backend-client.js","monetization-config.js","CNAME"];
for(const f of required){if(!fs.existsSync(path.join(ROOT,f)))throw new Error(`Missing ${f}`)}
for(const f of ["app.js","community-features.js","engine-audit.js","backend-client.js","rebel-engine-core.js","olympian-engine-core.js","scripts/build-snapshot.js","scripts/fetch-data.js","scripts/fetch-scores.js","scripts/enrich-rebel-odds.js"]){new vm.Script(fs.readFileSync(path.join(ROOT,f),"utf8"),{filename:f})}
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,"data.js"),"utf8"),ctx);
if(!Array.isArray(ctx.window.MATCHES))throw new Error("window.MATCHES is missing");
assertNoPackagedDemoFixtures(ctx.window.MATCHES,"validated public data");
const ids=new Set();for(const m of ctx.window.MATCHES){if(!m.home||!m.away)throw new Error("Fixture without teams");const id=String(m.id);if(ids.has(id))throw new Error(`Duplicate fixture ${id}`);ids.add(id);if(m.zeusDecision&&(!m.zeusDecision.market||!Number.isFinite(Number(m.zeusDecision.confidence))))throw new Error(`Invalid Zeus decision on ${id}`)}
if(ctx.window.BETYNZ_DEMO===false&&ctx.window.BETYNZ_META&&ctx.window.BETYNZ_META.isDemo===true)throw new Error("Data-state mismatch: live flag with demo metadata.");
if(ctx.window.BETYNZ_READY===true&&ctx.window.BETYNZ_META&&ctx.window.BETYNZ_META.source==="waiting-for-live-sync")throw new Error("Data-state mismatch: ready flag with pending source.");
if(/API_KEY\s*=\s*[A-Za-z0-9_-]{20,}/.test(fs.readFileSync(path.join(ROOT,"data.js"),"utf8")))throw new Error("Possible API key leaked into public data");
console.log(`Validation passed: ${ctx.window.MATCHES.length} fixtures.`);
