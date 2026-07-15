/* ============================================================
   enrich-rebel-odds.js — persistent bookmaker movement snapshots

   Sources:
   1) oddsBooksCurrent captured during the normal API-Football league/date pass.
   2) A small fixture-level API-Football refresh when this script runs hourly.
   3) Vendor opening/current pairs already supplied by TheStatsAPI.

   The first observed price becomes a baseline only when no genuine vendor
   opening price exists. Later runs update the current price. Leonidas and
   Spartacus therefore receive real timestamped opening/current pairs instead
   of fabricated movement.
   ============================================================ */
"use strict";
const fs=require("fs");
const path=require("path");
const https=require("https");
const HERE=__dirname;
const DATA_FILE=path.join(HERE,"data.js");
const HISTORY_FILE=path.join(HERE,"rebel-odds-history.json");
const PLAN_FILE=path.join(HERE,"enrichment-plan.json");

const n=v=>{const x=Number(v);return Number.isFinite(x)&&x>1?x:null};
const cleanName=s=>String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ");
const matchKey=m=>String(m&&m.id!=null?m.id:`${m.home}|${m.away}|${m.kickoff||m.matchDate||""}`);
const isoNow=()=>new Date().toISOString();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function readConfig(){
  const cfg={API_KEY:"",ODDS_API_KEY:""};
  try{
    const raw=fs.readFileSync(path.join(HERE,"config.txt"),"utf8");
    for(const line0 of raw.split(/\r?\n/)){
      const line=line0.trim();if(!line||line.startsWith("#"))continue;
      const i=line.indexOf("=");if(i<0)continue;
      const k=line.slice(0,i).trim().toUpperCase(),v=line.slice(i+1).trim().replace(/^['"]|['"]$/g,"");
      if(k==="API_KEY")cfg.API_KEY=v;
      if(k==="ODDS_API_KEY")cfg.ODDS_API_KEY=v;
    }
  }catch(_){ }
  return cfg;
}
function readData(){
  const raw=fs.readFileSync(DATA_FILE,"utf8");
  const mm=raw.match(/window\.MATCHES\s*=\s*([\s\S]*?);\s*$/m);
  if(!mm)throw new Error("Could not parse scripts/data.js");
  const updated=(raw.match(/window\.DATA_UPDATED\s*=\s*([^;]+);/)||[])[1]||JSON.stringify(new Date().toISOString());
  const enriched=(raw.match(/window\.ENRICHED_AT\s*=\s*([^;]+);/)||[])[1]||null;
  return{matches:JSON.parse(mm[1]),updated,enriched};
}
function readHistory(){
  try{const h=JSON.parse(fs.readFileSync(HISTORY_FILE,"utf8"));if(h&&typeof h==="object")return h}catch(_){ }
  return{version:2,updatedAt:null,fixtures:{}};
}
function readPriorityIds(){
  try{
    const p=JSON.parse(fs.readFileSync(PLAN_FILE,"utf8"));
    const ids=p&&p.selected&&(p.selected.tsaFixtureIds||p.selected.fixtureIds)||[];
    return new Set((Array.isArray(ids)?ids:[]).map(String));
  }catch(_){return new Set()}
}
function marketPairs(opening,current){
  return [...new Set([...Object.keys(opening||{}),...Object.keys(current||{})])]
    .filter(k=>n(opening&&opening[k])&&n(current&&current[k])).length;
}
function normalSnapshot(x){
  if(!x||typeof x!=="object")return null;
  const opening={},current={};
  for(const [k,v] of Object.entries(x.opening||x.open||{})){const z=n(v);if(z)opening[k]=z}
  for(const [k,v] of Object.entries(x.current||x.odds||{})){const z=n(v);if(z)current[k]=z}
  const pairs=marketPairs(opening,current);if(!pairs)return null;
  return{bookmaker:String(x.bookmaker||x.name||"Bookmaker"),timestamp:x.timestamp||x.updatedAt||x.last_updated||isoNow(),timestampSource:x.timestampSource||"vendor",opening,current,marketPairs:pairs,source:x.source||"TheStatsAPI"};
}
function mergeSnapshots(existing,captured){
  const map=new Map();
  for(const row of [...existing,...captured]){
    const snap=normalSnapshot(row);if(!snap)continue;
    const key=cleanName(snap.bookmaker)||`book ${map.size+1}`;
    if(!map.has(key)){map.set(key,snap);continue}
    const prev=map.get(key),opening={...snap.opening,...prev.opening},current={...prev.current,...snap.current};
    map.set(key,{...prev,...snap,opening,current,marketPairs:marketPairs(opening,current),source:[prev.source,snap.source].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(" + ")});
  }
  return[...map.values()].sort((a,b)=>b.marketPairs-a.marketPairs||a.bookmaker.localeCompare(b.bookmaker));
}
function hasMovement(snapshot,min=.003){
  for(const key of Object.keys(snapshot.opening||{})){
    const o=n(snapshot.opening[key]),c=n(snapshot.current&&snapshot.current[key]);
    if(o&&c&&Math.abs(o-c)/o>=min)return true;
  }
  return false;
}
function prune(history){
  const cutoff=Date.now()-14*86400000;
  for(const [key,row] of Object.entries(history.fixtures||{})){
    const t=Date.parse(row.kickoff||row.updatedAt||"");
    if(Number.isFinite(t)&&t<cutoff)delete history.fixtures[key];
  }
}
function apiFootball(endpoint,key){
  return new Promise((resolve,reject)=>{
    const req=https.request({hostname:"v3.football.api-sports.io",path:endpoint,method:"GET",headers:{"x-apisports-key":key,"Accept":"application/json","User-Agent":"Betynz-Rebel-Odds/2.0"}},res=>{
      let body="";res.on("data",d=>body+=d);res.on("end",()=>{
        if(res.statusCode<200||res.statusCode>=300)return reject(new Error(`HTTP ${res.statusCode}`));
        try{const json=JSON.parse(body);if(json.errors&&Object.keys(json.errors).length)return reject(new Error(JSON.stringify(json.errors)));resolve(json)}catch(e){reject(e)}
      });
    });
    req.setTimeout(25000,()=>req.destroy(new Error("timeout")));req.on("error",reject);req.end();
  });
}
function parseApiFootballBooks(response){
  const rows=[];
  const numberOdd=value=>{const x=Number(value);return Number.isFinite(x)&&x>1?x:null};
  const findBet=(bets,re)=>(bets||[]).find(b=>re.test(b&&b.name||""));
  const pick=(bet,re)=>{if(!bet||!Array.isArray(bet.values))return null;const row=bet.values.find(x=>re.test(String(x&&x.value||"")));return row?numberOdd(row.odd):null};
  const parseBook=bk=>{
    const bets=Array.isArray(bk&&bk.bets)?bk.bets:[],vals={},add=(k,v)=>{if(v!=null)vals[k]=v};
    const mw=findBet(bets,/match winner|1x2|full time result/i);add("home",pick(mw,/^(home|1)$/i));add("draw",pick(mw,/^(draw|x)$/i));add("away",pick(mw,/^(away|2)$/i));
    const ou=findBet(bets,/goals over\/under|over\/under|total goals/i);
    add("over15",pick(ou,/over 1\.5/i));add("under15",pick(ou,/under 1\.5/i));add("over25",pick(ou,/over 2\.5/i));add("under25",pick(ou,/under 2\.5/i));add("over35",pick(ou,/over 3\.5/i));add("under35",pick(ou,/under 3\.5/i));
    const btts=findBet(bets,/both teams (to )?score|btts/i);add("bttsYes",pick(btts,/^yes/i));add("bttsNo",pick(btts,/^no/i));
    const dc=findBet(bets,/double chance/i);add("dc1x",pick(dc,/home\/draw|1x|^1\/x/i));add("dc12",pick(dc,/home\/away|12|^1\/2/i));add("dcx2",pick(dc,/draw\/away|x2|^x\/2/i));
    const dnb=findBet(bets,/draw no bet|dnb/i);add("homeDnb",pick(dnb,/^(home|1)$/i));add("awayDnb",pick(dnb,/^(away|2)$/i));
    const fhou=findBet(bets,/(first|1st) half.*over\/under|over\/under.*(first|1st) half|goals.*(first|1st) half/i);add("fhOver05",pick(fhou,/over 0\.5/i));add("fhOver15",pick(fhou,/over 1\.5/i));add("fhUnder15",pick(fhou,/under 1\.5/i));
    const htft=findBet(bets,/half time\/full time|half[- ]?time.*full[- ]?time|ht\/ft|htft/i);
    for(const [k,re] of Object.entries({htft11:/^(1\/1|1-1|home\/home)$/i,htftX1:/^(x\/1|x-1|draw\/home)$/i,htft22:/^(2\/2|2-2|away\/away)$/i,htftX2:/^(x\/2|x-2|draw\/away)$/i}))add(k,pick(htft,re));
    return vals;
  };
  for(const entry of response&&response.response||[]){
    const ts=entry.update||entry.updated_at||isoNow();
    for(const bk of entry.bookmakers||[]){
      const current=parseBook(bk);if(!Object.keys(current).length)continue;
      rows.push({bookmaker:bk.name||bk.bookmaker||`Book ${rows.length+1}`,bookmakerId:bk.id||null,timestamp:ts,current,marketPairs:Object.keys(current).length,source:"API-Football"});
    }
  }
  return rows;
}
async function refreshCurrentBooks(matches,cfg){
  if(!cfg.API_KEY)return 0;
  const limit=Math.max(1,Math.min(80,Number(process.env.REBEL_ODDS_MAX_MATCHES||36)));
  const priority=readPriorityIds(),now=Date.now();
  const upcoming=matches.filter(m=>m&&m.id!=null&&!/^(FT|AET|PEN|CANC|PST|ABD|AWD|WO)$/i.test(String(m.status||""))&&Date.parse(m.kickoff||"")>now-3600000);
  upcoming.sort((a,b)=>{
    const ap=priority.has(String(a.id))?0:1,bp=priority.has(String(b.id))?0:1;
    return ap-bp||Date.parse(a.kickoff||0)-Date.parse(b.kickoff||0);
  });
  let calls=0,books=0;
  for(const m of upcoming.slice(0,limit)){
    if(Array.isArray(m.oddsBooksCurrent)&&m.oddsBooksCurrent.length)continue;
    try{
      const json=await apiFootball(`/odds?fixture=${encodeURIComponent(m.id)}`,cfg.API_KEY);calls++;
      const rows=parseApiFootballBooks(json);if(rows.length){m.oddsBooksCurrent=rows;books+=rows.length}
    }catch(e){console.log(`Rebel odds refresh skipped fixture ${m.id}: ${e.message}`)}
    await sleep(170);
  }
  console.log(`Fixture-level rebel odds refresh: ${calls} API calls, ${books} bookmaker rows.`);
  return calls;
}

(async function main(){
  const cfg=readConfig(),{matches,updated,enriched}=readData();
  await refreshCurrentBooks(matches,cfg);
  const history=readHistory();history.fixtures=history.fixtures||{};
  const now=isoNow();
  let currentBooks=0,pairedBooks=0,spartacusReady=0,leonidasReady=0,movementReady=0;

  for(const m of matches){
    const key=matchKey(m),fixture=history.fixtures[key]||(history.fixtures[key]={home:m.home,away:m.away,kickoff:m.kickoff||m.matchDate,updatedAt:now,books:{}});
    fixture.home=m.home;fixture.away=m.away;fixture.kickoff=m.kickoff||m.matchDate;fixture.updatedAt=now;fixture.books=fixture.books||{};
    const liveBooks=Array.isArray(m.oddsBooksCurrent)?m.oddsBooksCurrent:[];currentBooks+=liveBooks.length;
    const captured=[];

    for(const book of liveBooks){
      const name=String(book.bookmaker||book.name||`Book ${captured.length+1}`),bookKey=cleanName(name)||`book ${captured.length+1}`;
      const stored=fixture.books[bookKey]||(fixture.books[bookKey]={bookmaker:name,firstSeen:book.timestamp||now,lastSeen:book.timestamp||now,markets:{}});
      stored.bookmaker=name;stored.lastSeen=book.timestamp||now;stored.markets=stored.markets||{};
      const current=book.current&&typeof book.current==="object"?book.current:{};
      for(const [market,value] of Object.entries(current)){
        const price=n(value);if(!price)continue;
        const vendorOpening=n(m.oddsOpen&&m.oddsOpen[market]);
        const row=stored.markets[market]||(stored.markets[market]={opening:vendorOpening||price,current:price,firstSeen:book.timestamp||now,lastSeen:book.timestamp||now,openingSource:vendorOpening?"vendor-aggregate":"first-observed"});
        if(!n(row.opening))row.opening=vendorOpening||price;
        row.current=price;row.lastSeen=book.timestamp||now;
      }
      const opening={},latest={};
      for(const [market,row] of Object.entries(stored.markets)){const o=n(row.opening),c=n(row.current);if(o&&c){opening[market]=o;latest[market]=c}}
      const pairs=marketPairs(opening,latest);if(!pairs)continue;
      captured.push({bookmaker:name,timestamp:stored.lastSeen,timestampSource:"observed",opening,current:latest,marketPairs:pairs,source:"API-Football history"});
    }

    const existing=(Array.isArray(m.oddsBooks)?m.oddsBooks:[]).map(normalSnapshot).filter(Boolean),combined=mergeSnapshots(existing,captured);
    if(combined.length){
      m.oddsBooks=combined;pairedBooks+=combined.length;
      const primary=combined.find(x=>x.opening.home&&x.opening.draw&&x.opening.away&&x.current.home&&x.current.draw&&x.current.away)||combined[0];
      m.oddsOpen={...(m.oddsOpen||{}),...primary.opening};m.oddsLast={...(m.oddsLast||{}),...primary.current};m.odds={...(m.odds||{})};
      for(const [market,price] of Object.entries(primary.current)){if(!n(m.odds[market]))m.odds[market]=price}
      const eligible=combined.filter(x=>x.marketPairs>=3),movers=eligible.filter(x=>hasMovement(x)),allMarkets=[...new Set(combined.flatMap(x=>Object.keys(x.opening||{})))].sort();
      m.rebelOddsCoverage={bookmakers:combined.length,eligibleBookmakers:eligible.length,movingBookmakers:movers.length,markets:allMarkets,fullMarketBooks:combined.filter(x=>x.marketPairs>=6).length,sources:[...new Set(combined.map(x=>x.source).filter(Boolean))],status:eligible.length>=5?"leonidas-ready":eligible.length>=3?"spartacus-ready":"collecting"};
      m.rebelOddsStatus=m.rebelOddsCoverage.status;m.oddsUpdatedAt=now;
      if(eligible.length>=3)spartacusReady++;if(eligible.length>=5)leonidasReady++;if(movers.length>=3)movementReady++;
    }else{
      m.rebelOddsCoverage={bookmakers:0,eligibleBookmakers:0,movingBookmakers:0,markets:[],fullMarketBooks:0,sources:[],status:"collecting"};m.rebelOddsStatus="collecting";
    }
    delete m.oddsBooksCurrent;
  }

  prune(history);history.updatedAt=now;fs.writeFileSync(HISTORY_FILE,JSON.stringify(history,null,2)+"\n","utf8");
  const out=`window.DATA_UPDATED = ${updated};\n`+(enriched?`window.ENRICHED_AT = ${enriched};\n`:"")+`window.REBEL_ODDS_AT = ${JSON.stringify(now)};\nwindow.MATCHES = ${JSON.stringify(matches,null,2)};\n`;
  fs.writeFileSync(DATA_FILE,out,"utf8");
  console.log(`Rebel odds: ${currentBooks} current bookmaker rows captured; ${pairedBooks} opening/current pairs retained.`);
  console.log(`Coverage: Spartacus-ready fixtures=${spartacusReady}, Leonidas-ready fixtures=${leonidasReady}, active movement fixtures=${movementReady}.`);
  if(!movementReady)console.log("No qualifying price changes yet. Baselines are stored; the next hourly refresh will compare new prices against them.");
})().catch(err=>{console.error(err);process.exit(1)});
