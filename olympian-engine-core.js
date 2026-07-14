(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="3.9.0";
  const REBEL_API=(typeof require==="function"?(()=>{try{return require("./rebel-engine-core.js")}catch(_){return {}}})():typeof globalThis!=="undefined"?globalThis:{});
  const FINISHED=new Set(["FT","AET","PEN","AWD","WO"]);
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const n=(v,f=null)=>{const x=Number(v);return Number.isFinite(x)?x:f};
  const avg=a=>{const x=a.filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null};
  const round=(v,d=1)=>Number.isFinite(v)?Number(v.toFixed(d)):null;
  const pct=v=>Math.round(clamp(v));
  const val=(obj,path)=>path.split(".").reduce((o,k)=>o==null?undefined:o[k],obj);

  const MARKET_ODDS={
    "Home Win":"home","Away Win":"away","Home DNB":"homeDnb","Away DNB":"awayDnb",
    "Double Chance 1X":"dc1x","Double Chance X2":"dcx2","Double Chance 12":"dc12",
    "Over 1.5 Goals":"over15","Over 2.5 Goals":"over25","Over 3.5 Goals":"over35",
    "Under 2.5 Goals":"under25","Under 3.5 Goals":"under35","Under 4.5 Goals":"under45",
    "BTTS Yes":"bttsYes","BTTS No":"bttsNo",
    "Home Team Over 0.5 Goals":"homeOver05","Away Team Over 0.5 Goals":"awayOver05",
    "Home Team Over 1.5 Goals":"homeOver15","Away Team Over 1.5 Goals":"awayOver15",
    "First Half Over 0.5":"fhOver05","First Half Under 1.5":"fhUnder15",
    "Second Half Over 0.5":"shOver05","Second Half Over 1.5":"shOver15"
  };

  function formPPG(form){
    const s=String(form||"").toUpperCase().replace(/[^WDL]/g,"").slice(-10);
    if(!s.length) return null;
    return s.split("").reduce((t,c)=>t+(c==="W"?3:c==="D"?1:0),0)/s.length;
  }
  function played(m,side){
    return n(m[`${side}Played`], n(val(m,`${side}Overall.played`), null));
  }
  function overallPPG(m,side){
    const direct=n(m[`${side}PPG`],null); if(direct!=null)return direct;
    const p=played(m,side),pts=n(m[`${side}Pts`],null); if(p&&pts!=null)return pts/p;
    return null;
  }
  function venueGames(m,side){return n(m[`${side}VenueGames`],null)}
  function venuePPG(m,side){
    const direct=n(m[`${side}VenuePPG`],null); if(direct!=null)return direct;
    const g=venueGames(m,side),pts=n(m[`${side}VenuePts`],null); return g&&pts!=null?pts/g:null;
  }
  function goalDiffPG(m,side){const p=played(m,side),gd=n(m[`${side}GD`],null);return p&&gd!=null?gd/p:null}
  function attack(m,side){return side==="home"?n(m.homeScoredAtHome,null):n(m.awayScoredAway,null)}
  function concede(m,side){return side==="home"?n(m.homeConcededAtHome,null):n(m.awayConcededAway,null)}
  function leagueGPG(m){return n(val(m,"leagueAvg.goalsPerGame"),n(val(m,"leagueTrends.gpg"),null))}
  function odds(m,market){const k=MARKET_ODDS[market],x=k&&m.odds?n(m.odds[k],null):null;return x&&x>1?x:null}
  function implied(o){return o&&o>1?1/o:null}
  function positionalEdge(m){
    const h=n(m.homePos,null),a=n(m.awayPos,null),size=n(m.tableSize,20);
    return h&&a?clamp((a-h)/Math.max(8,size)*3,-1.2,1.2):0;
  }
  function dataQuality(m){
    let score=0;const missing=[];
    if(m&&m.home&&m.away)score+=12;else missing.push("fixture identity");
    if(m&&m.kickoff)score+=5;else missing.push("kickoff");
    if(m&&m.league)score+=8;else missing.push("league");
    if(m&&m.homeTeamId&&m.awayTeamId)score+=5;
    const hp=played(m,"home"),ap=played(m,"away");
    if(hp>=8&&ap>=8)score+=18;else missing.push("8+ overall matches per team");
    const hg=venueGames(m,"home"),ag=venueGames(m,"away");
    if(hg>=6&&ag>=6)score+=18;else missing.push("6+ venue matches per team");
    if(n(val(m,"leagueAvg.gamesPlayed"),0)>=30||n(val(m,"leagueTrends.sample"),0)>=30)score+=12;else missing.push("league sample");
    if(m&&m.odds&&Object.keys(m.odds).length>=2)score+=10;else missing.push("market odds");
    if(m&&(m.statsReal||m.xgReal||m.homeRecent10PPG!=null||m.awayRecent10PPG!=null))score+=12;
    return {score:clamp(score),missing};
  }
  function strength(m,side){
    const o=overallPPG(m,side),v=venuePPG(m,side),f=formPPG(m[`${side}Form`]),r=n(m[`${side}Recent10PPG`],null),gd=goalDiffPG(m,side);
    const components=[];
    if(o!=null)components.push({v:o,w:3});
    if(v!=null)components.push({v,w:4});
    if(f!=null)components.push({v:f,w:2});
    if(r!=null)components.push({v:r,w:2});
    if(gd!=null)components.push({v:1.35+gd*.55,w:2});
    const den=components.reduce((s,x)=>s+x.w,0);
    let s=den?components.reduce((t,x)=>t+x.v*x.w,0)/den:1.35;
    if(side==="home")s+=0.12;
    s+=side==="home"?positionalEdge(m):-positionalEdge(m);
    return clamp(s,0,3.2);
  }
  function baseStats(m){
    const hs=strength(m,"home"),as=strength(m,"away"),edge=hs-as;
    const ha=attack(m,"home"),aa=attack(m,"away"),hd=concede(m,"home"),ad=concede(m,"away"),lg=leagueGPG(m);
    const expected=avg([ha,aa,hd,ad,lg])||2.5;
    return {hs,as,edge,ha,aa,hd,ad,lg,expected,quality:dataQuality(m)};
  }
  function standardMarket(market){
    let x=String(market||"").trim();
    if((/^Over \d/.test(x)||/^Under \d/.test(x)||/ Team Over \d/.test(x))&&!/ Goals$/.test(x))x+=" Goals";
    return x;
  }
  function mk(engine,market,confidence,reasons,warnings=[],extra={}){
    return {bet:true,engine,version:VERSION,primary:standardMarket(market),confidence:pct(confidence),reasons:(reasons||[]).slice(0,4),warnings:(warnings||[]).slice(0,4),...extra};
  }
  function no(engine,reason,dq,warnings=[]){return {bet:false,engine,version:VERSION,primary:"No Bet",confidence:0,reasons:[reason],warnings,dataQuality:dq}}
  function qualityGate(m,engine,min=54){const q=dataQuality(m);return q.score<min?no(engine,`Data quality ${q.score}/100 is below this engine's ${min}-point gate.`,q.score,q.missing):null}

  function saferResult(m,b,engine,strict=0){
    const side=b.edge>=0?"home":"away",e=Math.abs(b.edge),att=side==="home"?b.ha:b.aa,oppAtt=side==="home"?b.aa:b.ha,oppDef=side==="home"?b.ad:b.hd;
    if(e<0.28+strict)return null;
    const win=e>=0.78+strict&&att!=null&&att>=1.45&&oppDef!=null&&oppDef>=1.25;
    const market=side==="home"?(win?"Home Win":"Home DNB"):(win?"Away Win":"Away DNB");
    const conf=72+e*15+(win?3:0)+(oppAtt!=null&&oppAtt<1?3:0);
    return mk(engine,market,conf,[`${side==="home"?"Home":"Away"} strength edge is ${round(e,2)} points.`,win?"Attack and opponent defence support converting control into a win.":"Draw protection is used because the win conversion gate is not fully clear.",`Venue and overall evidence are blended at a ${b.quality.score}/100 data-quality level.`],[],{dataQuality:b.quality.score});
  }

  function prometheusRecommend(m){
    const engine="Prometheus",g=qualityGate(m,engine,48);if(g)return g;const b=baseStats(m);
    const r=saferResult(m,b,engine,0);if(r)return r;
    if(b.expected>=2.55&&[b.ha,b.aa,b.hd,b.ad].filter(x=>x!=null).length>=3)return mk(engine,"Over 1.5 Goals",75,[`Combined scoring environment is ${round(b.expected,2)} goals.`,`No team-control market cleared, so the model routes to the safer goal line.`],[],{dataQuality:b.quality.score});
    return no(engine,"The foundation model found no clear strength or goal edge.",b.quality.score);
  }

  function athenaRecommend(m){
    const engine="Athena",g=qualityGate(m,engine,66);if(g)return g;const b=baseStats(m);
    const venueGap=Math.abs((venuePPG(m,"home")??b.hs)-(venuePPG(m,"away")??b.as));
    if(Math.abs(b.edge)<0.45||venueGap<0.42)return no(engine,"Control is not strong enough across both overall and venue samples.",b.quality.score);
    const r=saferResult(m,b,engine,0.12);if(!r)return no(engine,"The stronger team does not clear Athena's conversion controls.",b.quality.score);
    r.confidence=pct(r.confidence+3);r.reasons.unshift(`Venue PPG separation is ${round(venueGap,2)}.`);return r;
  }

  function apolloRecommend(m){
    const engine="Apollo",g=qualityGate(m,engine,58);if(g)return g;const t=m.leagueTrends;
    if(!t||n(t.sample,0)<30)return no(engine,"No approved league trend sample is available.",dataQuality(m).score);
    const candidates=Array.isArray(t.top3)?t.top3:[];const b=baseStats(m);
    for(const c of candidates){
      const market=String(c.market||"");const rate=n(c.rate,0);
      if(rate<0.70)continue;
      let confirm=false;
      if(market==="Over 1.5")confirm=b.expected>=2.25;
      else if(market==="Over 2.5")confirm=b.expected>=2.72;
      else if(market==="Under 3.5")confirm=b.expected<=3.05;
      else if(market==="BTTS Yes")confirm=b.ha>=1&&b.aa>=0.9;
      else if(market==="BTTS No")confirm=(b.ha<1||b.aa<0.9);
      else if(market==="Home Win")confirm=b.edge>=0.5;
      else if(market==="Away Win")confirm=b.edge<=-0.5;
      else if(market==="Home Team Over 0.5")confirm=b.ha>=1.05;
      else if(market==="Away Team Over 0.5")confirm=b.aa>=0.95;
      if(confirm)return mk(engine,standardMarket(market),74+rate*16,[`${m.league} has produced this market in ${Math.round(rate*100)}% of the tracked sample.`,`The two teams confirm the league tendency rather than contradicting it.`,`League sample: ${t.sample} completed matches.`],t.backfilled?["League profile includes previous-season backfill."]:[],{dataQuality:b.quality.score});
    }
    return no(engine,"League tendencies exist, but the current teams do not confirm them.",b.quality.score);
  }

  function aresRecommend(m){
    const engine="Ares",g=qualityGate(m,engine,62);if(g)return g;const b=baseStats(m),e=Math.abs(b.edge);
    const pos=Math.abs(positionalEdge(m));const gd=Math.abs((goalDiffPG(m,"home")||0)-(goalDiffPG(m,"away")||0));
    if(e<0.68||pos<0.25||gd<0.35)return no(engine,"The mismatch is not confirmed by strength, table position and goal difference together.",b.quality.score);
    const r=saferResult(m,b,engine,0.18);if(!r)return no(engine,"A mismatch exists, but the market conversion gate failed.",b.quality.score);
    r.confidence=pct(r.confidence+4);r.reasons.unshift(`Mismatch score: strength ${round(e,2)}, position ${round(pos,2)}, GD ${round(gd,2)}.`);return r;
  }

  function poseidonRecommend(m){
    const engine="Poseidon",g=qualityGate(m,engine,55);if(g)return g;const b=baseStats(m),lg=b.lg??b.expected;
    if(lg>=3.05&&b.expected>=2.75)return mk(engine,"Over 2.5 Goals",82,[`League scoring level is ${round(lg,2)} goals per match.`,`The fixture's venue rates remain above the high-scoring threshold.`],lg>3.4?["Inflated scoring environment: volatility penalty applied."]:[],{dataQuality:b.quality.score});
    if(lg>=2.55&&b.expected>=2.35)return mk(engine,"Over 1.5 Goals",79,[`League and team goal rates support the safer two-goal line.`,`Expected scoring environment: ${round(b.expected,2)}.`],[],{dataQuality:b.quality.score});
    if(lg<=2.45&&b.expected<=2.55)return mk(engine,"Under 3.5 Goals",80,[`League scoring level is controlled at ${round(lg,2)}.`,`Venue attack and defence rates remain below the chaos threshold.`],[],{dataQuality:b.quality.score});
    return no(engine,"League environment and team profile do not point to the same goal market.",b.quality.score);
  }

  function hermesRecommend(m){
    const engine="Hermes",g=qualityGate(m,engine,52);if(g)return g;const b=baseStats(m),o=m.odds||{};
    const home=n(o.home,null),away=n(o.away,null),draw=n(o.draw,null),o15=n(o.over15,null),o25=n(o.over25,null),u35=n(o.under35,null),btts=n(o.bttsYes,null);
    if(home&&home<=1.65&&b.edge>=0.48)return mk(engine,b.edge>=0.82?"Home Win":"Home DNB",78,[`Home price ${home.toFixed(2)} agrees with the statistical strength direction.`,`The draw price ${draw?draw.toFixed(2):"is unavailable"} is treated as a risk control.`],[],{dataQuality:b.quality.score,supportOnly:true});
    if(away&&away<=1.75&&b.edge<=-0.48)return mk(engine,b.edge<=-0.82?"Away Win":"Away DNB",78,[`Away price ${away.toFixed(2)} agrees with the statistical strength direction.`,`Market confirmation is supporting evidence, not an independent prediction.`],[],{dataQuality:b.quality.score,supportOnly:true});
    if(o15&&o15<=1.34&&b.expected>=2.3)return mk(engine,"Over 1.5 Goals",77,[`Over 1.5 price ${o15.toFixed(2)} confirms the team goal profile.`,`Cross-market scoring evidence is aligned.`],[],{dataQuality:b.quality.score,supportOnly:true});
    if(o25&&o25<=1.78&&b.expected>=2.75)return mk(engine,"Over 2.5 Goals",78,[`Over 2.5 price ${o25.toFixed(2)} agrees with the projected scoring environment.`],[],{dataQuality:b.quality.score,supportOnly:true});
    if(u35&&u35<=1.48&&b.expected<=2.75)return mk(engine,"Under 3.5 Goals",77,[`Under 3.5 price ${u35.toFixed(2)} confirms the controlled-goals profile.`],[],{dataQuality:b.quality.score,supportOnly:true});
    if(btts&&btts<=1.82&&b.ha>=1.15&&b.aa>=1.05)return mk(engine,"BTTS Yes",76,[`BTTS price ${btts.toFixed(2)} agrees with both teams' venue attack rates.`],[],{dataQuality:b.quality.score,supportOnly:true});
    return no(engine,"The available odds do not confirm a statistical candidate.",b.quality.score);
  }

  function heraRecommend(m){
    const engine="Hera",g=qualityGate(m,engine,68);if(g)return g;const b=baseStats(m);
    const hv=venuePPG(m,"home"),av=venuePPG(m,"away"),hf=formPPG(m.homeForm),af=formPPG(m.awayForm);
    if([hv,av,hf,af].some(x=>x==null))return no(engine,"Consistency requires valid venue and recent-form samples for both teams.",b.quality.score);
    const overallDir=Math.sign(b.edge),venueDir=Math.sign(hv-av),formDir=Math.sign(hf-af);
    if(!overallDir||overallDir!==venueDir||overallDir!==formDir)return no(engine,"Overall, venue and recent form do not agree on the same team.",b.quality.score);
    const r=saferResult(m,b,engine,0.1);if(!r)return no(engine,"The consistent direction is not strong enough for a protected result market.",b.quality.score);
    r.confidence=pct(r.confidence+2);r.reasons.unshift("Overall, venue and recent form all point in the same direction.");return r;
  }

  function artemisRecommend(m){
    const engine="Artemis",g=qualityGate(m,engine,50);if(g)return g;
    const h1=avg([n(m.home1HFor,null),n(m.away1HAgainst,null)]),a1=avg([n(m.away1HFor,null),n(m.home1HAgainst,null)]);
    const h2=avg([n(m.home2HFor,null),n(m.away2HAgainst,null)]),a2=avg([n(m.away2HFor,null),n(m.home2HAgainst,null)]);
    if(h1==null||a1==null||h2==null||a2==null)return no(engine,"Real half-specific samples are unavailable.",dataQuality(m).score);
    const first=h1+a1,second=h2+a2;
    if(first>=1.15)return mk(engine,"First Half Over 0.5",80,[`First-half goal projection is ${round(first,2)}.`,`Both teams contribute direct half-split evidence.`],[],{dataQuality:dataQuality(m).score});
    if(first<=0.9)return mk(engine,"First Half Under 1.5",79,[`First-half projection is controlled at ${round(first,2)}.`],[],{dataQuality:dataQuality(m).score});
    if(second>=1.2)return mk(engine,"Second Half Over 0.5",78,[`Second-half goal projection is ${round(second,2)}.`],[],{dataQuality:dataQuality(m).score});
    return no(engine,"No half market clears the direct split-data threshold.",dataQuality(m).score);
  }

  function hephaestusRecommend(m){
    const engine="Hephaestus",g=qualityGate(m,engine,63);if(g)return g;const b=baseStats(m);
    const hr=n(m.homeRecent10PPG,null),ar=n(m.awayRecent10PPG,null),ho=n(m.homeOpponentAvgPPG,null),ao=n(m.awayOpponentAvgPPG,null),restH=n(m.homeRestDays,null),restA=n(m.awayRestDays,null);
    if(hr==null||ar==null||ho==null||ao==null)return no(engine,"Deep opponent-adjusted context is incomplete.",b.quality.score);
    const adj=(hr-ar)-0.35*(ho-ao)+0.03*((restH??5)-(restA??5));
    if(Math.abs(adj)>=0.55&&Math.sign(adj)===Math.sign(b.edge)){
      const r=saferResult(m,b,engine,0.08);if(r){r.confidence=pct(r.confidence+2);r.reasons.unshift(`Opponent-adjusted recent edge is ${round(adj,2)}.`);return r;}
    }
    if(b.expected<=2.75&&Math.abs(adj)<0.25)return mk(engine,"Under 3.5 Goals",77,["Advanced context shows a compressed matchup rather than a directional mismatch.",`Opponent-adjusted edge is only ${round(Math.abs(adj),2)}.`],[],{dataQuality:b.quality.score});
    return no(engine,"Advanced context does not confirm the baseline direction.",b.quality.score);
  }

  function demeterRecommend(m){
    const engine="Demeter",g=qualityGate(m,engine,57);if(g)return g;const b=baseStats(m),hr=n(m.homeRecent10PPG,null),ar=n(m.awayRecent10PPG,null),ho=overallPPG(m,"home"),ao=overallPPG(m,"away");
    if(hr==null||ar==null||ho==null||ao==null)return no(engine,"Recent-ten and season baselines are both required.",b.quality.score);
    const hm=hr-ho,am=ar-ao,dir=(hr-ar);
    if(Math.abs(dir)<0.5||Math.sign(dir)!==Math.sign(b.edge))return no(engine,"Momentum does not reinforce the underlying team strength.",b.quality.score);
    const r=saferResult(m,b,engine,0.1);if(r){r.reasons.unshift(`Recent-ten momentum: home ${round(hm,2)}, away ${round(am,2)} versus season baseline.`);return r}
    return no(engine,"Momentum is visible but not strong enough for a publishable market.",b.quality.score);
  }

  function dionysusRecommend(m){
    const engine="Dionysus",g=qualityGate(m,engine,50);if(g)return g;const b=baseStats(m),hs=m.homeStreaks||{},as=m.awayStreaks||{};
    const hScore=n(hs.scored,n(hs.scoringStreak,null)),aScore=n(as.scored,n(as.scoringStreak,null));
    const hO15=n(hs.over15,null),aO15=n(as.over15,null),hBTTS=n(hs.btts,null),aBTTS=n(as.btts,null);
    if(hBTTS>=3&&aBTTS>=3&&b.ha>=1&&b.aa>=0.95)return mk(engine,"BTTS Yes",79,[`Both teams carry active BTTS sequences (${hBTTS} and ${aBTTS}).`,`Venue attack rates confirm the streak rather than relying on recurrence alone.`],[],{dataQuality:b.quality.score});
    if(hO15>=4&&aO15>=4&&b.expected>=2.3)return mk(engine,"Over 1.5 Goals",80,[`Both teams have active 2+ goal match sequences (${hO15} and ${aO15}).`,`The scoring environment confirms the recurrence.`],[],{dataQuality:b.quality.score});
    if(hScore>=4&&b.ha>=1.15)return mk(engine,"Home Team Over 0.5 Goals",77,[`Home scoring streak has reached ${hScore} matches.`,`Venue attack rate confirms the sequence.`],[],{dataQuality:b.quality.score});
    if(aScore>=4&&b.aa>=1.05)return mk(engine,"Away Team Over 0.5 Goals",77,[`Away scoring streak has reached ${aScore} matches.`,`Away attack rate confirms the sequence.`],[],{dataQuality:b.quality.score});
    return no(engine,"No streak has enough length plus independent statistical confirmation.",b.quality.score);
  }

  function hadesRecommend(m){
    const engine="Hades",g=qualityGate(m,engine,65);if(g)return g;const b=baseStats(m);
    const base=saferResult(m,b,engine,0.04)||poseidonRecommend(m);if(!base||!base.bet)return no(engine,"No statistical candidate is available for value testing.",b.quality.score);
    const o=odds(m,base.primary);if(!o)return no(engine,"No current price is available for calibrated value testing.",b.quality.score);
    const model=clamp((base.confidence||70)/100,.52,.90),imp=implied(o),edge=model-imp;
    if(edge<0.045)return no(engine,`Quoted price offers only ${round(edge*100,1)} percentage points of model edge.`,b.quality.score);
    const warnings=[];if(o>2.6)warnings.push("High-price volatility: confidence capped.");
    return mk(engine,base.primary,Math.min(base.confidence,o>2.6?82:88),[`Model probability ${Math.round(model*100)}% versus implied ${Math.round(imp*100)}%.`,`Estimated value edge is ${round(edge*100,1)} percentage points.`],warnings,{dataQuality:b.quality.score,valueEdge:round(edge,3)});
  }

  function atlasRecommend(m){
    const engine="Atlas",g=qualityGate(m,engine,64);if(g)return g;const b=baseStats(m),hv=venuePPG(m,"home"),av=venuePPG(m,"away"),hr=n(m.homeRecent10PPG,formPPG(m.homeForm)),ar=n(m.awayRecent10PPG,formPPG(m.awayForm));
    if(hv==null||av==null||hr==null||ar==null)return no(engine,"Venue and recent-ten strength are incomplete.",b.quality.score);
    const heavy=.55*(hv-av)+.45*(hr-ar);
    if(Math.abs(heavy)<0.52||Math.sign(heavy)!==Math.sign(b.edge))return no(engine,"Heavy venue/recent strength does not confirm the overall direction.",b.quality.score);
    const r=saferResult(m,b,engine,0.08);if(r){r.confidence=pct(r.confidence+2);r.reasons.unshift(`Heavy strength edge is ${round(Math.abs(heavy),2)}.`);return r}
    return no(engine,"The combined strength score lacks a safe market route.",b.quality.score);
  }

  function orionRecommend(m){
    const engine="Orion",g=qualityGate(m,engine,55);if(g)return g;const b=baseStats(m);
    const hx=n(m.xgHomeReal,null),ax=n(m.xgAwayReal,null),hxa=n(m.homeXgAgainst,null),axa=n(m.awayXgAgainst,null);
    if(!m.xgReal||hx==null||ax==null)return no(engine,"Trusted xG data is unavailable.",b.quality.score);
    const total=avg([hx+ax,hx+(axa??b.ad??1.2),ax+(hxa??b.hd??1.2)]);
    const xedge=hx-ax;
    if(total>=2.85)return mk(engine,"Over 2.5 Goals",82,[`Trusted xG total is ${round(total,2)}.`,`The conservative xG range remains above the three-goal threshold.`],[],{dataQuality:b.quality.score});
    if(total>=2.25)return mk(engine,"Over 1.5 Goals",79,[`Trusted xG total is ${round(total,2)}.`,`The safer goal line survives the lower-bound check.`],[],{dataQuality:b.quality.score});
    if(total<=2.35)return mk(engine,"Under 3.5 Goals",80,[`Trusted xG total is controlled at ${round(total,2)}.`],[],{dataQuality:b.quality.score});
    if(Math.abs(xedge)>=0.65&&Math.sign(xedge)===Math.sign(b.edge))return saferResult(m,b,engine,0.1)||no(engine,"xG direction lacks a safe result market.",b.quality.score);
    return no(engine,"xG does not create a clear conservative edge.",b.quality.score);
  }

  function nikeRecommend(m){
    const engine="Nike",g=qualityGate(m,engine,72);if(g)return g;const b=baseStats(m);
    const r=saferResult(m,b,engine,0.16);if(!r)return no(engine,"No result market clears the victory-grade threshold.",b.quality.score);
    const side=r.primary.startsWith("Home")?"home":"away",att=attack(m,side),oppDef=concede(m,side==="home"?"away":"home");
    if(/ Win$/.test(r.primary)&&(att==null||oppDef==null||att<1.5||oppDef<1.25))r.primary=side==="home"?"Home DNB":"Away DNB";
    r.confidence=pct(r.confidence+3);r.reasons.unshift("Nike requires strong evidence plus an attack-to-conversion check.");return r;
  }

  function spartacusRecommend(m){
    if(typeof REBEL_API.spartacusRecommend!=="function")return no("Spartacus","The rebel movement module is unavailable.",dataQuality(m).score);
    try{return REBEL_API.spartacusRecommend(m)}catch(_){return no("Spartacus","The rebel movement input could not be evaluated safely.",dataQuality(m).score)}
  }
  function leonidasRecommend(m){
    if(typeof REBEL_API.leonidasRecommend!=="function")return no("Leonidas","The rebel movement module is unavailable.",dataQuality(m).score);
    try{return REBEL_API.leonidasRecommend(m)}catch(_){return no("Leonidas","The rebel movement input could not be evaluated safely.",dataQuality(m).score)}
  }

  const SPECIALISTS={
    prometheus:prometheusRecommend,athena:athenaRecommend,apollo:apolloRecommend,ares:aresRecommend,
    poseidon:poseidonRecommend,hermes:hermesRecommend,hera:heraRecommend,artemis:artemisRecommend,
    hephaestus:hephaestusRecommend,demeter:demeterRecommend,dionysus:dionysusRecommend,hades:hadesRecommend,
    atlas:atlasRecommend,orion:orionRecommend,nike:nikeRecommend,spartacus:spartacusRecommend,leonidas:leonidasRecommend
  };
  const REBEL_IDS=new Set(["spartacus","leonidas"]);
  const AUTH={athena:1.35,apollo:1.15,ares:1.1,poseidon:1.05,hermes:.65,hera:1.25,artemis:1.1,hephaestus:1.2,demeter:.95,dionysus:.9,hades:1.15,atlas:1.25,orion:1.25,nike:1.35,prometheus:.8,spartacus:.75,leonidas:1.05};
  function opposite(a,b){a=String(a);b=String(b);return (a.includes("Over 2.5")&&b.includes("Under 2.5"))||(a.includes("Under 2.5")&&b.includes("Over 2.5"))||(a==="BTTS Yes"&&b==="BTTS No")||(a==="BTTS No"&&b==="BTTS Yes")||(a==="Home Win"&&/^Away/.test(b))||(a==="Away Win"&&/^Home/.test(b));}
  function zeusRecommend(m){
    const engine="Zeus",q=dataQuality(m);if(q.score<68)return no(engine,`Data quality ${q.score}/100 is below Zeus's release gate.`,q.score,q.missing);
    const outputs=Object.entries(SPECIALISTS).map(([id,fn])=>({id,...fn(m)})).filter(x=>x.bet&&x.primary!=="No Bet");
    if(outputs.length<2)return no(engine,"Fewer than two specialist engines produced a qualified candidate.",q.score);
    const groups={};for(const o of outputs){const k=o.primary;(groups[k]??={market:k,items:[],support:0}).items.push(o);groups[k].support+=(AUTH[o.id]||1)*clamp((o.confidence-68)/22,.15,1.4)}
    const ranked=Object.values(groups).sort((a,b)=>b.support-a.support||b.items.length-a.items.length);
    const best=ranked[0],second=ranked[1];
    const hardConflict=ranked.some(g=>g!==best&&g.items.length>=2&&opposite(best.market,g.market));
    if(hardConflict)return no(engine,"Qualified specialist engines support opposite markets.",q.score,ranked.slice(0,3).map(g=>`${g.market}: ${g.items.length} engines`));
    const authority=best.items.reduce((s,x)=>s+(AUTH[x.id]||1),0),avgConf=avg(best.items.map(x=>x.confidence))||0;
    const lead=best.support-(second?second.support:0);
    if(best.items.length<2||best.support<1.75||lead<0.35)return no(engine,"Consensus lead is too small to publish a final market.",q.score,[`Best support ${round(best.support,2)}, lead ${round(lead,2)}.`]);
    const olympianItems=best.items.filter(x=>!REBEL_IDS.has(x.id));
    const rebelItems=best.items.filter(x=>REBEL_IDS.has(x.id));
    if(!olympianItems.length)return no(engine,"Rebel movement agrees internally, but no Olympian specialist confirms the market.",q.score,["Leonidas and Spartacus can challenge or confirm the board; they cannot publish alone."]);
    let confidence=clamp(avgConf+best.items.length*1.3+authority*.8,0,93);
    let grade="WATCH";
    if(confidence>=88&&best.items.length>=3&&olympianItems.length>=2&&lead>=0.75)grade="A1";
    else if(confidence>=82&&best.items.length>=2&&olympianItems.length>=1&&lead>=0.35)grade="A2";
    else if(confidence<76)return no(engine,"Consensus score is below the public watchlist threshold.",q.score);

    // A public banker must be backed by independent deep evidence, not only the
    // broad coverage layer. This preserves global fixture coverage while making
    // Zeus stricter about what it releases as A1/A2.
    const evidence={
      teamStats:!!m.statsReal,
      recent10:m.homeRecent10PPG!=null&&m.awayRecent10PPG!=null,
      leagueTrend:!!(m.leagueTrends&&n(m.leagueTrends.sample,0)>=30),
      h2h:!!(m.h2h&&n(m.h2h.played,0)>=3),
      xg:!!m.xgReal,
      marketDepth:!!(m.odds&&Object.values(m.odds).filter(v=>n(v,null)>1).length>=4),
      lineup:!!m.lineupConfirmed
    };
    const evidenceCount=Object.values(evidence).filter(Boolean).length;
    const deepTagged=m.enrichmentTier==="deep"||evidence.teamStats||evidence.recent10||evidence.leagueTrend||evidence.xg;
    const warnings=[];
    if(grade==="A1"&&(evidenceCount<3||!deepTagged)){grade="A2";confidence=Math.min(confidence,87);warnings.push("A1 downgraded because fewer than three independent deep-evidence pillars were available.");}
    if(grade==="A2"&&(evidenceCount<2||!deepTagged)){grade="WATCH";confidence=Math.min(confidence,81);warnings.push("Public release withheld until at least two deep-evidence pillars confirm the market.");}

    const reasons=[`${best.items.length} specialist engines agree on ${best.market}.`,`Weighted support ${round(best.support,2)} leads the next market by ${round(lead,2)}.`,`Data quality: ${q.score}/100; deep evidence: ${evidenceCount}/7.${rebelItems.length?` Rebel confirmation: ${rebelItems.map(x=>x.id==="leonidas"?"Leonidas":"Spartacus").join(" + ")}.`:""}`];
    return mk(engine,best.market,confidence,reasons,warnings,{dataQuality:q.score,grade,support:round(best.support,2),lead:round(lead,2),engineIds:best.items.map(x=>x.id),specialists:outputs,evidence,evidenceCount});
  }

  function evaluateMatch(m){
    const predictions={};for(const [id,fn] of Object.entries(SPECIALISTS))predictions[id]=fn(m);
    const zeus=zeusRecommend(m);predictions.zeus=zeus;
    return {predictions,decision:zeus.bet?{market:zeus.primary,confidence:zeus.confidence,grade:zeus.grade||"WATCH",engineIds:zeus.engineIds||[],reasons:zeus.reasons,warnings:zeus.warnings||[],dataQuality:zeus.dataQuality,odds:odds(m,zeus.primary)}:null,rejection:zeus.bet?null:{reasons:zeus.reasons,warnings:zeus.warnings||[],dataQuality:zeus.dataQuality}};
  }
  function evaluateAll(matches){return (matches||[]).map(m=>({match:m,...evaluateMatch(m)}));}

  return {VERSION,MARKET_ODDS,dataQuality,evaluateMatch,evaluateAll,zeusRecommend,
    prometheusRecommend,athenaRecommend,apolloRecommend,aresRecommend,poseidonRecommend,hermesRecommend,
    heraRecommend,artemisRecommend,hephaestusRecommend,demeterRecommend,dionysusRecommend,hadesRecommend,
    atlasRecommend,orionRecommend,nikeRecommend,spartacusRecommend,leonidasRecommend,settleMarket:function(market,h,a){
      h=n(h,null);a=n(a,null);if(h==null||a==null)return"Pending";const t=h+a,m=String(market||"");
      if(m==="Home Win")return h>a?"Won":"Lost";if(m==="Away Win")return a>h?"Won":"Lost";
      if(m==="Home DNB")return h===a?"Void":h>a?"Won":"Lost";if(m==="Away DNB")return h===a?"Void":a>h?"Won":"Lost";
      if(m==="Double Chance 1X")return h>=a?"Won":"Lost";if(m==="Double Chance X2")return a>=h?"Won":"Lost";
      if(m==="Double Chance 12")return h!==a?"Won":"Lost";if(m.includes("Over 1.5")&&!m.includes("Team"))return t>=2?"Won":"Lost";
      if(m.includes("Over 2.5"))return t>=3?"Won":"Lost";if(m.includes("Over 3.5"))return t>=4?"Won":"Lost";
      if(m.includes("Under 2.5"))return t<=2?"Won":"Lost";if(m.includes("Under 3.5"))return t<=3?"Won":"Lost";if(m.includes("Under 4.5"))return t<=4?"Won":"Lost";
      if(m==="BTTS Yes")return h>0&&a>0?"Won":"Lost";if(m==="BTTS No")return !(h>0&&a>0)?"Won":"Lost";
      if(m.includes("Home Team Over 0.5"))return h>=1?"Won":"Lost";if(m.includes("Away Team Over 0.5"))return a>=1?"Won":"Lost";
      if(m.includes("Home Team Over 1.5"))return h>=2?"Won":"Lost";if(m.includes("Away Team Over 1.5"))return a>=2?"Won":"Lost";
      return"Pending";
    }};
});
