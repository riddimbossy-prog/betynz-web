#!/usr/bin/env node
"use strict";
const fs=require("fs");
const community=fs.readFileSync("community-features.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
const app=fs.readFileSync("app.js","utf8");
function assert(ok,message){if(!ok)throw new Error(message)}
assert(!/observe\(document\.body,\{childList:true,subtree:true\}\)/.test(community),"Do not observe the entire body for engine-card decoration.");
assert(/observer\.observe\(grid,\{childList:true,subtree:false\}\)/.test(community),"Engine-card observer must be scoped to the engine grid.");
assert(/if\(btn\.textContent!==label\)btn\.textContent=label/.test(community),"Follow text must only update when it changed.");
assert(index.includes("community-features.js?v=5.9.1"),"Index must request the repaired community script with a fresh cache key.");
assert(index.includes("app.js?v=5.9.1"),"Index must request the repaired app script with a fresh cache key.");
assert(sw.includes("betynz-v5.9.1"),"Service worker cache must be bumped.");
assert(app.includes("if(allPicksMemo)return allPicksMemo"),"The full pick list must be memoized for populated boards.");
assert(app.includes("betynz-sw-reload-v591"),"PWA activation must have a one-reload guard.");
console.log("Navigation freeze regression checks passed.");
