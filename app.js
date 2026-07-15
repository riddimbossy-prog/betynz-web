(function(){
  "use strict";

  const ENGINES=[
    {id:"zeus",name:"Zeus",fn:"zeusRecommend",glyph:"⚡",role:"Supreme Decision Engine",summary:"Runs the strictest multi-generation consensus and rejects uncertainty before allowing a final market.",tags:["Consensus","Bankers","All markets"],checks:["Compares seven generations of the PPG model.","Requires independent agreement and a safe common market.","Downgrades or rejects selections when the engines split."],gate:"Highest authority. A match can still finish as No Bet."},
    {id:"athena",name:"Athena",fn:"athenaRecommend",glyph:"♙",role:"Control & Discipline",summary:"Measures team superiority with tighter samples, venue form and draw-risk controls.",tags:["PPG","Control","Low risk"],checks:["Compares overall and venue PPG.","Checks sample size and recent-form agreement.","Routes uncertain favorites toward DNB or double chance."],gate:"Prefers safety over volume."},
    {id:"apollo",name:"Apollo",fn:"apolloRecommend",glyph:"☀",role:"League Signal Matrix",summary:"Reads league-wide market tendencies and confirms them against the two teams in the fixture.",tags:["League DNA","Trends","Goals"],checks:["Finds the strongest recurring league markets.","Requires a meaningful historical sample.","Rejects a league tendency when current team data disagrees."],gate:"A league trend proposes; team data must confirm."},
    {id:"ares",name:"Ares",fn:"aresRecommend",glyph:"⚔",role:"Mismatch Hunter",summary:"Looks for clear strength gaps across PPG, goal difference, xG, shots and recent form.",tags:["Favorites","Win/DNB","Strength gap"],checks:["Scores multiple independent mismatch dimensions.","Requires the direction to agree across the strongest signals.","Blocks aggressive wins when defensive or draw risk is high."],gate:"Aggressive only when the mismatch is real."},
    {id:"poseidon",name:"Poseidon",fn:"poseidonRecommend",glyph:"♆",role:"League Environment",summary:"Specializes in competitions with strong scoring, home-bias or defensive identities.",tags:["League bias","Volatility","Goals"],checks:["Classifies the exact competition.","Finds markets that repeatedly clear the league threshold.","Checks whether both teams fit the league identity."],gate:"Never applies one league’s behavior to another."},
    {id:"hermes",name:"Hermes",fn:"hermesRecommend",glyph:"☿",role:"Market Movement",summary:"Reads bookmaker movement, dispersion and cross-market agreement as supporting evidence.",tags:["Odds","Movement","Fast signal"],checks:["De-vigs opening and current 1X2 prices.","Measures how many independent books move together.","Vetoes statistical picks when the market sharply contradicts them."],gate:"Market data supports a pick; it never creates one alone."},
    {id:"hera",name:"Hera",fn:"heraRecommend",glyph:"♕",role:"Consistency Guardian",summary:"Uses calibrated probability, league reliability and stable venue strength to find resilient selections.",tags:["Calibration","Stability","Risk control"],checks:["Normalizes team strength to league conditions.","Penalizes unreliable competition samples.","Keeps only selections with a strong conservative edge."],gate:"Stable evidence must survive every context check."},
    {id:"artemis",name:"Artemis",fn:"artemisRecommend",glyph:"☾",role:"Half-Market Precision",summary:"Analyzes first-half and second-half scoring patterns using direct split data.",tags:["1st half","2nd half","Precision"],checks:["Requires real half-specific samples.","Compares scoring and conceding by half.","Publishes only when both teams support the same half market."],gate:"No estimated half data is treated as confirmed."},
    {id:"hephaestus",name:"Hephaestus",fn:"hephaestusRecommend",glyph:"⚒",role:"Deep Statistical Forge",summary:"Builds selections from opponent strength, rest, schedule density, similar opponents and split stability.",tags:["Deep data","Context","Expert"],checks:["Adjusts recent form for opponent difficulty.","Checks rest and fixture congestion.","Tests whether performance is stable across match blocks."],gate:"Missing advanced context produces abstention, not invention."},
    {id:"demeter",name:"Demeter",fn:"demeterRecommend",glyph:"❦",role:"Form Cycle Engine",summary:"Detects improvement, decline, acceleration and reversals across recent match blocks.",tags:["Momentum","Form","Reversal"],checks:["Compares recent performance with the season baseline.","Measures how many momentum components agree.","Rejects short-term hot streaks without base strength."],gate:"Momentum must be supported by the underlying team level."},
    {id:"dionysus",name:"Dionysus",fn:"dionysusRecommend",glyph:"♢",role:"Streak & Recurrence",summary:"Finds active scoring, unbeaten and market streaks while protecting against overdue reversals.",tags:["Streaks","BTTS","Goal runs"],checks:["Measures the current sequence length.","Checks recurrence across the season.","Looks for opponent counter-streaks and reversal pressure."],gate:"A streak alone is never enough."},
    {id:"hades",name:"Hades",fn:"hadesRecommend",glyph:"♜",role:"Hidden Value & Traps",summary:"Looks beneath the quoted price for calibrated value while exposing favorite traps and inflated odds.",tags:["Value","Traps","Calibration"],checks:["Requires a large calibrated sample.","Uses the conservative probability bound, not the headline score.","Rejects wide uncertainty intervals and negative expected value."],gate:"No calibration means No Bet."},
    {id:"atlas",name:"Atlas",fn:"atlasRecommend",glyph:"◉",role:"Heavy Data Strength",summary:"Carries recent-ten, venue and league-normalized strength into one conservative team assessment.",tags:["Recent 10","Venue","Strength"],checks:["Combines venue and overall performance.","Uses recent-ten data when the sample is valid.","Penalizes volatile result patterns."],gate:"A heavy score still needs a supported market."},
    {id:"orion",name:"Orion",fn:"orionRecommend",glyph:"✦",role:"Advanced Edge Tracker",summary:"Tracks uncertainty intervals and only fires when the conservative edge remains positive.",tags:["Intervals","xG/SOT","Apex"],checks:["Builds a conservative range around team strength.","Checks whether the lower edge still supports the market.","Rejects compressed same-tier fixtures."],gate:"The lower bound—not the optimistic estimate—must pass."},
    {id:"nike",name:"Nike",fn:"nikeRecommend",glyph:"✧",role:"Banker Victory Engine",summary:"Targets high-quality result markets using Bayesian strength, form and volatility controls.",tags:["Bankers","Wins","Bayesian"],checks:["Blends venue, overall and recent strength.","Adjusts for opposition and competition volatility.","Downgrades favorites that cannot convert control into goals."],gate:"Victory picks require attacking proof."},
    {id:"prometheus",name:"Prometheus",fn:"prometheusRecommend",glyph:"♨",role:"Foundation Model",summary:"The original PPG foundation that supplies a clear baseline for every stronger generation.",tags:["Baseline","PPG","Foundation"],checks:["Calculates venue and overall PPG.","Uses recent form as confirmation.","Routes the safest supported result or goal market."],gate:"A baseline signal is evidence, not the final decision."},
    {id:"spartacus",name:"Spartacus",fn:"spartacusRecommend",glyph:"⛓",family:"rebel",role:"Rebel Movement Scanner",summary:"A broader multi-book odds-movement engine that accepts valid market direction and downgrades weak aggressive signals.",tags:["Opening odds","Movement","Downgrades"],checks:["Requires at least three timestamped bookmakers.","Measures bookmaker agreement and related-market confirmation.","Uses strict goal-line and favourite downgrade ladders."],gate:"Spartacus never estimates missing opening prices and cannot publish a Zeus selection by itself."},
    {id:"leonidas",name:"Leonidas",fn:"leonidasRecommend",glyph:"Λ",family:"rebel",role:"Elite Rebel Confirmation",summary:"The stricter rebel engine, demanding deeper movement, more bookmakers and stronger cross-market confirmation.",tags:["5+ books","70% agreement","Elite movement"],checks:["Requires at least five timestamped bookmakers.","Needs at least two related-market confirmations.","Rejects weak, reversed or contradictory movement."],gate:"Leonidas may confirm or challenge the Olympians, but at least one Olympian must agree before Zeus can publish."}
  ];
  const ENGINE_MAP=Object.fromEntries(ENGINES.map(e=>[e.id,e]));
  const ENGINE_ART={zeus:"assets/gods/zeus.webp",athena:"assets/gods/athena.webp",apollo:"assets/gods/apollo.webp",ares:"assets/gods/ares.webp",poseidon:"assets/gods/poseidon.webp",hermes:"assets/gods/hermes.webp",hera:"assets/gods/hera.webp",artemis:"assets/gods/artemis.webp",hephaestus:"assets/gods/hephaestus.webp",atlas:"assets/gods/atlas.webp",demeter:"assets/gods/demeter.webp",dionysus:"assets/gods/dionysus.webp",hades:"assets/gods/hades.webp",orion:"assets/gods/orion.webp",nike:"assets/gods/nike.webp",prometheus:"assets/gods/prometheus.webp",spartacus:"assets/gods/spartacus.webp",leonidas:"assets/gods/leonidas.webp"};
  const matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
  const meta=window.BETYNZ_META&&typeof window.BETYNZ_META==="object"?window.BETYNZ_META:{};
  const history=Array.isArray(window.BETYNZ_HISTORY)?window.BETYNZ_HISTORY:[];
  const isDemo=!!window.BETYNZ_DEMO||!!meta.isDemo;
  const isPending=window.BETYNZ_READY===false||String(meta.source||"").toLowerCase()==="waiting-for-live-sync";
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc=v=>String(v==null?"":v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const todayISO=new Date().toISOString().slice(0,10);
  const FINISHED=new Set(["FT","AET","PEN","AWD","WO"]);
  const LIVE=new Set(["1H","HT","2H","ET","BT","P","LIVE"]);
  const cache=new Map();
  const pickCache=new Map();
  const enginePickCache=new Map();
  let activeView=(location.hash||"#dashboard").slice(1);
  let activeDate=null;
  let activeDashboardEngine="all";
  let picksFilter={engine:"all",market:"all",league:"all",grade:"all"};
  let bankerFilter={status:"all",grade:"all",league:"all",odds:"all"};
  let searchTerm="";
  let toastTimer=null;
  let slip=loadJSON("betynz-slip",[]);
  let preferences=loadJSON("betynz-preferences",{favoriteEngine:"zeus",confidence:76,rememberSlip:true});

  function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v==null?fallback:v}catch(_){return fallback}}
  function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function keyOf(m){return String(m.id!=null?m.id:`${m.home}|${m.away}|${m.matchDate}`)}
  function dateOf(m){return m.matchDate||(m.kickoff?String(m.kickoff).slice(0,10):"Undated")}
  function kickoff(m){try{return new Date(m.kickoff).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch(_){return "—"}}
  function countryFlag(m){const c=String(m.country||m.league||"").toLowerCase();if(c.includes("england"))return"🏴";if(c.includes("spain"))return"🇪🇸";if(c.includes("germany"))return"🇩🇪";if(c.includes("italy"))return"🇮🇹";if(c.includes("france"))return"🇫🇷";if(c.includes("portugal"))return"🇵🇹";if(c.includes("usa")||c.includes("mls"))return"🇺🇸";if(c.includes("brazil"))return"🇧🇷";if(c.includes("argentina"))return"🇦🇷";return"⚽"}
  function initials(name){return String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"?"}
  function leagueBadge(m){const fallback=countryFlag(m);if(m&&m.flag){return `<span class="league-badge"><img src="${esc(m.flag)}" alt="${esc(m.country||m.league||'League')} flag" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"/><span class="league-fallback" style="display:none">${fallback}</span></span>`}return `<span class="league-badge no-image"><span class="league-fallback">${fallback}</span></span>`}
  function teamCrest(url,name){const fallback=initials(name);if(url){return `<span class="team-crest"><img src="${esc(url)}" alt="${esc(name)} crest" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"/><span class="crest-fallback" style="display:none">${fallback}</span></span>`}return `<span class="team-crest no-image"><span class="crest-fallback">${fallback}</span></span>`}
  function marketClean(s){return String(s||"No Bet").replace(/^Over ([0-9.]+) Goals$/,"Over $1").replace(/^Under ([0-9.]+) Goals$/,"Under $1")}
  function normalizeMarket(s){const x=String(s||"").trim();if(/^Over \d/.test(x)&&!/Goals/.test(x))return `${x} Goals`;if(/^Under \d/.test(x)&&!/Goals/.test(x))return `${x} Goals`;return x}
  function marketFamily(s){s=String(s||"").toLowerCase();if(s.includes("btts"))return"BTTS";if(s.includes("over")||s.includes("under"))return s.includes("team")?"Team Goals":"Totals";if(s.includes("dnb")||s.includes("double chance")||s.includes("win"))return"Result";if(s.includes("half"))return"Halves";return"Other"}
  function opposite(a,b){a=String(a);b=String(b);return (a.includes("Over 2.5")&&b.includes("Under 2.5"))||(a.includes("Under 2.5")&&b.includes("Over 2.5"))||(a==="BTTS Yes"&&b==="BTTS No")||(a==="BTTS No"&&b==="BTTS Yes")||(a.includes("Home Win")&&b.includes("Away"))||(a.includes("Away Win")&&b.includes("Home"))}
  const ODDS_KEYS={"Home Win":"home","Draw":"draw","Away Win":"away","Home DNB":"homeDnb","Away DNB":"awayDnb","Double Chance 1X":"dc1x","Double Chance X2":"dcx2","Double Chance 12":"dc12","Over 1.5 Goals":"over15","Over 2.5 Goals":"over25","Over 3.5 Goals":"over35","Under 1.5 Goals":"under15","Under 2.5 Goals":"under25","Under 3.5 Goals":"under35","BTTS Yes":"bttsYes","BTTS No":"bttsNo","Home Team Over 0.5 Goals":"homeOver05","Away Team Over 0.5 Goals":"awayOver05","Home Team Over 1.5 Goals":"homeOver15","Away Team Over 1.5 Goals":"awayOver15","First Half Over 0.5":"fhOver05","First Half Under 1.5":"fhUnder15"};
  function priceOf(m,market){const key=ODDS_KEYS[normalizeMarket(market)];const v=key&&m.odds?Number(m.odds[key]):NaN;return Number.isFinite(v)&&v>1?v:null}

  function runEngine(m,engine){
    const ck=`${keyOf(m)}|${engine.id}`;if(cache.has(ck))return cache.get(ck);
    let out=null;
    if(Array.isArray(m.olympianPredictions)){
      const d=m.olympianPredictions.find(x=>x.engine===engine.id);
      out=d&&d.bet?{bet:true,primary:normalizeMarket(d.market),confidence:Number(d.confidence),reasons:d.reasons||[],warnings:d.warnings||[],dataQuality:d.dataQuality,supportOnly:!!d.supportOnly}:null;
    }else if(isDemo&&Array.isArray(m.demoPredictions)){
      const d=m.demoPredictions.find(x=>x.engine===engine.id);
      out=d?{bet:true,primary:normalizeMarket(d.market),confidence:Number(d.confidence),reasons:d.reasons||["Demonstration engine agreement."],warnings:d.warnings||[]}:null;
    }else{
      const fn=window[engine.fn];
      if(typeof fn==="function"){try{out=fn(m)}catch(err){out=null}}
    }
    if(!out||!out.bet||!out.primary||/no bet/i.test(out.primary))out=null;
    else out={...out,primary:normalizeMarket(out.primary),confidence:Math.round(Number(out.confidence||out.score||0)),engineId:engine.id,engineName:engine.name};
    cache.set(ck,out);return out;
  }

  function finalPick(m){
    const mk=keyOf(m);if(pickCache.has(mk))return pickCache.get(mk);
    if(m.zeusDecision&&m.zeusDecision.market){
      const z=ENGINE_MAP.zeus,ids=Array.isArray(m.zeusDecision.engineIds)?m.zeusDecision.engineIds:[];
      const engs=[z,...ids.map(id=>ENGINE_MAP[id]).filter(Boolean)];
      const p={m,market:normalizeMarket(m.zeusDecision.market),confidence:Math.round(Number(m.zeusDecision.confidence||0)),grade:m.zeusDecision.grade||"WATCH",engine:z,engines:engs,votes:ids.length,odds:Number(m.zeusDecision.odds)||priceOf(m,m.zeusDecision.market),conflict:false,reasons:m.zeusDecision.reasons||[],warnings:m.zeusDecision.warnings||[],locked:!!m.zeusDecision.locked,provisional:!!m.zeusDecision.provisional,dataQuality:m.zeusDecision.dataQuality??null};
      pickCache.set(mk,p);return p;
    }
    const votes=[];
    ENGINES.forEach(e=>{const o=runEngine(m,e);if(o)votes.push({engine:e,out:o,market:o.primary,confidence:o.confidence||0})});
    if(!votes.length){pickCache.set(mk,null);return null}
    const groups={};
    votes.forEach(v=>{const k=v.market;const g=groups[k]||(groups[k]={market:k,votes:[],confidence:0});g.votes.push(v)});
    Object.values(groups).forEach(g=>{
      const avg=g.votes.reduce((s,v)=>s+v.confidence,0)/g.votes.length;
      const authority=g.votes.reduce((s,v)=>s+(v.engine.id==="zeus"?4:v.engine.id==="athena"||v.engine.id==="atlas"?2:1),0);
      g.confidence=Math.min(96,Math.round(avg+Math.min(8,g.votes.length*1.4)+Math.min(4,authority*.3)));
      g.authority=authority;
    });
    const ranked=Object.values(groups).sort((a,b)=>b.votes.length-a.votes.length||b.authority-a.authority||b.confidence-a.confidence);
    const best=ranked[0],second=ranked[1];
    const hardConflict=ranked.some(g=>g!==best&&g.votes.length>=2&&opposite(best.market,g.market));
    const lead=second?best.votes.length-second.votes.length:best.votes.length;
    const olympianVotes=best.votes.filter(v=>v.engine.family!=="rebel");
    if(!olympianVotes.length){pickCache.set(mk,null);return null}
    let grade="WATCH";
    if(!hardConflict&&best.confidence>=88&&best.votes.length>=3&&olympianVotes.length>=2&&(lead>=1||best.votes.some(v=>v.engine.id==="zeus")))grade="A1";
    else if(!hardConflict&&best.confidence>=82&&best.votes.length>=2&&olympianVotes.length>=1)grade="A2";
    else if(best.confidence<76||hardConflict){pickCache.set(mk,null);return null}
    const topVote=best.votes.sort((a,b)=>b.confidence-a.confidence)[0];
    const pick={m,market:best.market,confidence:best.confidence,grade,engine:topVote.engine,engines:best.votes.map(v=>v.engine),votes:best.votes.length,odds:priceOf(m,best.market),conflict:hardConflict,reasons:topVote.out.reasons||[]};
    pickCache.set(mk,pick);return pick;
  }

  function allPicks(){return matches.map(finalPick).filter(Boolean).sort((a,b)=>gradeRank(b.grade)-gradeRank(a.grade)||b.confidence-a.confidence||String(a.m.kickoff||"").localeCompare(String(b.m.kickoff||"")))}
  function rebelCoverage(id){
    const threshold=id==="leonidas"?5:3;
    const rows=matches.map(m=>m&&m.rebelOddsCoverage||{});
    const ready=rows.filter(x=>Number(x.eligibleBookmakers??x.bookmakers??0)>=threshold).length;
    const moving=rows.filter(x=>Number(x.movingBookmakers||0)>=threshold).length;
    const collecting=rows.filter(x=>String(x.status||"")==="collecting").length;
    return{threshold,ready,moving,collecting};
  }

  function enginePicks(id){
    if(id==="zeus")return allPicks();
    if(enginePickCache.has(id))return enginePickCache.get(id);
    const engine=ENGINE_MAP[id];if(!engine)return[];
    const rows=matches.map(m=>{const out=runEngine(m,engine);if(!out)return null;const confidence=Math.round(Number(out.confidence||0));return{m,market:out.primary,confidence,grade:confidence>=88?"A1":confidence>=82?"A2":"WATCH",engine,engines:[engine],votes:1,odds:priceOf(m,out.primary),conflict:false,reasons:out.reasons||[],warnings:out.warnings||[],locked:false,provisional:true,dataQuality:out.dataQuality??null,engineOnly:true,rebel:engine.family==="rebel"}}).filter(Boolean).sort((a,b)=>b.confidence-a.confidence||String(a.m.kickoff||"").localeCompare(String(b.m.kickoff||"")));
    enginePickCache.set(id,rows);return rows;
  }
  function gradeRank(g){return g==="A1"?3:g==="A2"?2:g==="WATCH"?1:0}
  function matchesForDate(date){return matches.filter(m=>dateOf(m)===date)}
  function dates(){return [...new Set(matches.map(dateOf).filter(d=>d&&d!=="Undated"))].sort()}
  function friendlyDate(d){if(!d)return"All dates";const x=new Date(`${d}T12:00:00`);const delta=Math.round((x-new Date(`${todayISO}T12:00:00`))/86400000);const prefix=delta===0?"Today":delta===1?"Tomorrow":delta===-1?"Yesterday":x.toLocaleDateString([],{weekday:"short"});return `${prefix} · ${x.toLocaleDateString([],{month:"short",day:"numeric"})}`}
  function isUpcoming(m){return !FINISHED.has(String(m.status||"").toUpperCase())}
  function isLive(m){return LIVE.has(String(m.status||"").toUpperCase())}

  function settlePick(p){
    const m=p.m;if(m.homeGoals==null||m.awayGoals==null||!FINISHED.has(String(m.status||"").toUpperCase()))return"Pending";
    if(typeof window.settle==="function"){try{return window.settle(p.market,m.homeGoals,m.awayGoals,m.status,m)||"Pending"}catch(_){}}
    const h=Number(m.homeGoals),a=Number(m.awayGoals),t=h+a,mk=normalizeMarket(p.market);
    if(mk==="Home Win")return h>a?"Won":"Lost";if(mk==="Away Win")return a>h?"Won":"Lost";if(mk==="Home DNB")return h===a?"Void":h>a?"Won":"Lost";if(mk==="Away DNB")return h===a?"Void":a>h?"Won":"Lost";if(mk==="Double Chance 1X")return h>=a?"Won":"Lost";if(mk==="Double Chance X2")return a>=h?"Won":"Lost";if(mk==="Double Chance 12")return h!==a?"Won":"Lost";if(mk.includes("Over 1.5")&&!mk.includes("Team"))return t>=2?"Won":"Lost";if(mk.includes("Over 2.5"))return t>=3?"Won":"Lost";if(mk.includes("Over 3.5"))return t>=4?"Won":"Lost";if(mk.includes("Under 2.5"))return t<=2?"Won":"Lost";if(mk.includes("Under 3.5"))return t<=3?"Won":"Lost";if(mk==="BTTS Yes")return h>0&&a>0?"Won":"Lost";if(mk==="BTTS No")return !(h>0&&a>0)?"Won":"Lost";if(mk.includes("Home Team Over 0.5"))return h>=1?"Won":"Lost";if(mk.includes("Away Team Over 0.5"))return a>=1?"Won":"Lost";if(mk.includes("Home Team Over 1.5"))return h>=2?"Won":"Lost";if(mk.includes("Away Team Over 1.5"))return a>=2?"Won":"Lost";return"Pending";
  }

  function renderMetrics(){
    const picks=allPicks(),up=picks.filter(p=>isUpcoming(p.m));
    const settled=history.filter(x=>x&&["Won","Lost","Void"].includes(x.result));
    const wins=settled.filter(x=>x.result==="Won").length,losses=settled.filter(x=>x.result==="Lost").length;
    const hit=wins+losses?Math.round(wins/(wins+losses)*100):0;const priced=up.filter(p=>p.odds);const avg=priced.length?(priced.reduce((s,p)=>s+p.odds,0)/priced.length).toFixed(2):"—";
    const active=ENGINES.filter(e=>matches.some(m=>runEngine(m,e))).length;
    $("#metric-grid").innerHTML=[
      ["♜",active,"Active Engines",isDemo?"Demo snapshot":isPending?"Waiting for verified data":"Qualified systems"],
      ["▦",matches.filter(isUpcoming).length,"Upcoming Matches",`${dates().length} board days`],
      ["◎",settled.length?`${hit}%`:"—","Verified Record",settled.length?`${settled.length} locked results`:"Waiting for locked results"],
      ["◆",avg,"Average Pick Odds",priced.length?"Current qualified prices":"Odds pending"]
    ].map(x=>`<article class="metric-card"><span class="metric-icon">${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small><em>${esc(x[3])}</em></div></article>`).join("");
    $("#trend-rate").textContent=settled.length?`${hit}%`:"—";$("#streak-value").innerHTML=`${winningStreakHistory()} <em>Days</em>`;
  }
  function winningStreakHistory(){const by={};history.forEach(x=>{const d=String(x.kickoff||"").slice(0,10);if(d)(by[d]=by[d]||[]).push(x.result)});let n=0;for(const d of Object.keys(by).sort().reverse()){if(by[d].some(x=>x==="Won"))n++;else break}return n}
  function winningStreak(picks){const by={};picks.forEach(p=>{const r=settlePick(p);if(r!=="Pending")(by[dateOf(p.m)]=by[dateOf(p.m)]||[]).push(r)});let n=0;Object.keys(by).sort().reverse().some(d=>{if(by[d].some(x=>x==="Won")){n++;return false}return true});return n}

  function renderEngineTabs(){
    const featured=["zeus","athena","apollo","ares","hermes","spartacus","leonidas"].map(id=>ENGINE_MAP[id]).filter(Boolean);
    const tabs=[{id:"all",name:"All Engines",glyph:"◎"},...featured];
    $("#engine-tabs").innerHTML=tabs.map(e=>`<button class="engine-tab ${activeDashboardEngine===e.id?"active":""}" data-engine-tab="${e.id}">${e.glyph||""} ${esc(e.name)}</button>`).join("");
    $$("[data-engine-tab]").forEach(b=>b.onclick=()=>{activeDashboardEngine=b.dataset.engineTab;renderDashboardList();renderEngineTabs()});
  }

  function filteredDashboardPicks(){
    let rows=allPicks().filter(p=>dateOf(p.m)===activeDate&&isUpcoming(p.m));
    const mf=$("#dashboard-market")?.value||"all",of=$("#dashboard-odds")?.value||"all";
    if(activeDashboardEngine!=="all")rows=rows.filter(p=>p.engines.some(e=>e.id===activeDashboardEngine));
    if(mf!=="all")rows=rows.filter(p=>marketFamily(p.market)===mf);
    if(of!=="all")rows=rows.filter(p=>oddsIn(p.odds,of));
    if(searchTerm)rows=rows.filter(p=>`${p.m.home} ${p.m.away} ${p.m.league}`.toLowerCase().includes(searchTerm));
    return rows;
  }
  function oddsIn(v,range){if(range==="all")return true;if(!v)return false;const [a,b]=range.split("-").map(Number);return v>=a&&v<=b}
  function renderDashboardList(){const rows=filteredDashboardPicks().slice(0,7);$("#dashboard-list").innerHTML=rows.length?rows.map(matchRow).join(""):empty("No qualified picks for these filters.")}
  function matchRow(p){
    const m=p.m,added=slip.some(x=>x.key===slipKey(p));const eng=p.engines.slice(0,2).map(e=>e.name).join(" + ");const gradeLabel=p.engineOnly?"SIGNAL":p.grade;const stateLabel=p.engineOnly?(p.rebel?"REBEL":"ENGINE"):(p.locked?"LOCKED":"PROVISIONAL");
    return `<article class="match-row" data-pick-key="${esc(keyOf(m))}">
      <div class="fixture-cell">
        <span class="league-flag">${leagueBadge(m)}</span>
        <div class="fixture-teams">
          <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.homeLogo,m.home)}</span><b>${esc(m.home)}</b></div>
          <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.awayLogo,m.away)}</span><b>${esc(m.away)}</b></div>
          <small>${esc(m.league||"Football")} · ${kickoff(m)}${isLive(m)?" · LIVE":""}</small>
        </div>
      </div>
      <div class="market-cell"><button class="pick-detail-link" data-pick-detail="${esc(keyOf(m))}">${esc(marketClean(p.market))}</button><small>${esc(marketFamily(p.market))} · <span class="grade ${p.engineOnly?"WATCH":p.grade}">${gradeLabel}</span> · <span class="lock-state ${p.engineOnly?"provisional":p.locked?"locked":"provisional"}">${stateLabel}</span></small></div>
      <div class="engine-cell"><span class="engine-glyph">${p.engine.glyph}</span>${esc(eng)}</div>
      <div class="confidence"><span class="confidence-ring" style="--v:${p.confidence}"><span>${p.confidence}%</span></span></div>
      <div class="odds-cell">${p.odds?p.odds.toFixed(2):"—"}</div>
      <div class="mobile-match-footer" aria-hidden="true">
        <span class="mobile-engine"><span class="engine-glyph">${p.engine.glyph}</span>${esc(eng)}</span>
        <span class="mobile-confidence">${p.confidence}%</span>
        <span class="mobile-odds">${p.odds?p.odds.toFixed(2):"No odds"}</span>
      </div>
      <button class="add-btn ${added?"added":""}" data-add-pick="${esc(slipKey(p))}" aria-label="${added?"Remove from":"Add to"} slip">${added?"✓":"+"}</button>
    </article>`;
  }
  function empty(text){return `<div class="empty-state"><b>Nothing forced</b>${esc(text)}</div>`}

  function renderDashboardSelectors(){
    const ds=dates();if(!activeDate)activeDate=ds.includes(todayISO)?todayISO:(ds.find(d=>d>=todayISO)||ds[0]||todayISO);
    $("#dashboard-date").innerHTML=ds.map(d=>`<option value="${d}" ${d===activeDate?"selected":""}>${friendlyDate(d)}</option>`).join("");
    const families=[...new Set(allPicks().map(p=>marketFamily(p.market)))].sort();$("#dashboard-market").innerHTML=`<option value="all">All Markets</option>${families.map(x=>`<option>${esc(x)}</option>`).join("")}`;
  }

  function renderRecentResults(){
    const rows=history.slice(0,5);
    $("#recent-results").innerHTML=rows.length?rows.map(x=>`<div class="recent-result"><span>${esc(x.home)} vs ${esc(x.away)}</span><b class="${String(x.result).toLowerCase()}">${esc(x.result)}${x.odds?` · ${Number(x.odds).toFixed(2)}`:""}</b></div>`).join(""):`<div class="slip-empty">No locked results yet.</div>`;
  }

  function renderPicksView(){
    const ds=dates();
    const engine=ENGINE_MAP[picksFilter.engine]||null;
    const engineRows=engine?enginePicks(engine.id):[];
    const engineDates=[...new Set(engineRows.map(p=>dateOf(p.m)))].sort();
    if(!activeDate)activeDate=engineDates[0]||ds[0]||todayISO;
    if(engine&&engineDates.length&&!engineDates.includes(activeDate))activeDate=engineDates.find(d=>d>=todayISO)||engineDates[0];

    $("#date-strip").innerHTML=ds.map(d=>`<button class="date-btn ${d===activeDate?"active":""}" data-date="${d}"><b>${friendlyDate(d).split(" · ")[0]}</b><small>${friendlyDate(d).split(" · ")[1]||d}</small></button>`).join("");
    $$('[data-date]').forEach(b=>b.onclick=()=>{activeDate=b.dataset.date;renderPicksView();renderDashboardSelectors();renderDashboardList()});

    const engSel=$("#picks-engine");
    engSel.innerHTML=`<option value="all">All Engines</option>${ENGINES.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}`;
    engSel.value=picksFilter.engine||"all";

    const markets=[...new Set(allPicks().map(p=>marketFamily(p.market)))].sort();
    const mSel=$("#picks-market");
    mSel.innerHTML=`<option value="all">All Markets</option>${markets.map(x=>`<option>${esc(x)}</option>`).join("")}`;
    mSel.value=picksFilter.market||"all";

    const leagues=[...new Set(matches.map(m=>m.league).filter(Boolean))].sort();
    const lSel=$("#picks-league");
    lSel.innerHTML=`<option value="all">All Leagues</option>${leagues.map(x=>`<option>${esc(x)}</option>`).join("")}`;
    lSel.value=picksFilter.league||"all";
    const gradeSel=$("#picks-grade");if(gradeSel)gradeSel.value=picksFilter.grade||"all";

    let rows=(engine?engineRows:allPicks()).filter(p=>dateOf(p.m)===activeDate);
    if(picksFilter.market!=="all")rows=rows.filter(p=>marketFamily(p.market)===picksFilter.market);
    if(picksFilter.league!=="all")rows=rows.filter(p=>p.m.league===picksFilter.league);
    if(picksFilter.grade!=="all")rows=rows.filter(p=>p.grade===picksFilter.grade);
    if(searchTerm)rows=rows.filter(p=>`${p.m.home} ${p.m.away} ${p.m.league}`.toLowerCase().includes(searchTerm));

    const hero=$("#engine-picks-hero");
    const title=$("#picks-title"),eyebrow=$("#picks-eyebrow"),subtitle=$("#picks-subtitle");
    if(engine){
      if(title)title.textContent=`${engine.name} Picks`;
      if(eyebrow)eyebrow.textContent=`${engine.name.toUpperCase()} ENGINE`;
      if(subtitle)subtitle.textContent=`Selections supported by ${engine.name} — ${engine.role}.`;
      if(hero){
        hero.hidden=false;
        hero.dataset.engineFamily=engine.family||"olympian";
        hero.style.setProperty("--engine-art",`url("${ENGINE_ART[engine.id]||ENGINE_ART.zeus}")`);
        const coverage=engine.family==="rebel"?rebelCoverage(engine.id):null;
        const metaText=coverage?`<b>${engineRows.length}</b> qualified signals · <b>${coverage.ready}</b> fixtures have ${coverage.threshold}+ bookmaker histories · <b>${coverage.moving}</b> show active movement`:`<b>${engineRows.length}</b> qualified picks across <b>${engineDates.length}</b> active dates`;
        hero.innerHTML=`<div class="engine-picks-copy"><span>${esc(engine.role)}</span><h3>${esc(engine.name)} Engine Picks</h3><p>${esc(engine.summary)}</p><div class="engine-picks-meta">${metaText}</div><button class="engine-about-btn" type="button" data-engine-about="${engine.id}">How ${esc(engine.name)} works</button></div><img src="${esc(ENGINE_ART[engine.id]||ENGINE_ART.zeus)}" alt="${esc(engine.name)} engine artwork" loading="eager">`;
      }
    }else{
      if(title)title.textContent="Upcoming Predictions";
      if(eyebrow)eyebrow.textContent="FULL MATCH BOARD";
      if(subtitle)subtitle.textContent="Browse every qualified market across today and the next six days.";
      if(hero){hero.hidden=true;hero.innerHTML="";hero.style.removeProperty("--engine-art");delete hero.dataset.engineFamily}
    }

    let emptyText="No engine clears the selected conditions.";
    if(engine){
      if(engine.family==="rebel"){
        const c=rebelCoverage(engine.id);
        emptyText=c.moving?`${engine.name} has movement data, but no market cleared its strict agreement and confirmation rules for ${friendlyDate(activeDate)}.`:`${engine.name} is collecting opening-to-current bookmaker movement. Run the hourly evidence refresh again after prices change.`;
      }else emptyText=`${engine.name} has no qualified picks for ${friendlyDate(activeDate)}.`;
    }
    $("#picks-list").innerHTML=rows.length?rows.map(matchRow).join(""):empty(emptyText);
    updatePageArt();
  }

  function renderEngines(){
    $("#engine-grid").innerHTML=ENGINES.map(e=>{
      const count=enginePicks(e.id).length;
      const art=ENGINE_ART[e.id]||ENGINE_ART.zeus;
      const rebel=e.family==="rebel";
      const coverage=rebel?rebelCoverage(e.id):null;
      const status=count?`${count} PICKS`:rebel?(coverage.moving?`${coverage.moving} MOVING`:coverage.ready?`${coverage.ready} READY`:"COLLECTING"):"0 PICKS";
      return `<article class="engine-card deity-card ${rebel?"rebel-card":""}" data-engine-picks="${e.id}" style="--card-art:url('${art}')" role="button" tabindex="0" aria-label="View ${esc(e.name)} picks"><div class="engine-top"><span class="engine-icon">${e.glyph}</span><span class="engine-status">${status}</span></div>${rebel?'<span class="engine-family-badge">REBEL</span>':''}<h3>${e.name}</h3><small>${e.role}</small><p>${e.summary}</p><div class="engine-tags">${e.tags.map(t=>`<span>${t}</span>`).join("")}</div><div class="engine-card-cta">View ${e.name} picks →</div></article>`
    }).join("");
    $$('[data-engine-picks]').forEach(c=>{
      c.onclick=()=>viewEnginePicks(c.dataset.enginePicks);
      c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();viewEnginePicks(c.dataset.enginePicks)}};
    });
  }
  function viewEnginePicks(id){
    const engine=ENGINE_MAP[id];if(!engine)return;
    picksFilter={engine:id,market:"all",league:"all",grade:"all"};
    const engineRows=enginePicks(id);
    const availableDates=[...new Set(engineRows.map(p=>dateOf(p.m)))].sort();
    activeDate=availableDates.find(d=>d>=todayISO)||availableDates[0]||activeDate||todayISO;
    showView("picks");
    toast(engineRows.length?`${engine.name} picks loaded.`:`${engine.name} has no qualified picks right now.`);
  }
  function openEngine(id){const e=ENGINE_MAP[id];if(!e)return;$("#engine-modal-content").innerHTML=`<div class="modal-engine-head"><span class="engine-icon">${e.glyph}</span><div><h2 id="engine-modal-title">${e.name} Engine</h2><p>${e.role}</p></div></div><h4>Purpose</h4><div class="rule-box">${e.summary}</div><h4>How it works</h4><ul>${e.checks.map(x=>`<li>${x}</li>`).join("")}</ul><h4>Final safety gate</h4><div class="rule-box">${e.gate}</div>`;$("#engine-modal-backdrop").classList.add("open");$("#engine-modal").classList.add("open")}
  function openPickDetail(matchKey){let p=allPicks().find(x=>keyOf(x.m)===String(matchKey));if(picksFilter.engine!=="all"){const enginePick=enginePicks(picksFilter.engine).find(x=>keyOf(x.m)===String(matchKey));if(enginePick)p=enginePick}if(!p)return;const m=p.m,signal=p.engineOnly,displayGrade=signal?"SIGNAL":p.grade,statusText=signal?`${p.engine.name} specialist signal. Zeus has not necessarily published this market.`:p.locked?"Locked before kickoff and eligible for the verified public record.":"Provisional. It may change before the 12-hour lock window.";$("#engine-modal-content").innerHTML=`<div class="modal-engine-head"><span class="engine-icon">${p.engine.glyph||"⚡"}</span><div><h2 id="engine-modal-title">${esc(m.home)} vs ${esc(m.away)}</h2><p>${esc(m.league||"Football")} · ${esc(friendlyDate(dateOf(m)))} · ${esc(kickoff(m))}</p></div></div><div class="decision-hero"><span class="grade ${signal?"WATCH":p.grade}">${displayGrade}</span><div><small>${signal?esc(p.engine.name)+" engine signal":"Zeus decision"}</small><b>${esc(marketClean(p.market))}</b></div><strong>${p.confidence}%</strong></div><h4>Why it qualified</h4><ul>${(p.reasons||[]).map(x=>`<li>${esc(x)}</li>`).join("")||"<li>No public reason was recorded.</li>"}</ul><h4>Prediction status</h4><div class="rule-box">${statusText}${p.dataQuality!=null?` Data quality: ${esc(p.dataQuality)}/100.`:""}</div>${p.warnings&&p.warnings.length?`<h4>Warnings</h4><ul>${p.warnings.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}`;$("#engine-modal-backdrop").classList.add("open");$("#engine-modal").classList.add("open")}
  function closeEngine(){$("#engine-modal-backdrop").classList.remove("open");$("#engine-modal").classList.remove("open")}

  function renderBankers(){
    const allRows=allPicks().filter(p=>isUpcoming(p.m)&&["A1","A2"].includes(p.grade));
    const leagueSel=$("#banker-league");
    if(leagueSel){
      const leagues=[...new Set(allRows.map(p=>p.m.league).filter(Boolean))].sort();
      leagueSel.innerHTML=`<option value="all">All Leagues</option>${leagues.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")}`;
      if(!leagues.includes(bankerFilter.league))bankerFilter.league="all";
      leagueSel.value=bankerFilter.league;
    }
    const statusSel=$("#banker-status"),gradeSel=$("#banker-grade"),oddsSel=$("#banker-odds");
    if(statusSel)statusSel.value=bankerFilter.status;
    if(gradeSel)gradeSel.value=bankerFilter.grade;
    if(oddsSel)oddsSel.value=bankerFilter.odds;
    let rows=allRows.slice();
    if(bankerFilter.status==="locked")rows=rows.filter(p=>p.locked);
    if(bankerFilter.status==="provisional")rows=rows.filter(p=>!p.locked&&!isLive(p.m));
    if(bankerFilter.status==="live")rows=rows.filter(p=>isLive(p.m));
    if(bankerFilter.status==="prematch")rows=rows.filter(p=>!isLive(p.m));
    if(bankerFilter.grade!=="all")rows=rows.filter(p=>p.grade===bankerFilter.grade);
    if(bankerFilter.league!=="all")rows=rows.filter(p=>p.m.league===bankerFilter.league);
    if(bankerFilter.odds==="priced")rows=rows.filter(p=>Number.isFinite(Number(p.odds))&&Number(p.odds)>1);
    if(bankerFilter.odds==="missing")rows=rows.filter(p=>!Number.isFinite(Number(p.odds))||Number(p.odds)<=1);
    const a1=rows.filter(p=>p.grade==="A1").length,a2=rows.filter(p=>p.grade==="A2").length,priced=rows.filter(p=>Number.isFinite(Number(p.odds))&&Number(p.odds)>1),avg=priced.length?(priced.reduce((s,p)=>s+Number(p.odds),0)/priced.length).toFixed(2):"—";
    $("#banker-summary").innerHTML=[[a1,"A1 Bankers","Strictest grade"],[a2,"A2 Strong Picks","Qualified support"],[rows.length,"Shown Selections",`${allRows.length} total active`],[avg,"Average Odds","Filtered priced picks"]].map(x=>`<article class="summary-card"><small>${x[1]}</small><b>${x[0]}</b><em>${x[2]}</em></article>`).join("");
    const count=$("#banker-filter-count");if(count)count.textContent=`${rows.length} of ${allRows.length} shown`;
    $("#banker-list").innerHTML=rows.length?rows.map(matchRow).join(""):empty("No bankers match the selected filters.");
  }
  function renderResults(){
    const rows=history.filter(x=>["Won","Lost","Void"].includes(x.result)),wins=rows.filter(x=>x.result==="Won").length,losses=rows.filter(x=>x.result==="Lost").length,voids=rows.filter(x=>x.result==="Void").length,rate=wins+losses?Math.round(wins/(wins+losses)*100):0;
    $("#result-metrics").innerHTML=[[rows.length,"Settled"],[wins,"Won"],[losses,"Lost"],[rows.length?`${rate}%`:"—","Hit rate"]].map(x=>`<article class="summary-card"><small>${x[1]}</small><b>${x[0]}</b></article>`).join("");
    $("#results-list").innerHTML=rows.length?`<div class="result-head"><span>Match</span><span>Selection</span><span>Score</span><span>Result</span></div>${rows.map(x=>`<div class="result-row"><span><b>${esc(x.home)} vs ${esc(x.away)}</b><br><small>${esc(String(x.kickoff||"").slice(0,10))}</small></span><span>${esc(marketClean(x.market))}</span><span>${esc(x.score||"—")}</span><span class="result-status ${String(x.result).toLowerCase()}">${esc(x.result)}</span></div>`).join("")}`:empty("Only predictions locked before kickoff are counted in the public record.");
  }

  function slipKey(p){return `${keyOf(p.m)}|${p.market}`}
  function addPickByKey(k){let p=allPicks().find(x=>slipKey(x)===k);if(!p&&picksFilter.engine!=="all")p=enginePicks(picksFilter.engine).find(x=>slipKey(x)===k);if(!p)return;const idx=slip.findIndex(x=>x.key===k);if(idx>=0)slip.splice(idx,1);else slip.push({key:k,matchKey:keyOf(p.m),home:p.m.home,away:p.m.away,market:p.market,odds:p.odds,engine:p.engine.name,date:dateOf(p.m)});persistSlip();renderAllPickLists();renderSlip()}
  function persistSlip(){if(preferences.rememberSlip!==false)saveJSON("betynz-slip",slip)}
  function removeSlip(k){slip=slip.filter(x=>x.key!==k);persistSlip();renderAllPickLists();renderSlip()}
  function slipOdds(){return slip.reduce((x,l)=>x*(Number(l.odds)||1),1)}
  function slipHtml(){return slip.length?slip.map(l=>`<div class="slip-item"><div><b>${esc(l.home)} vs ${esc(l.away)}</b><small>${esc(marketClean(l.market))}${l.odds?` · ${Number(l.odds).toFixed(2)}`:""} · ${esc(l.engine)}</small></div><button data-remove-slip="${esc(l.key)}">×</button></div>`).join(""):`<div class="slip-empty">Tap + beside a qualified pick.</div>`}
  function renderSlip(){const html=slipHtml(),odds=slipOdds().toFixed(2);$("#slip-items").innerHTML=html;$("#drawer-items").innerHTML=html;$("#slip-count").textContent=slip.length;$("#mobile-slip-count").textContent=slip.length;$("#slip-odds").textContent=odds;$("#drawer-odds").textContent=odds;$("#mobile-slip-odds").textContent=odds;$$('[data-remove-slip]').forEach(b=>b.onclick=()=>removeSlip(b.dataset.removeSlip))}
  function copySlip(){if(!slip.length){toast("Your slip is empty.");return}const text=["BETYNZ — SMART BETTING PREDICTIONS",...slip.map((l,i)=>`${i+1}. ${l.home} vs ${l.away} — ${marketClean(l.market)}${l.odds?` @ ${Number(l.odds).toFixed(2)}`:""}`),`Total odds: ${slipOdds().toFixed(2)}`,"Predictions are informational. 18+"].join("\n");navigator.clipboard?.writeText(text).then(()=>toast("Slip copied.")).catch(()=>toast("Copy is unavailable in this browser."))}

  function renderPreferences(){const sel=$("#favorite-engine");sel.innerHTML=ENGINES.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");sel.value=preferences.favoriteEngine||"zeus";$("#confidence-pref").value=String(preferences.confidence||76);$("#remember-slip").checked=preferences.rememberSlip!==false}
  function savePreferences(){preferences={favoriteEngine:$("#favorite-engine").value,confidence:Number($("#confidence-pref").value),rememberSlip:$("#remember-slip").checked};saveJSON("betynz-preferences",preferences);if(!preferences.rememberSlip)localStorage.removeItem("betynz-slip");toast("Preferences saved.")}

  function updatePageArt(){
    const shell=$(".main-shell");
    const hero=$(".hero-panel");
    if(!shell)return;
    let art="";
    if(activeView==="dashboard") art=ENGINE_ART.zeus||"";
    else if(activeView==="picks" && picksFilter.engine!=="all") art=ENGINE_ART[picksFilter.engine]||"";
    shell.style.setProperty("--page-art", art?`url("${art}")`:"none");
    shell.style.setProperty("--hero-art", activeView==="dashboard" && ENGINE_ART.zeus?`url("${ENGINE_ART.zeus}")`:"none");
    shell.dataset.artView=activeView||"dashboard";
    shell.dataset.artEngine=activeView==="picks"?String(picksFilter.engine||"all"):"none";
    if(hero) hero.dataset.heroArt=activeView==="dashboard"?"zeus":"none";
  }

  function showView(name){if(!$( `[data-view-panel="${name}"]`))name="dashboard";activeView=name;location.hash=name;$$('[data-view-panel]').forEach(v=>v.classList.toggle("active",v.dataset.viewPanel===name));$$('[data-view]').forEach(b=>b.classList.toggle("active",b.dataset.view===name));closeSidebar();if(name==="picks")renderPicksView();if(name==="engines")renderEngines();if(name==="bankers")renderBankers();if(name==="results")renderResults();updatePageArt();window.scrollTo({top:0,behavior:"smooth"})}
  function renderAllPickLists(){renderDashboardList();if(activeView==="picks")renderPicksView();if(activeView==="bankers")renderBankers()}
  function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}

  function setSidebar(open){
    const sidebar=$("#sidebar"),backdrop=$("#sidebar-backdrop"),menu=$("#menu-btn");
    if(!sidebar)return;
    sidebar.classList.toggle("open",!!open);
    if(backdrop)backdrop.classList.toggle("open",!!open);
    document.body.classList.toggle("sidebar-open",!!open);
    if(menu)menu.setAttribute("aria-expanded",open?"true":"false");
  }
  function closeSidebar(){setSidebar(false)}

  function wire(){
    $$('[data-view]').forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
    $$('[data-toast]').forEach(b=>b.addEventListener("click",()=>toast(b.dataset.toast)));
    document.addEventListener("click",e=>{const b=e.target.closest("[data-add-pick]");if(b){addPickByKey(b.dataset.addPick);return}const d=e.target.closest("[data-pick-detail]");if(d){openPickDetail(d.dataset.pickDetail);return}const about=e.target.closest("[data-engine-about]");if(about){openEngine(about.dataset.engineAbout)}});
    $("#menu-btn").onclick=()=>setSidebar(!$("#sidebar").classList.contains("open"));
    const sidebarBackdrop=$("#sidebar-backdrop");if(sidebarBackdrop)sidebarBackdrop.onclick=closeSidebar;
    $("#dashboard-date").onchange=e=>{activeDate=e.target.value;renderDashboardList()};$("#dashboard-market").onchange=renderDashboardList;$("#dashboard-odds").onchange=renderDashboardList;
    $("#clear-filters").onclick=()=>{activeDashboardEngine="all";$("#dashboard-market").value="all";$("#dashboard-odds").value="all";renderEngineTabs();renderDashboardList()};
    $("#picks-engine").onchange=e=>{picksFilter.engine=e.target.value;renderPicksView()};
    $("#picks-market").onchange=e=>{picksFilter.market=e.target.value;renderPicksView()};
    $("#picks-league").onchange=e=>{picksFilter.league=e.target.value;renderPicksView()};
    $("#picks-grade").onchange=e=>{picksFilter.grade=e.target.value;renderPicksView()};
    $("#banker-status").onchange=e=>{bankerFilter.status=e.target.value;renderBankers()};
    $("#banker-grade").onchange=e=>{bankerFilter.grade=e.target.value;renderBankers()};
    $("#banker-league").onchange=e=>{bankerFilter.league=e.target.value;renderBankers()};
    $("#banker-odds").onchange=e=>{bankerFilter.odds=e.target.value;renderBankers()};
    $("#banker-reset").onclick=()=>{bankerFilter={status:"all",grade:"all",league:"all",odds:"all"};renderBankers();toast("Banker filters reset.")};
    $("#global-search").oninput=e=>{searchTerm=e.target.value.trim().toLowerCase();renderDashboardList();if(activeView==="picks")renderPicksView()};
    $("#clear-slip").onclick=()=>{slip=[];persistSlip();renderSlip();renderAllPickLists()};$("#copy-slip").onclick=copySlip;$("#drawer-copy").onclick=copySlip;
    $("#mobile-slip").onclick=()=>{$("#mobile-drawer").classList.add("open");$("#drawer-backdrop").classList.add("open")};const closeDrawer=()=>{$("#mobile-drawer").classList.remove("open");$("#drawer-backdrop").classList.remove("open")};$("#drawer-close").onclick=closeDrawer;$("#drawer-backdrop").onclick=closeDrawer;
    $("#engine-modal-close").onclick=closeEngine;$("#engine-modal-backdrop").onclick=closeEngine;document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeEngine();closeDrawer();closeSidebar()}});
    $("#add-visible").onclick=()=>{const source=picksFilter.engine!=="all"?enginePicks(picksFilter.engine):allPicks();const dateRows=source.filter(p=>dateOf(p.m)===activeDate&&isUpcoming(p.m));dateRows.forEach(p=>{const k=slipKey(p);if(!slip.some(x=>x.key===k))slip.push({key:k,matchKey:keyOf(p.m),home:p.m.home,away:p.m.away,market:p.market,odds:p.odds,engine:p.engine.name,date:dateOf(p.m)})});persistSlip();renderSlip();renderAllPickLists();toast(`${dateRows.length} visible picks added.`)};
    $("#save-prefs").onclick=savePreferences;
    window.addEventListener("hashchange",()=>showView((location.hash||"#dashboard").slice(1)));
  }

  function init(){
    const validMatchKeys=new Set(matches.map(keyOf));
    const originalSlipSize=slip.length;
    slip=slip.filter(item=>validMatchKeys.has(String(item.matchKey)));
    if(slip.length!==originalSlipSize)persistSlip();
    const ds=dates();activeDate=ds.includes(todayISO)?todayISO:(ds.find(d=>d>=todayISO)||ds[0]||todayISO);
    const generated=meta.generatedAt?new Date(meta.generatedAt):null;const age=generated&&Number.isFinite(generated.getTime())?(Date.now()-generated.getTime())/36e5:null;const stale=age!=null&&age>12;
    $("#system-status").textContent=isDemo?"Demo snapshot — run Update Betynz Data":isPending?"Waiting for first verified live sync":stale?"Data snapshot is stale":matches.length?"Data pipeline healthy":"Live feed checked — no fixtures returned";$("#data-state").textContent=isDemo?"Demo Data":isPending?"Sync Pending":stale?"Stale Data":matches.length?"Live Data":"Live · No Fixtures";
    const statusBox=$("#data-status-content");if(statusBox)statusBox.innerHTML=`<article><small>Source</small><b>${esc(meta.source||"Unknown")}</b></article><article><small>Generated</small><b>${esc(meta.generatedAt?new Date(meta.generatedAt).toLocaleString():"Unknown")}</b></article><article><small>Fixtures</small><b>${esc(meta.fixtureCount??matches.length)}</b></article><article><small>Qualified</small><b>${esc(meta.qualifiedCount??allPicks().length)}</b></article>`;
    renderDashboardSelectors();renderMetrics();renderEngineTabs();renderDashboardList();renderRecentResults();renderPicksView();renderEngines();renderBankers();renderResults();renderSlip();renderPreferences();wire();updatePageArt();showView(activeView);
    if("serviceWorker" in navigator){
      let refreshing=false;
      navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload()}});
      navigator.serviceWorker.register("service-worker.js",{updateViaCache:"none"}).then(reg=>reg.update()).catch(()=>{});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
