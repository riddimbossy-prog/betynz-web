#!/usr/bin/env node
"use strict";
const fs=require("fs");
const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app.js","utf8");
const nav=fs.readFileSync("nav-core.js","utf8");
const boot=fs.readFileSync("boot.js","utf8");
const experience=fs.readFileSync("experience.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
function assert(ok,message){if(!ok)throw new Error(message)}
const navPosition=index.indexOf("nav-core.js?v=6.1.0");
const bootPosition=index.indexOf("boot.js?v=6.1.0");
assert(navPosition>=0&&bootPosition>navPosition,"Immediate navigation core must load before the app bootloader.");
assert(index.includes("experience.js?v=6.1.0"),"The lightweight first-run experience must be present.");
assert(!/community-features\.js|backend-client\.js|supabase-js/i.test(index),"Heavy removed startup layers must not return.");
assert(index.includes('id="zeus-launch"'),"The lightweight Zeus launch must be present.");
assert(index.includes("pointer-events:none"),"The Zeus launch must never block taps.");
assert(nav.includes("window.BETYNZ_APP_READY"),"Early navigation must hand control to the main app after startup.");
assert(nav.includes("window.history.pushState"),"Early navigation must use browser history directly.");
assert(app.includes("const settledHistory="),"Settled-result data must not shadow browser history.");
assert(app.includes("window.history[method]"),"Main navigation must use window.history.");
assert(!/const history=Array\.isArray\(window\.BETYNZ_HISTORY\)/.test(app),"The history-shadowing navigation bug must stay removed.");
assert(boot.includes("DATA_WAIT_MS=650"),"The first app paint must have a short bounded data wait.");
assert(experience.includes("requestIdleCallback"),"The tour must wait for idle time rather than block startup.");
assert(sw.includes("betynz-core-v6.1.0"),"The service-worker cache must use the v6.1 version.");
assert(sw.includes("Promise.race([refresh,timeout(3500)])"),"A first install must not wait forever for live data.");
console.log("Betynz v6.1 navigation and experience regression checks passed.");
