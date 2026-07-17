#!/usr/bin/env node
"use strict";
const fs=require("fs");
const index=fs.readFileSync("index.html","utf8");
const boot=fs.readFileSync("boot.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
const app=fs.readFileSync("app.js","utf8");
const community=fs.readFileSync("community-features.js","utf8");
function assert(ok,message){if(!ok)throw new Error(message)}
assert(index.includes('rel="preload" href="data.js?v=5.9.3"'),"The verified board must be preloaded with high priority.");
assert(index.includes('boot.js?v=5.9.3'),"The first-visit boot loader must be installed.");
assert(!index.includes('<script src="data.js?v=5.9.3"></script>'),"data.js must not block the HTML parser directly.");
assert(/DATA_TIMEOUT=4500/.test(boot),"First-visit data waiting must have a hard timeout.");
assert(/betynz-late-data-reload-v593/.test(boot),"Late verified data must trigger only one recovery reload.");
assert(/if\(cached\)return cached/.test(sw),"Repeat launches must return the verified cached board immediately.");
assert(/event\.waitUntil\(network\)/.test(sw),"The fresh board must continue downloading in the background.");
assert(/BETYNZ_DATA_READY/.test(sw)&&/BETYNZ_DATA_READY/.test(app),"Service worker and app must coordinate verified data readiness.");
assert(/async src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase/.test(index),"Supabase must load asynchronously.");
assert(/scheduleSecondaryViews\(\)/.test(app),"Hidden views must be deferred until after the dashboard paint.");
assert(!/renderCommunity\(\);renderPerformance\(\);renderHealth\(\)/.test(community),"Hidden community pages must not render during startup.");
console.log("Instant data boot regression checks passed.");
