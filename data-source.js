(function(){
  "use strict";

  const VERSION="6.2.0";
  const CACHE_PREFIX="betynz-db-v620:";
  const ACTIVE_API_KEY="betynz-active-api-v620";
  const DEFAULT_REFRESH_MS=5*60*1000;
  const REQUEST_TIMEOUT_MS=20000;
  const FUTURE_DAYS=6;
  const FINISHED=new Set(["FT","AET","PEN","AWD","WO"]);
  const ENGINE_IDS=new Set(["zeus","athena","apollo","ares","poseidon","hermes","hera","artemis","hephaestus","demeter","dionysus","hades","atlas","orion","nike","prometheus","spartacus","leonidas"]);

  const dateBundles=new Map();
  let activeApiBase="";
  let activeDate=localIsoDate();
  let refreshTimer=null;
  let initialPromise=null;

  function localIsoDate(offsetDays=0){
    const now=new Date();
    now.setHours(12,0,0,0);
    now.setDate(now.getDate()+offsetDays);
    const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  }

  function clean(value){return String(value==null?"":value).trim()}
  function numeric(value){const n=Number(value);return Number.isFinite(n)?n:null}
  function confidence(value){
    const n=numeric(value);
    if(n==null)return 0;
    return Math.max(0,Math.min(100,Math.round(n<=1?n*100:n)));
  }
  function grade(value,score){
    const raw=clean(value).toUpperCase();
    if(raw.includes("A1")||raw.includes("ELITE"))return"A1";
    if(raw.includes("A2")||raw.includes("STRONG"))return"A2";
    if(raw.includes("WATCH")||raw.includes("LEAN"))return"WATCH";
    return score>=88?"A1":score>=82?"A2":"WATCH";
  }
  function teamName(team,fallback){return clean(team&&team.name)||fallback}
  function logo(team){return clean(team&&(team.logo_url||team.logo))}
  function leagueText(league){return clean(league&&league.name)||"Competition"}
  function countryText(league,team){return clean(league&&league.country)||clean(team&&team.country)||""}
  function resultWord(value){
    const v=clean(value).toUpperCase();
    return v==="WIN"?"Won":v==="LOSS"?"Lost":v==="VOID"?"Void":"Pending";
  }
  function scoreParts(value){
    const text=clean(value);
    const match=text.match(/(-?\d+)\D+(-?\d+)/);
    return match?{home:Number(match[1]),away:Number(match[2])}:{home:null,away:null};
  }
  function pickSelection(prediction){
    const primary=prediction&&prediction.primary||{};
    return clean(primary.selection||primary.market||prediction&&prediction.primary_selection||prediction&&prediction.primary_market);
  }
  function pickOdds(prediction){
    const values=[
      prediction&&prediction.primary&&prediction.primary.odds,
      prediction&&prediction.primary&&prediction.primary.odd,
      prediction&&prediction.odds,
      prediction&&prediction.odd,
      prediction&&prediction.engine&&prediction.engine.odds&&prediction.engine.odds.current
    ];
    for(const value of values){const n=numeric(value);if(n!=null&&n>1)return Number(n.toFixed(2))}
    return null;
  }
  function engineIds(prediction){
    const ids=[];
    const engines=prediction&&prediction.engines;
    if(Array.isArray(engines)){
      for(const entry of engines){
        const id=clean(typeof entry==="string"?entry:(entry&&entry.id)).toLowerCase();
        if(ENGINE_IDS.has(id)&&!ids.includes(id))ids.push(id);
      }
    }else if(engines&&typeof engines==="object"){
      for(const key of Object.keys(engines)){
        const id=clean(key).toLowerCase();
        if(ENGINE_IDS.has(id)&&!ids.includes(id))ids.push(id);
      }
    }
    return ids;
  }
  function reasons(prediction){
    const direct=Array.isArray(prediction&&prediction.reasons)?prediction.reasons:[];
    const trace=prediction&&prediction.explanation;
    const nested=Array.isArray(trace&&trace.reasons)?trace.reasons:[];
    return [...direct,...nested].map(clean).filter(Boolean).slice(0,8);
  }
  function warnings(prediction){
    return (Array.isArray(prediction&&prediction.warnings)?prediction.warnings:[]).map(clean).filter(Boolean).slice(0,8);
  }

  function fixtureKey(value){
    return clean(value&&(
      value.fixtureId??value.external_fixture_id??value.externalId??value.id
    ));
  }

  function normalizeFixture(fixture,prediction,processing){
    const home=fixture&&fixture.home||prediction&&prediction.home||{};
    const away=fixture&&fixture.away||prediction&&prediction.away||{};
    const league=fixture&&fixture.league||prediction&&prediction.league||{};
    const externalId=fixtureKey(fixture)||fixtureKey(prediction)||`${teamName(home,"Home")}|${teamName(away,"Away")}|${fixture&&fixture.kickoff||prediction&&prediction.kickoff||Date.now()}`;
    const kickoff=fixture&&fixture.kickoff||prediction&&prediction.kickoff||null;
    const status=clean(fixture&&fixture.status||prediction&&prediction.status||"NS").toUpperCase()||"NS";
    const fulltime=fixture&&fixture.fulltime||{};
    const halftime=fixture&&fixture.halftime||{};
    const selection=pickSelection(prediction);
    const score=confidence(
      prediction&&prediction.primary&&prediction.primary.confidence!=null?prediction.primary.confidence:
      prediction&&prediction.primary&&prediction.primary.probability!=null?prediction.primary.probability:
      prediction&&prediction.confidence
    );
    const qualified=Boolean(prediction&&selection&&prediction.primary&&prediction.primary.qualified!==false);
    const processState=clean(processing&&processing.state).toLowerCase();
    const databaseState=qualified?"qualified":FINISHED.has(status)?"finished":processState==="running"?"analysing":processState==="failed"?"data-pending":"no-banker";
    const ids=engineIds(prediction);

    const model={
      id:`db-${externalId}`,
      externalId,
      fixtureId:externalId,
      matchDate:kickoff?String(kickoff).slice(0,10):activeDate,
      kickoff,
      status,
      venue:clean(fixture&&fixture.venue||prediction&&prediction.venue),
      league:leagueText(league),
      leagueId:league&&league.external_league_id||league&&league.id||null,
      country:countryText(league,home),
      flag:clean(league&&league.logo_url),
      home:teamName(home,"Home"),
      away:teamName(away,"Away"),
      homeLogo:logo(home),
      awayLogo:logo(away),
      homeGoals:numeric(fulltime.home),
      awayGoals:numeric(fulltime.away),
      htHome:numeric(halftime.home),
      htAway:numeric(halftime.away),
      databaseState,
      databaseSource:true,
      databaseUpdatedAt:fixture&&fixture.updatedAt||prediction&&prediction.updatedAt||null,
      odds:{},
      sourcePrediction:prediction||null
    };

    const odd=pickOdds(prediction);
    if(qualified){
      model.zeusDecision={
        market:selection,
        confidence:score,
        grade:grade(prediction&&prediction.primary&&prediction.primary.tier,score),
        engineIds:ids,
        odds:odd,
        reasons:reasons(prediction),
        warnings:warnings(prediction),
        locked:FINISHED.has(status)||Boolean(prediction&&prediction.locked),
        provisional:!FINISHED.has(status),
        dataQuality:prediction&&prediction.engine&&prediction.engine.dataQuality||null,
        databasePublished:true
      };
    }

    if(odd&&selection){
      const normalized=selection.toLowerCase();
      const key=normalized.includes("over 1.5")?"over15":normalized.includes("over 2.5")?"over25":normalized.includes("under 3.5")?"under35":normalized.includes("btts")&&normalized.includes("yes")?"bttsYes":normalized.includes("btts")&&normalized.includes("no")?"bttsNo":null;
      if(key)model.odds[key]=odd;
    }
    return model;
  }

  function normalizeResult(row){
    const score=scoreParts(row&&row.fulltimeScore);
    return{
      id:row&&row.id||row&&row.predictionId||`result-${Math.random().toString(36).slice(2)}`,
      fixtureId:fixtureKey(row),
      kickoff:row&&row.kickoff||row&&row.gradedAt||null,
      home:teamName(row&&row.home,"Home"),
      away:teamName(row&&row.away,"Away"),
      league:leagueText(row&&row.league),
      market:clean(row&&row.prediction||row&&row.market||"Prediction"),
      confidence:confidence(row&&row.confidence),
      odds:numeric(row&&row.odd),
      score:clean(row&&row.fulltimeScore)||((score.home!=null&&score.away!=null)?`${score.home}-${score.away}`:"—"),
      result:resultWord(row&&row.outcome),
      verified:true,
      locked:true,
      gradedAt:row&&row.gradedAt||null
    };
  }

  function normalizeDashboard(payload,date,base){
    const fixtures=Array.isArray(payload&&payload.fixtures)?payload.fixtures:[];
    const predictions=Array.isArray(payload&&payload.predictions)?payload.predictions:[];
    const predictionMap=new Map(predictions.map(item=>[fixtureKey(item),item]));
    const matches=fixtures.map(item=>normalizeFixture(item,predictionMap.get(fixtureKey(item))||null,payload&&payload.processing));
    const represented=new Set(matches.map(item=>item.externalId));
    for(const prediction of predictions){
      const key=fixtureKey(prediction);
      if(!represented.has(key))matches.push(normalizeFixture({},prediction,payload&&payload.processing));
    }
    matches.sort((a,b)=>String(a.kickoff||"").localeCompare(String(b.kickoff||"")));
    const history=(Array.isArray(payload&&payload.recentResults)?payload.recentResults:[]).map(normalizeResult).filter(item=>item.result!=="Pending");
    return{
      date,
      matches,
      history,
      stats:payload&&payload.stats||{},
      processing:payload&&payload.processing||{},
      generatedAt:payload&&payload.generatedAt||new Date().toISOString(),
      apiBase:base
    };
  }

  function apiCandidates(){
    const configured=window.BETYNZ_RUNTIME_CONFIG&&Array.isArray(window.BETYNZ_RUNTIME_CONFIG.apiBases)?window.BETYNZ_RUNTIME_CONFIG.apiBases:[];
    let saved="";
    try{saved=localStorage.getItem(ACTIVE_API_KEY)||""}catch(_){ }
    return[
      window.BETYNZ_API_URL,
      saved,
      ...configured,
      "https://api.betynz.com",
      "https://betynz-api.onrender.com"
    ].map(clean).filter((value,index,list)=>value&&list.indexOf(value)===index).map(value=>value.replace(/\/$/,""));
  }

  async function fetchCandidate(base,path){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
    try{
      const response=await fetch(`${base}${path}${path.includes("?")?"&":"?"}_=${Date.now()}`,{
        headers:{Accept:"application/json"},cache:"no-store",signal:controller.signal
      });
      if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
      const payload=await response.json();
      if(!payload||typeof payload!=="object")throw new Error("Invalid JSON response");
      return{base,payload};
    }finally{clearTimeout(timeout)}
  }

  async function fetchDashboard(date){
    const path=`/api/dashboard/today?date=${encodeURIComponent(date)}`;
    const candidates=apiCandidates();
    if(!candidates.length)throw new Error("No Betynz API URL is configured");
    const errors=[];
    const tasks=candidates.map(base=>fetchCandidate(base,path).catch(error=>{errors.push(`${base}: ${error&&error.message||error}`);throw error}));
    let result;
    try{
      result=await Promise.any(tasks);
    }catch(_){
      throw new Error(errors.length?errors.join(" | "):"Betynz database API is unreachable");
    }
    activeApiBase=result.base;
    try{localStorage.setItem(ACTIVE_API_KEY,activeApiBase)}catch(_){ }
    try{
      return normalizeDashboard(result.payload,date,result.base);
    }catch(error){
      throw new Error(`Betynz data response could not be processed: ${error&&error.message||error}`);
    }
  }

  function cacheKey(date){return`${CACHE_PREFIX}${date}`}
  function saveBundle(bundle){
    try{localStorage.setItem(cacheKey(bundle.date),JSON.stringify({...bundle,cachedAt:new Date().toISOString()}))}catch(_){ }
  }
  function loadCached(date){
    try{
      const parsed=JSON.parse(localStorage.getItem(cacheKey(date))||"null");
      if(!parsed||!Array.isArray(parsed.matches))return null;
      const age=Date.now()-Date.parse(parsed.cachedAt||parsed.generatedAt||0);
      return age<36*60*60*1000?parsed:null;
    }catch(_){return null}
  }

  function publish(reason="update"){
    const bundles=[...dateBundles.values()].sort((a,b)=>a.date.localeCompare(b.date));
    const byId=new Map();
    for(const bundle of bundles)for(const match of bundle.matches||[])byId.set(String(match.id),match);
    const matches=[...byId.values()].sort((a,b)=>String(a.kickoff||"").localeCompare(String(b.kickoff||"")));
    const current=dateBundles.get(activeDate)||dateBundles.get(localIsoDate())||bundles[0]||null;
    const histories=[];
    const historyKeys=new Set();
    for(const bundle of bundles){
      for(const row of bundle.history||[]){
        const key=`${row.fixtureId}|${row.market}|${row.result}`;
        if(historyKeys.has(key))continue;
        historyKeys.add(key);histories.push(row);
      }
    }
    histories.sort((a,b)=>String(b.kickoff||"").localeCompare(String(a.kickoff||"")));
    const qualified=matches.filter(item=>item.zeusDecision&&item.zeusDecision.market).length;
    const processing=current&&current.processing||{};
    const source=current?"live-database":"database-unavailable";
    window.MATCHES=matches;
    window.BETYNZ_HISTORY=histories;
    window.BETYNZ_DEMO=false;
    window.BETYNZ_READY=Boolean(current);
    window.BETYNZ_META={
      version:VERSION,
      source,
      isReady:Boolean(current),
      generatedAt:current&&current.generatedAt||null,
      fixtureCount:matches.length,
      qualifiedCount:qualified,
      activeDate,
      apiBase:activeApiBase||current&&current.apiBase||"",
      processing,
      stats:current&&current.stats||{},
      loadedDates:bundles.map(bundle=>bundle.date),
      reason
    };
    window.dispatchEvent(new CustomEvent("betynz:data-updated",{detail:{matches,history:histories,meta:window.BETYNZ_META}}));
  }

  async function loadDate(date,{silent=false}={}){
    const target=/^\d{4}-\d{2}-\d{2}$/.test(clean(date))?clean(date):localIsoDate();
    activeDate=target;
    const cached=dateBundles.get(target)||loadCached(target);
    if(cached&&!dateBundles.has(target)){dateBundles.set(target,cached);publish("cache")}
    try{
      const fresh=await fetchDashboard(target);
      dateBundles.set(target,fresh);saveBundle(fresh);publish("network");
      return fresh;
    }catch(error){
      if(!silent&&!cached){
        window.BETYNZ_READY=false;
        window.BETYNZ_META={version:VERSION,source:"database-unavailable",isReady:false,fixtureCount:window.MATCHES&&window.MATCHES.length||0,qualifiedCount:0,activeDate:target,error:error&&error.message||String(error)};
        window.dispatchEvent(new CustomEvent("betynz:data-error",{detail:{date:target,error:window.BETYNZ_META.error}}));
      }
      if(cached)return cached;
      throw error;
    }
  }

  async function loadFutureDates(){
    for(let offset=1;offset<=FUTURE_DAYS;offset+=1){
      const date=localIsoDate(offset);
      if(dateBundles.has(date))continue;
      try{await loadDate(date,{silent:true})}catch(_){ }
      await new Promise(resolve=>setTimeout(resolve,180));
    }
    activeDate=localIsoDate();
    publish("future-dates-ready");
  }

  async function loadInitial(){
    if(initialPromise)return initialPromise;
    initialPromise=(async()=>{
      const today=localIsoDate();activeDate=today;
      const cached=loadCached(today);
      if(cached){dateBundles.set(today,cached);publish("initial-cache")}
      try{await loadDate(today,{silent:Boolean(cached)})}catch(_){publish("initial-error")}
      setTimeout(loadFutureDates,250);
      scheduleRefresh();
      return{matches:window.MATCHES||[],meta:window.BETYNZ_META||{}};
    })();
    return initialPromise;
  }

  function scheduleRefresh(){
    if(refreshTimer)clearInterval(refreshTimer);
    const configured=Number(window.BETYNZ_RUNTIME_CONFIG&&window.BETYNZ_RUNTIME_CONFIG.refreshMs);
    const every=Number.isFinite(configured)&&configured>=60000?configured:DEFAULT_REFRESH_MS;
    refreshTimer=setInterval(()=>loadDate(activeDate,{silent:true}).catch(()=>{}),every);
  }

  function setActiveDate(date){
    const target=clean(date);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(target))return Promise.resolve(null);
    activeDate=target;
    if(dateBundles.has(target)){publish("active-date");return loadDate(target,{silent:true}).catch(()=>dateBundles.get(target))}
    return loadDate(target,{silent:false});
  }

  window.addEventListener("online",()=>loadDate(activeDate,{silent:true}).catch(()=>{}));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")loadDate(activeDate,{silent:true}).catch(()=>{})});

  window.BETYNZ_RUNTIME_CONFIG=Object.freeze({
    apiBases:Array.isArray(window.BETYNZ_RUNTIME_CONFIG&&window.BETYNZ_RUNTIME_CONFIG.apiBases)?window.BETYNZ_RUNTIME_CONFIG.apiBases:[],
    refreshMs:Number(window.BETYNZ_RUNTIME_CONFIG&&window.BETYNZ_RUNTIME_CONFIG.refreshMs)||DEFAULT_REFRESH_MS
  });
  window.BetynzDataSource=Object.freeze({VERSION,loadInitial,loadDate,setActiveDate,refresh:()=>loadDate(activeDate,{silent:false}),localIsoDate});
  window.MATCHES=Array.isArray(window.MATCHES)?window.MATCHES:[];
  window.BETYNZ_HISTORY=Array.isArray(window.BETYNZ_HISTORY)?window.BETYNZ_HISTORY:[];
  window.BETYNZ_META=window.BETYNZ_META&&typeof window.BETYNZ_META==="object"?window.BETYNZ_META:{version:VERSION,source:"database-loading",isReady:false,fixtureCount:0,qualifiedCount:0,activeDate};
  window.BETYNZ_READY=false;
  window.BETYNZ_DEMO=false;
}());
