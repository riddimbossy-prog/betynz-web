"use strict";
const fs=require("fs");
const path=require("path");
const HERE=__dirname;
const MIN_BAND_SAMPLE=5;
const band=o=>o<1.45?"1.20-1.44":o<1.70?"1.45-1.69":o<2?"1.70-1.99":o<2.5?"2.00-2.49":"2.50+";
const MARKETS={
  "Home Win":{key:"home",hit:(h,a)=>h>a},
  "Away Win":{key:"away",hit:(h,a)=>a>h},
  "Over 1.5 Goals":{key:"over15",hit:(h,a)=>h+a>=2},
  "Over 2.5 Goals":{key:"over25",hit:(h,a)=>h+a>=3},
  "Under 2.5 Goals":{key:"under25",hit:(h,a)=>h+a<=2},
  "Under 3.5 Goals":{key:"under35",hit:(h,a)=>h+a<=3},
  "BTTS Yes":{key:"bttsYes",hit:(h,a)=>h>0&&a>0},
  "BTTS No":{key:"bttsNo",hit:(h,a)=>!(h>0&&a>0)}
};
function validFinished(m){return m&&m.homeGoals!=null&&m.awayGoals!=null&&["FT","AET","PEN","AWD","WO"].includes(String(m.status||"").toUpperCase())}
function buildOddsCalib(matches){
  const ledger={version:"1.0",updated:new Date().toISOString(),leagues:{}};
  for(const m of matches||[]){
    if(!validFinished(m)||!m.odds)continue;
    const league=String(m.leagueId||m.league||"Unknown");
    const L=ledger.leagues[league]||(ledger.leagues[league]={name:m.league||league,markets:{}});
    for(const [market,cfg] of Object.entries(MARKETS)){
      const odds=Number(m.odds[cfg.key]);if(!Number.isFinite(odds)||odds<=1)continue;
      const b=band(odds),M=L.markets[market]||(L.markets[market]={}),R=M[b]||(M[b]={n:0,hits:0,hit:null});
      R.n++;if(cfg.hit(Number(m.homeGoals),Number(m.awayGoals)))R.hits++;R.hit=Math.round(R.hits/R.n*100)/100;
    }
  }
  let attached=0;
  for(const m of matches||[]){const league=String(m.leagueId||m.league||"Unknown");m.oddsCalib=ledger.leagues[league]||null;if(m.oddsCalib)attached++}
  try{fs.writeFileSync(path.join(HERE,"odds-calib.json"),JSON.stringify(ledger,null,2)+"\n")}catch(_){}
  return {leagues:Object.keys(ledger.leagues).length,attached,ledger};
}
module.exports={band,MARKETS,MIN_BAND_SAMPLE,buildOddsCalib};
