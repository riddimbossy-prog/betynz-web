#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.resolve(__dirname,"..");
const required=["index.html","styles.css","runtime-config.js","data-source.js","nav-core.js","experience.js","boot.js","app.js","rebel-engine-core.js","olympian-engine-core.js","manifest.webmanifest","service-worker.js","CNAME"];
for(const file of required)if(!fs.existsSync(path.join(ROOT,file)))throw new Error(`Missing ${file}`);
for(const file of required.filter(file=>file.endsWith(".js")))new vm.Script(fs.readFileSync(path.join(ROOT,file),"utf8"),{filename:file});
const index=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
for(const file of ["runtime-config.js","data-source.js","nav-core.js","experience.js","boot.js"]){
  if(!index.includes(`${file}?v=6.2.0`))throw new Error(`${file} v6.2.0 is not loaded by index.html`);
}
if(/data\.js(?:\?|\")/i.test(index))throw new Error("The retired giant data.js file is still loaded by index.html");
if(/6\.1\.0|6\.0\.0/.test(index))throw new Error("Stale frontend version reference found in index.html");
const build=fs.readFileSync(path.join(ROOT,"scripts/build-dist.js"),"utf8");
for(const file of ["runtime-config.js","data-source.js","experience.js"]){if(!build.includes(`\"${file}\"`))throw new Error(`${file} is omitted from the release build`)}
const source=fs.readFileSync(path.join(ROOT,"data-source.js"),"utf8");
if(!source.includes("/api/dashboard/today"))throw new Error("Database dashboard endpoint is missing");
if(!source.includes("betynz:data-updated"))throw new Error("Live data update event is missing");
if(!source.includes("setInterval"))throw new Error("Automatic database refresh is missing");
const app=fs.readFileSync(path.join(ROOT,"app.js"),"utf8");
if(!app.includes("fixtureStatusRow"))throw new Error("Database fixtures cannot render without predictions");
if(!app.includes("BetynzDataSource.setActiveDate"))throw new Error("Date changes do not request database games");
const sw=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
if(/isVerifiedDataText|DATA_KEY|data\.js/.test(sw))throw new Error("Service worker still parses the giant data file");
const serviceConfig=fs.readFileSync(path.join(ROOT,"server/src/config.js"),"utf8");
if(!serviceConfig.includes("Betynz Prediction API")||!serviceConfig.includes("https://betynz.com"))throw new Error("Backend branding or CORS is not configured for Betynz");
const hydration=fs.readFileSync(path.join(ROOT,"server/src/services/historyHydrationService.js"),"utf8");
if(!/\{ force = false, targetTeamIds = null \}/.test(hydration))throw new Error("Targeted team-history hydration is broken");
const migrationPath=path.join(ROOT,"supabase/migrations/202607180001_betynz_core.sql");
if(!fs.existsSync(migrationPath))throw new Error("Betynz football database migration is missing");
const migration=fs.readFileSync(migrationPath,"utf8");
for(const table of ["leagues","teams","fixtures","team_htft_profiles","team_goal_profiles","predictions","prediction_results"]){
  if(!migration.includes(`create table if not exists public.${table}`))throw new Error(`Database table ${table} is missing from the migration`);
}
if(!migration.includes("enable row level security")||!migration.includes("revoke all on table public.fixtures"))throw new Error("Database security controls are missing");
console.log("Betynz v6.2.0 validation passed: database-first frontend, automatic fixture rows, complete Supabase schema, lightweight PWA and Betynz backend configuration.");
