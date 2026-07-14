/* ============================================================
   enrich-xg.js — ENRICHMENT PASS (runs AFTER fetch-data.js).
   Reads the existing data.js (built by API-Football), then queries TheStatsAPI
   for the SAME fixtures and writes premium fields onto matches where it can
   confidently match them:
     - xgHomeReal / xgAwayReal      (match-level expected goals)
     - npxgHomeReal / npxgAwayReal  (non-penalty xG — better for modelling)
     - lineupConfirmed              (true once official XI is announced)
     - oddsOpen / oddsLast          (line movement: opening vs last-seen)
     - xgReal: true                 (flag so engines know to trust real xG)
   SAFETY: this is purely ADDITIVE. If it can't match a fixture, or the API has
   no data, it leaves the match exactly as API-Football built it. It NEVER
   removes matches or existing fields. If anything fails, the site runs as today.
   Auth: reads STATS_API_KEY from config.txt (kept in GitHub Secrets).
   ============================================================ */
const fs = require("fs");
const path = require("path");
const https = require("https");
const HERE = __dirname;

function readConfig() {
  const raw = fs.readFileSync(path.join(HERE, "config.txt"), "utf8");
  const cfg = { STATS_API_KEY: "" };
  for (let line of raw.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("="); if (eq === -1) continue;
    const key = line.slice(0, eq).trim().toUpperCase();
    const val = line.slice(eq + 1).trim();
    if (key === "STATS_API_KEY") cfg.STATS_API_KEY = val.replace(/['"]/g, "").trim();
  }
  return cfg;
}

// TheStatsAPI GET with Bearer auth
function api(endpoint, key) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: "GET", hostname: "api.thestatsapi.com",
      path: "/api" + endpoint,
      headers: { "Authorization": "Bearer " + key, "Accept": "application/json" }
    };
    const req = https.request(opts, res => {
      let body = ""; res.on("data", d => body += d);
      res.on("end", () => {
        if (res.statusCode === 401) { reject(new Error("UNAUTHORIZED — check STATS_API_KEY")); return; }
        if (res.statusCode === 429) { reject(new Error("RATE_LIMIT")); return; }
        if (res.statusCode >= 400) { reject(new Error("HTTP " + res.statusCode)); return; }
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject); req.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// normalise team names so "Man Utd" ~ "Manchester United" can match
function stripAccents(s){ return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function normName(s){
  return stripAccents(s).toLowerCase()
    .replace(/\b(fc|cf|sc|ac|afc|cd|sv|ss|us|if|bk|fk|cp|ca|sd|ud)\b/g," ")
    .replace(/\bmanchester\b/g,"man")
    .replace(/\bunited\b/g,"utd")
    .replace(/\b(women|ladies|fem|feminino|femenino)\b/g,"w")
    .replace(/[^a-z0-9 ]/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function tokens(s){ return normName(s).split(" ").filter(t=>t.length>=2); }
// fuzzy: do two names refer to the same club?
function sameTeam(a,b){
  const x=normName(a).replace(/ /g,""), y=normName(b).replace(/ /g,"");
  if(!x||!y) return false;
  if(x===y) return true;
  if(x.length>=4 && y.length>=4 && (x.includes(y)||y.includes(x))) return true;
  // token overlap: if they share the main distinguishing word(s)
  const ta=tokens(a), tb=tokens(b);
  if(!ta.length||!tb.length) return false;
  const shared = ta.filter(t=>tb.includes(t));
  // require sharing the longest token (the club's core name) or 2+ tokens
  const longestA = ta.slice().sort((p,q)=>q.length-p.length)[0];
  if(shared.includes(longestA) && longestA.length>=4) return true;
  if(shared.length>=2) return true;
  return false;
}

function oddPrice(x){
  if(x==null)return null;
  if(typeof x==="number"||typeof x==="string"){const v=Number(x);return Number.isFinite(v)?v:null;}
  const v=Number(x.last_seen??x.closing??x.current??x.price??x.odd??x.odds??x.opening);
  return Number.isFinite(v)?v:null;
}
function oddOpening(x){
  if(x==null||typeof x!=="object")return null;
  const v=Number(x.opening??x.open??x.initial);
  return Number.isFinite(v)?v:null;
}
function oddKey(x){return String(x||"").toLowerCase().replace(/[^a-z0-9]+/g,"");}
function findMarket(markets,aliases){
  if(!markets||typeof markets!=="object")return null;
  const entries=Object.entries(markets),targets=aliases.map(oddKey);
  for(const [key,value] of entries){const k=oddKey(key);if(targets.some(t=>k===t||k.includes(t)||t.includes(k)))return value;}
  return null;
}
function selectionItems(market){
  if(!market)return[];
  if(Array.isArray(market))return market;
  for(const key of ["values","selections","outcomes","options"]){if(Array.isArray(market[key]))return market[key];}
  return Object.entries(market).map(([key,value])=>({__key:key,__value:value,...(value&&typeof value==="object"?value:{})}));
}
function findSelection(market,aliases){
  if(!market)return null;
  const targets=aliases.map(oddKey);
  if(typeof market==="object"&&!Array.isArray(market)){
    for(const [key,value] of Object.entries(market)){const k=oddKey(key);if(targets.some(t=>k===t||k.includes(t)||t.includes(k)))return value;}
  }
  for(const item of selectionItems(market)){
    const label=item.name??item.label??item.selection??item.outcome??item.value??item.__key;
    const k=oddKey(label);if(targets.some(t=>k===t||k.includes(t)||t.includes(k)))return item.__value??item;
  }
  return null;
}
function addOddsPair(open,current,key,selection){
  const o=oddOpening(selection),c=oddPrice(selection);
  if(Number.isFinite(o)&&Number.isFinite(c)&&o>1&&c>1){open[key]=o;current[key]=c;return true;}
  return false;
}
function extractBookMarkets(bm){
  const markets=bm&&bm.markets||{},open={},current={};
  const match=findMarket(markets,["match_odds","1x2","match_result","full_time_result"]);
  addOddsPair(open,current,"home",findSelection(match,["home","1"]));
  addOddsPair(open,current,"draw",findSelection(match,["draw","x"]));
  addOddsPair(open,current,"away",findSelection(match,["away","2"]));
  const totals=findMarket(markets,["total_goals","goals_over_under","over_under","match_goals"]);
  for(const [key,aliases] of Object.entries({over15:["over 1.5","over15","o1.5"],under15:["under 1.5","under15","u1.5"],over25:["over 2.5","over25","o2.5"],under25:["under 2.5","under25","u2.5"],over35:["over 3.5","over35","o3.5"],under35:["under 3.5","under35","u3.5"]}))addOddsPair(open,current,key,findSelection(totals,aliases));
  const btts=findMarket(markets,["both_teams_to_score","btts"]);
  addOddsPair(open,current,"bttsYes",findSelection(btts,["yes","btts yes"]));
  addOddsPair(open,current,"bttsNo",findSelection(btts,["no","btts no"]));
  const dc=findMarket(markets,["double_chance","doublechance"]);
  addOddsPair(open,current,"dc1x",findSelection(dc,["1x","home draw","home/draw"]));
  addOddsPair(open,current,"dc12",findSelection(dc,["12","home away","home/away"]));
  addOddsPair(open,current,"dcx2",findSelection(dc,["x2","draw away","draw/away"]));
  const dnb=findMarket(markets,["draw_no_bet","dnb"]);
  addOddsPair(open,current,"homeDnb",findSelection(dnb,["home","1"]));
  addOddsPair(open,current,"awayDnb",findSelection(dnb,["away","2"]));
  const fhTotals=findMarket(markets,["first_half_total_goals","first_half_over_under","1st_half_total_goals"]);
  addOddsPair(open,current,"fhOver05",findSelection(fhTotals,["over 0.5","over05","o0.5"]));
  addOddsPair(open,current,"fhOver15",findSelection(fhTotals,["over 1.5","over15","o1.5"]));
  addOddsPair(open,current,"fhUnder15",findSelection(fhTotals,["under 1.5","under15","u1.5"]));
  const htft=findMarket(markets,["half_time_full_time","ht_ft","htft"]);
  for(const [key,aliases] of Object.entries({htft11:["1/1","1-1","home/home"],htftX1:["x/1","x-1","draw/home"],htft21:["2/1","2-1","away/home"],htft1X:["1/x","1-x","home/draw"],htftXX:["x/x","x-x","draw/draw"],htft2X:["2/x","2-x","away/draw"],htft12:["1/2","1-2","home/away"],htftX2:["x/2","x-2","draw/away"],htft22:["2/2","2-2","away/away"]}))addOddsPair(open,current,key,findSelection(htft,aliases));
  return{open,current,pairCount:Object.keys(open).length};
}

function loadMatches(){
  const raw = fs.readFileSync(path.join(HERE,"data.js"),"utf8");
  const m = raw.match(/window\.MATCHES\s*=\s*([\s\S]*?);\s*$/m);
  if(!m) throw new Error("Could not parse window.MATCHES");
  const updated = (raw.match(/window\.DATA_UPDATED\s*=\s*"([^"]+)"/)||[])[1] || new Date().toISOString();
  return { matches: JSON.parse(m[1]), updated, raw };
}

function loadEnrichmentPlan(){
  try {
    const plan = JSON.parse(fs.readFileSync(path.join(HERE,"enrichment-plan.json"),"utf8"));
    const ids = plan && plan.selected && Array.isArray(plan.selected.tsaFixtureIds)
      ? plan.selected.tsaFixtureIds.map(String) : [];
    return new Set(ids);
  } catch (_) { return new Set(); }
}

(async function main(){
  const cfg = readConfig();
  if(!cfg.STATS_API_KEY){ console.log("No STATS_API_KEY set — skipping enrichment (site unaffected)."); process.exit(0); }

  let loaded;
  try { loaded = loadMatches(); }
  catch(e){ console.log("Could not read data.js — skipping enrichment:", e.message); process.exit(0); }
  const { matches, updated } = loaded;
  const plannedIds = loadEnrichmentPlan();
  const maxMatches = Math.max(1, Number(process.env.TSA_MAX_MATCHES || 24));
  const scopedMatches = (plannedIds.size ? matches.filter(m=>plannedIds.has(String(m.id))) : matches)
    .slice(0, maxMatches);
  console.log(`TheStatsAPI adaptive scope: ${scopedMatches.length}/${matches.length} fixtures.`);

  // only enrich the priority scope; this keeps calls concentrated on matches
  // that can realistically become public Zeus selections.
  const dates = new Set();
  scopedMatches.forEach(m=>{ if(m.matchDate) dates.add(m.matchDate); });
  const dateList = [...dates].sort().slice(-6); // cap the window

  // build a lookup of TheStatsAPI matches by date -> [{home,away,id,xg_available}]
  const tsaByDate = {};
  const cacheFile = path.join(HERE,"the-stats-cache.json");
  let persistentCache = { teams:{} };
  try { persistentCache = JSON.parse(fs.readFileSync(cacheFile,"utf8")); } catch (_) {}
  if(!persistentCache||typeof persistentCache!=="object") persistentCache={teams:{}};
  if(!persistentCache.teams||typeof persistentCache.teams!=="object") persistentCache.teams={};
  const teamFormCache = {};      // rolling xG form per TSA team id (cached per run)
  const XG_LOOKBACK = 10;        // recent finished matches to average for form
  const TEAM_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
  let calls = 0, enriched = 0, matchedGames = 0, multiBookMatches = 0;
  for(const date of dateList){
    try{
      // page through matches for the date
      let page=1, more=true;
      while(more && page<=5){
        const res = await api(`/football/matches?date_from=${date}&date_to=${date}&per_page=100&page=${page}`, cfg.STATS_API_KEY);
        calls++;
        const arr = (res && res.data) || [];
        tsaByDate[date] = (tsaByDate[date]||[]).concat(arr);
        const tp = res && res.meta && res.meta.total_pages || 1;
        more = page < tp; page++;
        await sleep(300);
      }
    }catch(e){
      console.log(`TSA match list failed for ${date}: ${e.message}`);
      if(/UNAUTHORIZED/.test(e.message)){ console.log("Auth failed — aborting enrichment, site unaffected."); process.exit(0); }
    }
  }

  // for each of OUR matches, find the TSA equivalent + pull its premium data
  for(const m of scopedMatches){
    const candidates = tsaByDate[m.matchDate] || [];
    const tsa = candidates.find(c =>
      c.home_team && c.away_team &&
      sameTeam(c.home_team.name, m.home) && sameTeam(c.away_team.name, m.away)
    );
    if(!tsa) continue;
    matchedGames++;

    // Multi-book line movement. Capture 1X2 plus totals, BTTS, DNB,
    // double-chance, first-half and HT/FT markets when the provider returns them.
    // Leonidas and Spartacus abstain if timestamped opening/current pairs are absent.
    try{
      if(tsa.odds_available){
        const o=await api(`/football/matches/${tsa.id}/odds`,cfg.STATS_API_KEY);calls++;
        const books=(o&&o.data&&o.data.bookmakers)||[];
        const fetchedAt=new Date().toISOString(),snapshots=[];
        for(const bm of books){
          const extracted=extractBookMarkets(bm);if(!extracted.pairCount)continue;
          const vendorTs=bm.updated_at||bm.last_updated||bm.timestamp||(o.data&&o.data.updated_at)||null;
          snapshots.push({bookmaker:bm.bookmaker||bm.name||bm.slug||`Book ${snapshots.length+1}`,timestamp:vendorTs||fetchedAt,timestampSource:vendorTs?"vendor":"retrieved",opening:extracted.open,current:extracted.current,marketPairs:extracted.pairCount});
        }
        if(snapshots.length){
          const pref=["Pinnacle","Betfair Exchange","Bet365","Kambi"];
          snapshots.sort((a,b)=>{const ai=pref.indexOf(a.bookmaker),bi=pref.indexOf(b.bookmaker);return(ai<0?99:ai)-(bi<0?99:bi)});
          m.oddsBooks=snapshots;m.oddsUpdatedAt=fetchedAt;
          const primary=snapshots.find(x=>[x.opening.home,x.opening.draw,x.opening.away,x.current.home,x.current.draw,x.current.away].every(Number.isFinite))||snapshots[0];
          m.oddsOpen={...primary.opening};m.oddsLast={...primary.current};
          m.odds={...(m.odds||{})};for(const [key,value] of Object.entries(primary.current)){if(!(Number(m.odds[key])>1)&&Number(value)>1)m.odds[key]=value;}
          const allKeys=new Set(snapshots.flatMap(x=>Object.keys(x.opening||{})));
          m.rebelOddsCoverage={bookmakers:snapshots.length,markets:[...allKeys].sort(),fullMarketBooks:snapshots.filter(x=>x.marketPairs>=6).length};
          if(snapshots.length>=4)multiBookMatches++;
        }
        await sleep(250);
      }
    }catch(e){ /* leave odds as-is */ }

    // xG / np_xG (only meaningful for finished games; pre-match it's absent)
    try{
      if(tsa.xg_available){
        const s = await api(`/football/matches/${tsa.id}/stats`, cfg.STATS_API_KEY); calls++;
        const ov = s && s.data && s.data.overview;
        const xg = ov && ov.expected_goals && ov.expected_goals.all;
        const np = s && s.data && s.data.np_expected_goals && s.data.np_expected_goals.all;
        if(xg && (xg.home!=null || xg.away!=null)){
          m.xgHomeReal = xg.home; m.xgAwayReal = xg.away; m.xgReal = true;
        }
        if(np && (np.home!=null || np.away!=null)){
          m.npxgHomeReal = np.home; m.npxgAwayReal = np.away;
        }
        if(m.xgReal) enriched++;
        await sleep(250);
      }
    }catch(e){ /* leave xG absent */ }

    // ROLLING TEAM xG FORM (for UPCOMING matches). The per-match xG above is
    // null before kickoff, but the engines need each team's recent xG form to
    // sharpen pre-match. So when this match has no xG yet, pull each team's last
    // finished matches from TheStatsAPI and average their xG-for/against, then
    // stamp that as the team's expected-goals level. Cached per team per run.
    if(!m.xgReal){
      const teamXgForm = async (tsaTeamId, teamName)=>{
        if(tsaTeamId==null) return null;
        if(teamFormCache[tsaTeamId]!==undefined) return teamFormCache[tsaTeamId];
        const persisted=persistentCache.teams[String(tsaTeamId)];
        if(persisted&&persisted.savedAt&&Date.now()-Date.parse(persisted.savedAt)<TEAM_CACHE_TTL_MS){
          teamFormCache[tsaTeamId]=persisted.form||null;
          return teamFormCache[tsaTeamId];
        }
        let form=null;
        try{
          const r=await api(`/football/matches?team_id=${tsaTeamId}&status=finished&per_page=${XG_LOOKBACK}`, cfg.STATS_API_KEY); calls++;
          const list=(r&&r.data)||[]; const fors=[], againsts=[];
          for(const g of list.slice(0, XG_LOOKBACK)){
            const mid=g.match_id||g.id; if(!mid) continue;
            // xG may be on the row, else fetch stats
            let hx=(g.home&&g.home.xg), ax=(g.away&&g.away.xg);
            if(hx==null||ax==null){
              try{ const s=await api(`/football/matches/${mid}/stats`, cfg.STATS_API_KEY); calls++;
                const eg=s&&s.data&&s.data.overview&&s.data.overview.expected_goals&&s.data.overview.expected_goals.all;
                if(eg){ hx=eg.home; ax=eg.away; } await sleep(200);
              }catch(_){}
            }
            if(hx==null||ax==null) continue;
            const homeIsTeam = g.home && (g.home.id===tsaTeamId || g.home.team_id===tsaTeamId);
            fors.push(homeIsTeam?+hx:+ax); againsts.push(homeIsTeam?+ax:+hx);
          }
          if(fors.length){
            const avg=a=>Math.round((a.reduce((s,x)=>s+x,0)/a.length)*100)/100;
            form={ xgFor:avg(fors), xgAgainst:avg(againsts), samples:fors.length };
          }
          await sleep(200);
        }catch(e){ /* leave form null */ }
        teamFormCache[tsaTeamId]=form;
        persistentCache.teams[String(tsaTeamId)]={savedAt:new Date().toISOString(),teamName:teamName||null,form};
        return form;
      };
      try{
        const hForm = await teamXgForm(tsa.home_team&&tsa.home_team.id, m.home);
        const aForm = await teamXgForm(tsa.away_team&&tsa.away_team.id, m.away);
        if(hForm){ m.xgHomeReal=hForm.xgFor; m.homeXgAgainst=hForm.xgAgainst; m.xgReal=true; }
        if(aForm){ m.xgAwayReal=aForm.xgFor; m.awayXgAgainst=aForm.xgAgainst; m.xgReal=true; }
        if(m.xgReal) enriched++;
      }catch(e){ /* form optional */ }
    }

    // Confirmed lineups are useful only close to kickoff. Avoid wasting a call
    // hours earlier when providers cannot have an official XI yet.
    const kickoffMs = Date.parse(m.kickoff || "");
    const minsToKickoff = Number.isFinite(kickoffMs) ? (kickoffMs - Date.now()) / 60000 : 9999;
    if (minsToKickoff >= -30 && minsToKickoff <= 150) {
      try{
        const lu = await api(`/football/matches/${tsa.id}/lineups`, cfg.STATS_API_KEY); calls++;
        if(lu && lu.data && lu.data.confirmed){ m.lineupConfirmed = true; }
        await sleep(250);
      }catch(e){ /* no lineup yet — fine */ }
    }
  }

  // write back: preserve DATA_UPDATED, add ENRICHED_AT marker
  const out =
    `window.DATA_UPDATED = ${JSON.stringify(updated)};\n` +
    `window.ENRICHED_AT = "${new Date().toISOString()}";\n` +
    `window.MATCHES = ${JSON.stringify(matches, null, 2)};\n`;
  fs.writeFileSync(path.join(HERE,"data.js"), out, "utf8");
  try {
    persistentCache.updatedAt=new Date().toISOString();
    fs.writeFileSync(cacheFile,JSON.stringify(persistentCache,null,2)+"\n","utf8");
  } catch (_) {}
  console.log(`Enrichment done: ${matchedGames} games matched, ${enriched} got real xG, ${multiBookMatches} got 4+ timestamped books, in ${calls} calls.`);
})();
