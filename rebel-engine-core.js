(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.4.0";
  const CONFIG={
    engines:{
      spartacus:{minBookmakers:3,minAgreement:.55,minMovement:.04,strongMovement:.06,requiredConfirmations:1,maxMildContradictions:1,minConfidence:68},
      leonidas:{minBookmakers:5,minAgreement:.70,minMovement:.06,strongMovement:.08,requiredConfirmations:2,maxMildContradictions:1,minConfidence:78}
    },
    goalMarkets:{
      over15:{maxOdds:1.29,requiresUnder35Above:1.40,drawMinExclusive:3.50,bttsYesMax:1.60},
      over25:{minOdds:1.20,maxOdds:1.70,requiresUnder35Above:1.60},
      under25:{minOdds:1.20,maxOdds:1.70,requiresOver15Above:1.60},
      under35:{maxOdds:1.30,requiresOver15Above:1.40,drawMax:3.00,bttsNoMax:1.60,fallback:"over15"},
      over35:{minOdds:1.20,maxOddsExclusive:1.90,requiresUnder35Above:1.60}
    },
    favoriteRule:{
      spartacus:{favoriteMin:1.20,favoriteMax:1.55,opponentMin:5.00,drawMinExclusive:3.60,under35Min:1.40,bttsNoMax:1.70},
      leonidas:{favoriteMin:1.20,favoriteMax:1.50,opponentMin:5.50,drawMinExclusive:3.60,under35Min:1.40,bttsNoMax:1.70}
    }
  };
  const MARKET_LABELS={
    OVER_1_5:"Over 1.5 Goals",OVER_2_0_ASIAN:"Over 2.0 Asian Goals",OVER_2_5:"Over 2.5 Goals",OVER_3_5:"Over 3.5 Goals",
    UNDER_2_5:"Under 2.5 Goals",UNDER_3_0_ASIAN:"Under 3.0 Asian Goals",UNDER_3_5:"Under 3.5 Goals"
  };
  const GOAL_DECISION_ORDER=["OVER_3_5","OVER_2_5","UNDER_2_5","UNDER_3_5","OVER_1_5"];
  const GOAL_PRIORITY=Object.fromEntries(GOAL_DECISION_ORDER.map((key,index)=>[key,index]));
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const median=values=>{const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2};
  const inRange=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
  const movementPercent=(opening,current)=>Number.isFinite(opening)&&Number.isFinite(current)&&opening>0?(opening-current)/opening:null;
  const driftPercent=(opening,current)=>Number.isFinite(opening)&&Number.isFinite(current)&&opening>0?(current-opening)/opening:null;
  const noBet=(reason,details={})=>({market:"NO_BET",reason,...details});

  function validateBase(input,engine){
    if((input.bookmakerCount??0)<engine.minBookmakers)return"Insufficient bookmaker count";
    if((input.bookmakerAgreement??0)<engine.minAgreement)return"Insufficient bookmaker agreement";
    if((input.confirmations??0)<engine.requiredConfirmations)return"Insufficient related-market confirmation";
    if((input.contradictions??0)>engine.maxMildContradictions)return"Too many contradictions";
    return null;
  }

  function movementOf(input,key){
    const x=n(input&&input.movement&&input.movement[key]);
    return x==null?0:x;
  }
  function signalOf(input,key,fallback=false){
    if(input&&input.signals&&Object.prototype.hasOwnProperty.call(input.signals,key))return !!input.signals[key];
    return !!fallback;
  }
  function marketStat(input,key){
    const stat=input&&input.marketStats&&input.marketStats[key];
    if(stat&&typeof stat==="object")return{
      count:Number(stat.count||0),agreement:Number(stat.agreement||0),stableAgreement:Number(stat.stableAgreement||0),driftAgreement:Number(stat.driftAgreement||0),movement:n(stat.movement)??movementOf(input,key)
    };
    return{count:Number(input&&input.bookmakerCount||0),agreement:Number(input&&input.bookmakerAgreement||0),stableAgreement:Number(input&&input.stableAgreement||0),driftAgreement:Number(input&&input.driftAgreement||0),movement:movementOf(input,key)};
  }
  function confirmationsOf(input,key){
    const value=input&&input.confirmationsByMarket&&input.confirmationsByMarket[key];
    return Number.isFinite(Number(value))?Number(value):Number(input&&input.confirmations||0);
  }
  function contradictionsOf(input,key){
    const value=input&&input.contradictionsByMarket&&input.contradictionsByMarket[key];
    return Number.isFinite(Number(value))?Number(value):Number(input&&input.contradictions||0);
  }
  function isStableOrShortening(value){return Number.isFinite(value)&&value>=-.005}
  function isStableOrDrifting(value){return Number.isFinite(value)&&value<=.005}
  function isStronglyStable(value){return Number.isFinite(value)&&Math.abs(value)<=.01}
  function isViolentShortening(value,engine){return Number.isFinite(value)&&value>=Math.max(.10,engine.strongMovement+.02)}
  function goalBasePass(input,key,engine,allowStableAgreement=false){
    const stat=marketStat(input,key),agreement=allowStableAgreement?Math.max(stat.agreement,stat.stableAgreement):stat.agreement;
    if(stat.count<engine.minBookmakers)return{pass:false,reason:`${stat.count} bookmakers supplied ${key}; ${engine.minBookmakers} are required.`,stat,agreement};
    if(agreement<engine.minAgreement)return{pass:false,reason:`${Math.round(agreement*100)}% bookmaker agreement is below ${Math.round(engine.minAgreement*100)}%.`,stat,agreement};
    const confirmations=confirmationsOf(input,key),contradictions=contradictionsOf(input,key),major=Number(input&&input.majorContradictions||0)>0||signalOf(input,`${key}MajorContradiction`,false);
    if(confirmations<engine.requiredConfirmations)return{pass:false,reason:`${confirmations} related confirmations are below the required ${engine.requiredConfirmations}.`,stat,agreement,confirmations,contradictions,major};
    if(major)return{pass:false,reason:"A major market contradiction is present.",stat,agreement,confirmations,contradictions,major};
    if(contradictions>engine.maxMildContradictions)return{pass:false,reason:"Too many mild contradictions remain.",stat,agreement,confirmations,contradictions,major};
    return{pass:true,stat,agreement,confirmations,contradictions,major};
  }
  function candidate(output,sourceKey,originalMarket,level,ctx,reason,downgradeLevel=0){
    const movement=ctx&&ctx.stat?n(ctx.stat.movement)??0:0;
    const strength=level*1000+Math.max(-.05,Math.min(.20,movement))*1000+(ctx&&ctx.agreement||0)*100+(ctx&&ctx.confirmations||0)*8-(ctx&&ctx.contradictions||0)*15;
    return{market:output,sourceKey,originalMarket,level,downgradeLevel,movement,agreement:ctx&&ctx.agreement||0,bookmakerCount:ctx&&ctx.stat&&ctx.stat.count||0,confirmations:ctx&&ctx.confirmations||0,contradictions:ctx&&ctx.contradictions||0,reason,strength,priority:GOAL_PRIORITY[originalMarket]??99};
  }
  function chooseGoalCandidate(candidates){
    const unique=new Map();
    for(const row of candidates.filter(Boolean)){
      const key=`${row.market}|${row.originalMarket}`;
      const prev=unique.get(key);if(!prev||row.strength>prev.strength)unique.set(key,row);
    }
    return[...unique.values()].sort((a,b)=>b.strength-a.strength||a.priority-b.priority)[0]||null;
  }
  function evaluateGoalMarket(input,engineName="spartacus"){
    const engine=CONFIG.engines[engineName];if(!engine)throw new Error(`Unknown engine: ${engineName}`);
    const odds=input&&input.odds||{},m=input&&input.movement||{},candidates=[];
    const over15Safety=()=>{
      const ctx=goalBasePass(input,"over15",engine,true),move=movementOf(input,"over15");
      const related=confirmationsOf(input,"over15");
      const settledOddsGate=n(odds.over15)!=null&&n(odds.over15)<=1.29&&n(odds.under35)!=null&&n(odds.under35)>1.40&&n(odds.draw)!=null&&n(odds.draw)>3.50&&n(odds.bttsYes)!=null&&n(odds.bttsYes)<=1.60;
      const pass=ctx.pass&&settledOddsGate&&isStableOrShortening(move)&&!signalOf(input,"under25Strong",movementOf(input,"under25")>=engine.minMovement)&&!signalOf(input,"majorLowScoringHtFt",false)&&related>=1;
      return pass?{ctx,move}:null;
    };
    const under35Safety=()=>{
      const ctx=goalBasePass(input,"under35",engine,true),move=movementOf(input,"under35"),stableAgreement=ctx&&ctx.stat?ctx.stat.stableAgreement:0;
      const directional=move>=engine.minMovement||(isStronglyStable(move)&&stableAgreement>=engine.minAgreement);
      const settledOddsGate=n(odds.under35)!=null&&n(odds.under35)<=1.30&&n(odds.over15)!=null&&n(odds.over15)>1.40&&n(odds.draw)!=null&&n(odds.draw)<=3.00&&n(odds.bttsNo)!=null&&n(odds.bttsNo)<=1.60;
      const pass=ctx.pass&&settledOddsGate&&directional&&!isViolentShortening(movementOf(input,"over25"),engine)&&!signalOf(input,"fhOver15Strong",movementOf(input,"fhOver15")>=engine.strongMovement)&&!signalOf(input,"teamOver25Major",movementOf(input,"homeOver25")>=engine.strongMovement||movementOf(input,"awayOver25")>=engine.strongMovement);
      return pass?{ctx,move}:null;
    };

    // 1) Over 3.5. Exact price, movement and cross-market confirmation are mandatory.
    {
      const ctx=goalBasePass(input,"over35",engine),move=movementOf(input,"over35");
      const exact=ctx.pass&&inRange(n(odds.over35),1.20,1.899999)&&inRange(n(odds.over25),1.20,1.70)&&n(odds.under35)>1.60&&move>=engine.minMovement&&signalOf(input,"fhOver15Supported",n(odds.fhOver15)!=null&&n(odds.fhOver15)<=1.95&&isStableOrShortening(movementOf(input,"fhOver15")))&&(signalOf(input,"bttsYesSupported",movementOf(input,"bttsYes")>=.01||(n(odds.bttsYes)!=null&&n(odds.bttsYes)<=1.95))||signalOf(input,"favoriteTeamOver15Supported",movementOf(input,"homeOver15")>=engine.minMovement||movementOf(input,"awayOver15")>=engine.minMovement))&&!signalOf(input,"under35Strong",movementOf(input,"under35")>=engine.strongMovement);
      if(exact){
        if(move>=engine.strongMovement&&ctx.contradictions===0)candidates.push(candidate("OVER_3_5","over35","OVER_3_5",3,ctx,"Over 3.5 passed the exact 1.20–1.89 range, movement and related-goal confirmations."));
        else candidates.push(candidate("OVER_2_5","over35","OVER_3_5",2,ctx,"Over 3.5 had valid direction but did not reach full-strength movement; protected downgrade to Over 2.5.",1));
      }else if(n(odds.over35)>=1.90&&inRange(n(odds.over25),1.20,1.70)&&n(odds.under35)>1.60&&movementOf(input,"over25")>=engine.minMovement){
        const p25=goalBasePass(input,"over25",engine);
        if(p25.pass)candidates.push(candidate("OVER_2_5","over25","OVER_3_5",2,p25,"Over 3.5 was 1.90 or higher; Over 2.5 retained the corrected range and Under 3.5 confirmation.",1));
      }
    }

    // 2) Over 2.5. Under 3.5 above 1.60 is mandatory.
    {
      const ctx=goalBasePass(input,"over25",engine),move=movementOf(input,"over25"),u35Move=movementOf(input,"under35");
      const lowContradiction=signalOf(input,"bttsNoStrong",movementOf(input,"bttsNo")>=engine.strongMovement)&&signalOf(input,"fhUnder15Strong",movementOf(input,"fhUnder15")>=engine.strongMovement);
      const exact=ctx.pass&&inRange(n(odds.over25),1.20,1.70)&&n(odds.under35)>1.60&&move>=engine.minMovement&&isStableOrDrifting(u35Move)&&signalOf(input,"over15StrongSupported",n(odds.over15)!=null&&n(odds.over15)<=1.30&&isStableOrShortening(movementOf(input,"over15")))&&!lowContradiction&&!signalOf(input,"lowScoringContradiction",false);
      if(exact){
        if(move>=engine.strongMovement&&ctx.contradictions===0)candidates.push(candidate("OVER_2_5","over25","OVER_2_5",3,ctx,"Over 2.5 passed 1.20–1.70, Under 3.5 above 1.60, shortening and confirmation controls."));
        else candidates.push(candidate("OVER_2_0_ASIAN","over25","OVER_2_5",2,ctx,"Over 2.5 direction was valid but not full-strength; one-level downgrade to Over 2.0 Asian Goals.",1));
      }else if(inRange(n(odds.over25),1.20,1.70)&&n(odds.under35)>1.60&&move>0&&!lowContradiction){
        const safe=over15Safety();if(safe)candidates.push(candidate("OVER_1_5","over15","OVER_2_5",1,safe.ctx,"Over 2.5 retained positive direction but failed the full gate; final safety downgrade to Over 1.5 only after the 1.29, Under 3.5, draw and GG gates pass.",2));
      }
    }

    // 3) Under 2.5. Over 1.5 above 1.60 is mandatory.
    {
      const ctx=goalBasePass(input,"under25",engine),move=movementOf(input,"under25"),o25Move=movementOf(input,"over25");
      const overContradiction=signalOf(input,"over25Strong",movementOf(input,"over25")>=engine.minMovement)&&signalOf(input,"bttsYesStrong",movementOf(input,"bttsYes")>=engine.strongMovement);
      const exact=ctx.pass&&inRange(n(odds.under25),1.20,1.70)&&n(odds.over15)>1.60&&move>=engine.minMovement&&isStableOrDrifting(o25Move)&&signalOf(input,"under35Supported",n(odds.under35)!=null&&n(odds.under35)<=1.40&&isStableOrShortening(movementOf(input,"under35")))&&!signalOf(input,"firstHalfGoalPressureStrong",movementOf(input,"fhOver15")>=engine.strongMovement)&&!overContradiction;
      if(exact){
        if(move>=engine.strongMovement&&ctx.contradictions===0)candidates.push(candidate("UNDER_2_5","under25","UNDER_2_5",3,ctx,"Under 2.5 passed 1.20–1.70, Over 1.5 above 1.60 and the low-goal confirmation gate."));
        else candidates.push(candidate("UNDER_3_0_ASIAN","under25","UNDER_2_5",2,ctx,"Under 2.5 direction was valid but not full-strength; one-level downgrade to Under 3.0 Asian Goals.",1));
      }else{
        // When Over 1.5 itself is priced at 1.29 or lower, the corrected rule
        // rejects Under 2.5 and checks the positive-goals safety market first.
        const invalidUnder25Price=n(odds.over15)!=null&&n(odds.over15)<=1.60;
        const over15Replacement=invalidUnder25Price?over15Safety():null;
        if(over15Replacement)candidates.push(candidate("OVER_1_5","over15","UNDER_2_5",2,over15Replacement.ctx,"Under 2.5 was rejected because Over 1.5 was not above 1.60; Over 1.5 passed the final 1.29, Under 3.5, draw and GG gates.",1));
        else{
          const u35=under35Safety();
          if(u35)candidates.push(candidate("UNDER_3_5","under35","UNDER_2_5",1,u35.ctx,"Under 2.5 failed the exact gate; final safety downgrade to Under 3.5 only after the 1.30, Over 1.5, draw and NG gates passed.",2));
        }
      }
    }

    // 4) Under 3.5, including the mandatory automatic switch to Over 1.5.
    {
      const safeUnder=under35Safety();
      if(safeUnder)candidates.push(candidate("UNDER_3_5","under35","UNDER_3_5",safeUnder.move>=engine.strongMovement?3:2,safeUnder.ctx,"Under 3.5 passed the final settled-market gates: U3.5 at 1.30 or lower, O1.5 above 1.40, draw at 3.00 or lower and NG at 1.60 or lower."));
      if(n(odds.under35)>1.40){
        const safe=over15Safety();if(safe)candidates.push(candidate("OVER_1_5","over15","UNDER_3_5",1,safe.ctx,"Under 3.5 was above 1.40; Over 1.5 passed the final 1.29, draw-above-3.50 and GG-at-1.60-or-lower gates.",1));
      }
    }

    // 5) Standalone Over 1.5 safety market.
    {
      const safe=over15Safety();if(safe)candidates.push(candidate("OVER_1_5","over15","OVER_1_5",1,safe.ctx,"Over 1.5 passed the final settled-market gates: O1.5 at 1.29 or lower, U3.5 above 1.40, draw above 3.50 and GG at 1.60 or lower."));
    }

    const best=chooseGoalCandidate(candidates);
    if(!best)return noBet("No corrected Rebel goal-market rule passed",{evaluatedOrder:GOAL_DECISION_ORDER.slice()});
    return{market:best.market,sourceKey:best.sourceKey,originalMarket:best.originalMarket,downgradeLevel:best.downgradeLevel,reason:best.reason,movement:best.movement,agreement:best.agreement,bookmakerCount:best.bookmakerCount,confirmations:best.confirmations,contradictions:best.contradictions,decisionOrder:GOAL_DECISION_ORDER.slice()};
  }

  function evaluateFavorite(input,engineName="spartacus"){
    const engine=CONFIG.engines[engineName],rule=CONFIG.favoriteRule[engineName];if(!engine||!rule)throw new Error(`Unknown engine: ${engineName}`);
    const baseError=validateBase(input,engine);if(baseError)return noBet(baseError);
    const rangePass=inRange(input.favoriteOdds,rule.favoriteMin,rule.favoriteMax)&&input.opponentOdds>=rule.opponentMin&&input.drawOdds>rule.drawMinExclusive&&input.under35Odds>=rule.under35Min&&input.bttsNoOdds<=rule.bttsNoMax;
    if(!rangePass)return noBet("Favourite odds range failed");
    const strong=(input.favoriteMovement??0)>=engine.strongMovement&&(input.opponentDrift??0)>=engine.strongMovement;
    const valid=(input.favoriteMovement??0)>=engine.minMovement&&(input.opponentDrift??0)>=engine.minMovement;
    if(strong&&(input.contradictions??0)===0)return{market:"FAVORITE_WIN",reason:"Full favourite rule passed"};
    if(valid)return{market:"FAVORITE_DNB",downgradedFrom:"FAVORITE_WIN",reason:"Direction passed but strength was reduced"};
    if((input.favoriteMovement??0)>=engine.minMovement*.75)return{market:"FAVORITE_DOUBLE_CHANCE",downgradedFrom:"FAVORITE_WIN",reason:"Weak directional support only"};
    return noBet("Favourite movement too weak");
  }

  function booksOf(match){return Array.isArray(match&&match.oddsBooks)?match.oddsBooks:[]}
  function pair(book,key){
    const o=n(book&&((book.opening||book.open||{})[key])),c=n(book&&((book.current||book.odds||{})[key]));
    return o&&c&&o>1&&c>1?{opening:o,current:c}:null;
  }
  function aggregate(match,key,mode="shorten"){
    const rows=booksOf(match).map(b=>pair(b,key)).filter(Boolean);
    if(!rows.length)return{count:0,opening:null,current:n(match&&match.odds&&match.odds[key]),movement:null,agreement:0,stableAgreement:0,driftAgreement:0};
    const shortenChanges=rows.map(r=>movementPercent(r.opening,r.current));
    const driftChanges=rows.map(r=>driftPercent(r.opening,r.current));
    const changes=mode==="drift"?driftChanges:shortenChanges;
    const opening=median(rows.map(r=>r.opening)),current=median(rows.map(r=>r.current));
    const movement=mode==="drift"?driftPercent(opening,current):movementPercent(opening,current);
    const agreement=changes.filter(v=>v!=null&&v>=.005).length/rows.length;
    const stableAgreement=shortenChanges.filter(v=>v!=null&&Math.abs(v)<=.01).length/rows.length;
    const driftAgreement=driftChanges.filter(v=>v!=null&&v>=.005).length/rows.length;
    return{count:rows.length,opening,current,movement,agreement,stableAgreement,driftAgreement,changes};
  }
  function currentOdds(match,key){const a=aggregate(match,key);return a.current??n(match&&match.odds&&match.odds[key])}
  function hasPositiveMove(match,key,min=.01){const a=aggregate(match,key);return a.count>0&&a.movement!=null&&a.movement>=min}
  function quality(match,count,agreement){
    let q=45+Math.min(25,count*4)+Math.min(20,Math.round(agreement*20));
    if(match&&match.oddsUpdatedAt)q+=4;if(match&&match.statsReal)q+=3;if(match&&match.xgReal)q+=3;
    return Math.round(clamp(q,0,96));
  }
  function candidateConfidence(engineName,movement,agreement,confirmations,downgraded){
    const base=engineName==="leonidas"?78:68;
    const score=base+Math.max(0,(movement||0)-CONFIG.engines[engineName].minMovement)*145+Math.max(0,agreement-CONFIG.engines[engineName].minAgreement)*28+Math.max(0,confirmations-CONFIG.engines[engineName].requiredConfirmations)*2-(downgraded?3:0);
    return Math.round(clamp(score,CONFIG.engines[engineName].minConfidence,engineName==="leonidas"?92:86));
  }
  function buildGoalInput(match,engineName){
    const engine=CONFIG.engines[engineName],keys=["draw","over15","over20","over25","over35","under25","under30","under35","bttsYes","bttsNo","fhOver05","fhOver15","fhUnder15","homeOver15","awayOver15","homeOver25","awayOver25","htftXX","htftX1","htftX2"];
    const odds={},movement={},marketStats={};
    for(const key of keys){const stat=aggregate(match,key);marketStats[key]=stat;movement[key]=stat.movement??0;odds[key]=stat.current??n(match&&match.odds&&match.odds[key]);}
    const strong=engine.strongMovement,min=engine.minMovement;
    const stableOrShort=k=>isStableOrShortening(movement[k]);
    const supportedPrice=(k,max)=>n(odds[k])!=null&&n(odds[k])<=max;
    const favoriteTeamOver15Supported=(Math.max(movement.homeOver15||0,movement.awayOver15||0)>=min)||supportedPrice("homeOver15",1.90)||supportedPrice("awayOver15",1.90);
    const bttsYesSupported=(movement.bttsYes||0)>=.01||supportedPrice("bttsYes",1.95);
    const under35Supported=n(odds.under35)!=null&&n(odds.under35)<=1.40&&stableOrShort("under35");
    const slowHtFt=Math.max(movement.htftXX||0,movement.htftX1||0,movement.htftX2||0)>=min;
    const signals={
      over15StrongSupported:n(odds.over15)!=null&&n(odds.over15)<=1.30&&stableOrShort("over15"),
      fhOver15Supported:(supportedPrice("fhOver15",1.95)&&stableOrShort("fhOver15"))||(movement.fhOver15||0)>=.01,
      fhOver15Strong:(movement.fhOver15||0)>=strong,
      fhUnder15Strong:(movement.fhUnder15||0)>=strong,
      favoriteTeamOver15Supported,
      bttsYesSupported,
      bttsYesStrong:(movement.bttsYes||0)>=strong,
      bttsNoStrong:(movement.bttsNo||0)>=strong,
      under35Strong:(movement.under35||0)>=strong,
      under35Supported,
      under25Strong:(movement.under25||0)>=min,
      over25Strong:(movement.over25||0)>=min,
      firstHalfGoalPressureStrong:(movement.fhOver15||0)>=strong||(supportedPrice("fhOver15",1.80)&&(movement.fhOver15||0)>=min),
      teamOver25Major:Math.max(movement.homeOver25||0,movement.awayOver25||0)>=strong,
      majorLowScoringHtFt:slowHtFt&&(movement.fhUnder15||0)>=min,
      lowScoringContradiction:(movement.bttsNo||0)>=strong||(movement.fhUnder15||0)>=strong
    };
    const confirmationsByMarket={
      over35:[signals.fhOver15Supported,signals.bttsYesSupported||signals.favoriteTeamOver15Supported,inRange(n(odds.over25),1.20,1.70),n(odds.under35)>1.60].filter(Boolean).length,
      over25:[signals.over15StrongSupported,isStableOrDrifting(movement.under35),signals.bttsYesSupported,(movement.fhOver05||0)>=.01].filter(Boolean).length,
      under25:[signals.under35Supported,isStableOrDrifting(movement.over25),(movement.fhUnder15||0)>=.01,(movement.bttsNo||0)>=.01,slowHtFt].filter(Boolean).length,
      under35:[(movement.fhUnder15||0)>=.01,(movement.bttsNo||0)>=.01,!isViolentShortening(movement.over25,engine),!signals.teamOver25Major].filter(Boolean).length,
      over15:[(movement.over25||0)>=.01,(movement.fhOver05||0)>=.01,favoriteTeamOver15Supported,(movement.bttsYes||0)>=.01,n(odds.under35)>1.40&&(aggregate(match,"under35","drift").movement||0)>=.005].filter(Boolean).length
    };
    const contradictionsByMarket={
      over35:[signals.under35Strong,signals.bttsNoStrong&&signals.fhUnder15Strong].filter(Boolean).length,
      over25:[signals.bttsNoStrong&&signals.fhUnder15Strong,signals.under35Strong&&(movement.under35||0)>(movement.over25||0)].filter(Boolean).length,
      under25:[signals.firstHalfGoalPressureStrong,signals.over25Strong&&signals.bttsYesStrong].filter(Boolean).length,
      under35:[signals.fhOver15Strong,signals.teamOver25Major,isViolentShortening(movement.over25,engine)].filter(Boolean).length,
      over15:[signals.under25Strong,signals.majorLowScoringHtFt].filter(Boolean).length
    };
    return{bookmakerCount:Math.max(...Object.values(marketStats).map(x=>x.count),0),bookmakerAgreement:0,confirmations:0,contradictions:0,odds,movement,marketStats,signals,confirmationsByMarket,contradictionsByMarket,majorContradictions:0};
  }
  function analyzeGoals(match,engineName){
    const engine=CONFIG.engines[engineName],input=buildGoalInput(match,engineName),result=evaluateGoalMarket(input,engineName);
    if(result.market==="NO_BET")return null;
    const finalKey={OVER_3_5:"over35",OVER_2_5:"over25",OVER_2_0_ASIAN:"over20",UNDER_2_5:"under25",UNDER_3_0_ASIAN:"under30",UNDER_3_5:"under35",OVER_1_5:"over15"}[result.market];
    const sourceKey=result.sourceKey||finalKey,source=aggregate(match,sourceKey),finalStat=finalKey?aggregate(match,finalKey):source;
    const movement=n(result.movement)??source.movement??0,agreement=n(result.agreement)??source.agreement??0,bookmakerCount=Number(result.bookmakerCount||source.count||0),confirmations=Number(result.confirmations||0),contradictions=Number(result.contradictions||0);
    if(bookmakerCount<engine.minBookmakers||agreement<engine.minAgreement)return null;
    return{
      market:MARKET_LABELS[result.market],movement,agreement,bookmakerCount,confirmations,contradictions,reason:result.reason,downgraded:Number(result.downgradeLevel||0)>0,
      originalMarket:MARKET_LABELS[result.originalMarket]||result.originalMarket,finalMarket:MARKET_LABELS[result.market],downgradeLevel:Number(result.downgradeLevel||0),
      openingOdds:source.opening,currentOdds:(finalStat&&finalStat.current)||source.current,sourceMarket:sourceKey,classification:engineName==="leonidas"?(movement>=.08?"Leonidas Supreme":movement>=.06?"Leonidas Protected":"Leonidas Shield"):(movement>=.06?"Spartacus Strong":"Spartacus Protected")
    };
  }

  function favoriteConfirmations(match,side){
    const fav=side==="home"?"home":"away",opp=side==="home"?"away":"home",dnb=side==="home"?"homeDnb":"awayDnb",dc=side==="home"?"dc1x":"dcx2",htftA=side==="home"?"htft11":"htft22",htftB=side==="home"?"htftX1":"htftX2";
    let confirmations=0,contradictions=0;
    const favMove=aggregate(match,fav).movement||0,oppDrift=aggregate(match,opp,"drift").movement||0,drawDrift=aggregate(match,"draw","drift").movement||0;
    if(oppDrift>=.02)confirmations++;
    if(drawDrift>=.015)confirmations++;
    if(favMove>=.02&&oppDrift>=.02)confirmations++;
    if(hasPositiveMove(match,dnb,.01)||currentOdds(match,dnb))confirmations++;
    if(hasPositiveMove(match,dc,.01)||currentOdds(match,dc))confirmations++;
    if(hasPositiveMove(match,htftA,.01)||hasPositiveMove(match,htftB,.01))confirmations++;
    if(n(match.odds&&match.odds.under35)>=1.40&&n(match.odds&&match.odds.bttsNo)<=1.70)confirmations++;
    if(hasPositiveMove(match,"draw",.05))contradictions++;
    if(favMove<-.02)contradictions++;
    return{confirmations,contradictions};
  }
  function analyzeFavorite(match,engineName){
    const engine=CONFIG.engines[engineName],home=currentOdds(match,"home"),away=currentOdds(match,"away"),draw=currentOdds(match,"draw");
    if(!home||!away||!draw)return null;
    const side=home<=away?"home":"away",favKey=side,oppKey=side==="home"?"away":"home";
    const fav=aggregate(match,favKey),opp=aggregate(match,oppKey,"drift"),confirm=favoriteConfirmations(match,side);
    const input={bookmakerCount:Math.min(fav.count,opp.count),bookmakerAgreement:Math.min(fav.agreement,opp.agreement),confirmations:confirm.confirmations,contradictions:confirm.contradictions,favoriteOdds:side==="home"?home:away,opponentOdds:side==="home"?away:home,drawOdds:draw,under35Odds:n(match.odds&&match.odds.under35),bttsNoOdds:n(match.odds&&match.odds.bttsNo),favoriteMovement:fav.movement??0,opponentDrift:opp.movement??0};
    const result=evaluateFavorite(input,engineName);if(result.market==="NO_BET")return null;
    let market;if(result.market==="FAVORITE_WIN")market=side==="home"?"Home Win":"Away Win";else if(result.market==="FAVORITE_DNB")market=side==="home"?"Home DNB":"Away DNB";else market=side==="home"?"Double Chance 1X":"Double Chance X2";
    return{market,movement:fav.movement||0,agreement:input.bookmakerAgreement,bookmakerCount:input.bookmakerCount,confirmations:confirm.confirmations,contradictions:confirm.contradictions,reason:result.reason,downgraded:!!result.downgradedFrom};
  }
  function recommend(match,engineName){
    const cfg=CONFIG.engines[engineName],label=engineName==="leonidas"?"Leonidas":"Spartacus";
    if(!cfg)return{bet:false,engine:label,version:VERSION,primary:"No Bet",confidence:0,reasons:["Unknown rebel engine."],warnings:[]};
    const books=booksOf(match);if(books.length<cfg.minBookmakers)return{bet:false,engine:label,version:VERSION,primary:"No Bet",confidence:0,reasons:[`${books.length} bookmaker snapshots are available; ${cfg.minBookmakers} are required.`],warnings:["Rebel engines require timestamped opening and current odds."],dataQuality:quality(match,books.length,0),rebel:true};
    const candidates=[analyzeFavorite(match,engineName),analyzeGoals(match,engineName)].filter(Boolean);
    if(!candidates.length)return{bet:false,engine:label,version:VERSION,primary:"No Bet",confidence:0,reasons:["No favourite or goal movement rule cleared the rebel gate."],warnings:["Missing multi-book market history causes abstention rather than estimation."],dataQuality:quality(match,books.length,0),rebel:true};
    for(const c of candidates)c.confidence=candidateConfidence(engineName,c.movement,c.agreement,c.confirmations,c.downgraded);
    candidates.sort((a,b)=>b.confidence-a.confidence||b.confirmations-a.confirmations||b.agreement-a.agreement);
    const best=candidates[0];if(best.confidence<cfg.minConfidence)return{bet:false,engine:label,version:VERSION,primary:"No Bet",confidence:0,reasons:["Movement confidence is below the public rebel threshold."],warnings:[],dataQuality:quality(match,best.bookmakerCount,best.agreement),rebel:true};
    const reasons=[best.reason,`${Math.round(best.agreement*100)}% of ${best.bookmakerCount} bookmakers support the move.`,`${Math.round(best.movement*1000)/10}% price movement with ${best.confirmations} related confirmation${best.confirmations===1?"":"s"}.`];
    const warnings=[];if(best.downgraded)warnings.push(`The original market was downgraded ${best.downgradeLevel===2?"two levels":"one level"} by the Rebel safety ladder.`);if(best.contradictions)warnings.push(`${best.contradictions} mild contradiction remains.`);
    return{
      bet:true,engine:label,version:VERSION,primary:best.market,confidence:best.confidence,reasons,warnings,
      dataQuality:quality(match,best.bookmakerCount,best.agreement),rebel:true,bookmakerCount:best.bookmakerCount,bookmakerAgreement:best.agreement,movement:best.movement,confirmations:best.confirmations,contradictions:best.contradictions||0,
      originalMarket:best.originalMarket||best.market,finalMarket:best.finalMarket||best.market,downgradeLevel:best.downgradeLevel||0,openingOdds:best.openingOdds??null,currentOdds:best.currentOdds??null,classification:best.classification||null,sourceMarket:best.sourceMarket||null
    };
  }
  const spartacusRecommend=match=>recommend(match,"spartacus");
  const leonidasRecommend=match=>recommend(match,"leonidas");

  return{VERSION,CONFIG,movementPercent,evaluateGoalMarket,evaluateFavorite,spartacusRecommend,leonidasRecommend,analyzeMarketSnapshots:aggregate};
});
