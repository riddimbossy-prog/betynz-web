#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const HERE=__dirname,ROOT=path.resolve(HERE,"..");
const core=require(path.join(ROOT,"olympian-engine-core.js"));
const {removePackagedDemoFixtures,assertNoPackagedDemoFixtures,isPackagedDemoRecord}=require("./seed-guard");
const FINISHED=new Set(["FT","AET","PEN","AWD","WO"]);
function readJSON(file,fallback){try{return JSON.parse(fs.readFileSync(file,"utf8"))}catch(_){return fallback}}
function writeJSON(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n")}
function loadData(file){const code=fs.readFileSync(file,"utf8"),ctx={window:{}};vm.createContext(ctx);vm.runInContext(code,ctx,{filename:file});return ctx.window}
function iso(v){try{return new Date(v).toISOString()}catch(_){return null}}
function key(m){return String(m.id!=null?m.id:`${m.home}|${m.away}|${m.matchDate}`)}
function publicPrediction(id,o){return {engine:id,bet:!!o.bet,market:o.bet?o.primary:"No Bet",confidence:Number(o.confidence||0),reasons:o.reasons||[],warnings:o.warnings||[],dataQuality:o.dataQuality??null,supportOnly:!!o.supportOnly}}
const source=fs.existsSync(path.join(HERE,"data.js"))?path.join(HERE,"data.js"):path.join(ROOT,"data.js");
const loaded=loadData(source);
const cleaned=removePackagedDemoFixtures(Array.isArray(loaded.MATCHES)?loaded.MATCHES:[]);
const matches=cleaned.matches;
if(cleaned.removed)console.log(`Purged ${cleaned.removed} packaged demo fixture(s) before the Olympian snapshot.`);
const isDemo=!!loaded.BETYNZ_DEMO&&matches.length>0;
const isReady=loaded.BETYNZ_READY!==false&&String((loaded.BETYNZ_META&&loaded.BETYNZ_META.source)||"").toLowerCase()!=="waiting-for-live-sync";
const now=new Date(),nowISO=now.toISOString();
const lockFile=path.join(ROOT,"prediction-locks.json"),historyFile=path.join(ROOT,"results-history.json");
const rawLocks=readJSON(lockFile,{});
const locks=Object.fromEntries(Object.entries(rawLocks).filter(([,value])=>!isPackagedDemoRecord(value)));
const history=readJSON(historyFile,[]).filter(row=>!isPackagedDemoRecord(row));
const historyKeys=new Set(history.map(x=>`${x.fixtureId}|${x.market}`));
let createdLocks=0,settledAdded=0,qualified=0;
const engineCounts={};
for(const m of matches){
  let result=core.evaluateMatch(m),preds=[];
  if(isDemo&&Array.isArray(m.demoPredictions)&&m.demoPredictions.length){
    const demoMap={};
    for(const d of m.demoPredictions){demoMap[d.engine]={bet:true,primary:d.market,confidence:Number(d.confidence||80),reasons:d.reasons||["Demonstration selection."],warnings:d.warnings||[],dataQuality:80}}
    result.predictions={...result.predictions,...demoMap};
    const z=demoMap.zeus||m.demoPredictions.slice().sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0))[0];
    const zMarket=z.primary||z.market;
    const agreeing=m.demoPredictions.filter(d=>d.market===zMarket).map(d=>d.engine).filter(id=>id!=="zeus");
    result.decision={market:zMarket,confidence:Number(z.confidence||86),grade:Number(z.confidence||0)>=88?"A1":"A2",engineIds:agreeing,reasons:z.reasons||["Demonstration engine agreement."],warnings:[],dataQuality:80,odds:null};
  }
  for(const [id,o] of Object.entries(result.predictions)){
    preds.push(publicPrediction(id,o));if(o.bet)engineCounts[id]=(engineCounts[id]||0)+1;
  }
  m.olympianPredictions=preds;
  const fixtureKey=key(m),status=String(m.status||"").toUpperCase(),kickoff=m.kickoff?new Date(m.kickoff):null;
  const hours=kickoff&&Number.isFinite(kickoff.getTime())?(kickoff-now)/36e5:null;
  const publicDecision=result.decision&&["A1","A2"].includes(String(result.decision.grade||"").toUpperCase())?result.decision:null;
  m.zeusWatchlist=result.decision&&!publicDecision?{...result.decision,watchlist:true,publishedAt:nowISO}:null;
  const shouldLock=!isDemo&&publicDecision&&!FINISHED.has(status)&&(hours==null||hours<=12);
  if(shouldLock&&!locks[fixtureKey]){
    locks[fixtureKey]={fixtureId:fixtureKey,home:m.home,away:m.away,league:m.league,kickoff:iso(m.kickoff),publishedAt:nowISO,engineVersion:core.VERSION,decision:publicDecision};
    createdLocks++;
  }
  const lock=locks[fixtureKey];
  if(lock){m.zeusDecision={...lock.decision,locked:true,publishedAt:lock.publishedAt};m.predictionLocked=true;}
  else if(publicDecision){m.zeusDecision={...publicDecision,locked:false,provisional:true,publishedAt:nowISO};m.predictionLocked=false;}
  else {m.zeusDecision=null;m.zeusRejection=result.rejection||{reasons:["Zeus kept this fixture on the internal watchlist until deep evidence clears the public gate."],warnings:(result.decision&&result.decision.warnings)||[],dataQuality:(result.decision&&result.decision.dataQuality)||null};}
  if(m.zeusDecision)qualified++;
  if(FINISHED.has(status)&&lock&&m.homeGoals!=null&&m.awayGoals!=null){
    const hk=`${fixtureKey}|${lock.decision.market}`;
    if(!historyKeys.has(hk)){
      const settled=core.settleMarket(lock.decision.market,m.homeGoals,m.awayGoals);
      history.push({fixtureId:fixtureKey,home:m.home,away:m.away,league:m.league,kickoff:iso(m.kickoff),market:lock.decision.market,confidence:lock.decision.confidence,grade:lock.decision.grade,odds:lock.decision.odds??null,engineIds:lock.decision.engineIds||[],publishedAt:lock.publishedAt,settledAt:nowISO,score:`${m.homeGoals}-${m.awayGoals}`,result:settled});
      historyKeys.add(hk);settledAdded++;
    }
  }
}
history.sort((a,b)=>String(b.kickoff||"").localeCompare(String(a.kickoff||"")));
const trimmed=history.slice(0,500);
const settled=trimmed.filter(x=>["Won","Lost","Void"].includes(x.result)),wins=settled.filter(x=>x.result==="Won").length,losses=settled.filter(x=>x.result==="Lost").length;
assertNoPackagedDemoFixtures(matches,"Olympian snapshot");
const sourceName=isDemo?"demo":!isReady?"waiting-for-live-sync":matches.length?"API-Football + TheStatsAPI":"API-Football (no fixtures returned)";
const meta={product:"Betynz",version:"2.5.0",engineVersion:core.VERSION,source:sourceName,generatedAt:nowISO,dataUpdated:loaded.DATA_UPDATED||null,isDemo,isReady,fixtureCount:matches.length,qualifiedCount:qualified,lockedCount:Object.keys(locks).length,historyCount:trimmed.length,record:{wins,losses,voids:settled.filter(x=>x.result==="Void").length,hitRate:wins+losses?Math.round(wins/(wins+losses)*100):null},engineCounts};
const js=[isDemo?"window.BETYNZ_DEMO = true;":"window.BETYNZ_DEMO = false;",`window.BETYNZ_READY = ${JSON.stringify(isReady)};`,`window.DATA_UPDATED = ${JSON.stringify(meta.dataUpdated)};`,`window.BETYNZ_META = ${JSON.stringify(meta,null,2)};`,`window.BETYNZ_HISTORY = ${JSON.stringify(trimmed,null,2)};`,`window.MATCHES = ${JSON.stringify(matches,null,2)};`,""].join("\n");
fs.writeFileSync(path.join(ROOT,"data.js"),js);fs.writeFileSync(path.join(HERE,"data.js"),js);
writeJSON(lockFile,locks);writeJSON(historyFile,trimmed);writeJSON(path.join(ROOT,"api-status.json"),meta);
console.log(`Snapshot built: ${matches.length} fixtures, ${qualified} public decisions, ${createdLocks} new locks, ${settledAdded} settled results.`);
