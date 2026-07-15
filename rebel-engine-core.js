(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.2.0";
  const CONFIG={
    engines:{
      spartacus:{minBookmakers:3,minAgreement:.55,minMovement:.04,strongMovement:.06,requiredConfirmations:1,maxMildContradictions:1,minConfidence:68},
      leonidas:{minBookmakers:5,minAgreement:.70,minMovement:.06,strongMovement:.08,requiredConfirmations:2,maxMildContradictions:1,minConfidence:78}
    },
    goalMarkets:{
      over15:{maxOdds:1.30},
      over25:{minOdds:1.20,maxOdds:1.70,requiresUnder35Above:1.60},
      under25:{minOdds:1.20,maxOdds:1.70,requiresOver15Above:1.60},
      under35:{maxOdds:1.40,fallback:"over15"},
      over35:{minOdds:1.20,maxOddsExclusive:1.90,requiresUnder35Above:1.60}
    },
    favoriteRule:{
      spartacus:{favoriteMin:1.20,favoriteMax:1.55,opponentMin:5.00,drawMinExclusive:3.60,under35Min:1.40,bttsNoMax:1.70},
      leonidas:{favoriteMin:1.20,favoriteMax:1.50,opponentMin:5.50,drawMinExclusive:3.60,under35Min:1.40,bttsNoMax:1.70}
    }
  };
  const MARKET_LABELS={
    OVER_1_5:"Over 1.5 Goals",OVER_2_5:"Over 2.5 Goals",OVER_3_5:"Over 3.5 Goals",
    UNDER_2_5:"Under 2.5 Goals",UNDER_3_5:"Under 3.5 Goals"
  };
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

  function evaluateGoalMarket(input,engineName="spartacus"){
    const engine=CONFIG.engines[engineName];if(!engine)throw new Error(`Unknown engine: ${engineName}`);
    const baseError=validateBase(input,engine);if(baseError)return noBet(baseError);
    const odds=input.odds??{},movement=input.movement??{},g=CONFIG.goalMarkets;
    if(Number.isFinite(odds.over35)&&odds.over35>=g.over35.minOdds&&odds.over35<g.over35.maxOddsExclusive&&inRange(odds.over25,g.over25.minOdds,g.over25.maxOdds)&&odds.under35>g.over35.requiresUnder35Above&&(movement.over35??0)>=engine.minMovement)return{market:"OVER_3_5",reason:"Over 3.5 passed the full corrected rule"};
    if(inRange(odds.over25,g.over25.minOdds,g.over25.maxOdds)&&odds.under35>g.over25.requiresUnder35Above&&(movement.over25??0)>=engine.minMovement)return{market:"OVER_2_5",reason:"Over 2.5 passed range and Under 3.5 confirmation"};
    if(inRange(odds.under25,g.under25.minOdds,g.under25.maxOdds)&&odds.over15>g.under25.requiresOver15Above&&(movement.under25??0)>=engine.minMovement)return{market:"UNDER_2_5",reason:"Under 2.5 passed range and Over 1.5 confirmation"};
    if(Number.isFinite(odds.under35)&&odds.under35<=g.under35.maxOdds&&(movement.under35??0)>=0)return{market:"UNDER_3_5",reason:"Under 3.5 is at or below 1.40"};
    if(Number.isFinite(odds.under35)&&odds.under35>g.under35.maxOdds&&Number.isFinite(odds.over15)&&odds.over15<=g.over15.maxOdds)return{market:"OVER_1_5",downgradedFrom:"UNDER_3_5",reason:"Under 3.5 exceeded 1.40; automatic switch to Over 1.5 at 1.30 or lower"};
    if(Number.isFinite(odds.over15)&&odds.over15<=g.over15.maxOdds)return{market:"OVER_1_5",reason:"Higher goal line failed; safety downgrade passed"};
    return noBet("No corrected goal-market rule passed");
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
    if(!rows.length)return{count:0,opening:null,current:n(match&&match.odds&&match.odds[key]),movement:null,agreement:0};
    const changes=rows.map(r=>mode==="drift"?driftPercent(r.opening,r.current):movementPercent(r.opening,r.current));
    const opening=median(rows.map(r=>r.opening)),current=median(rows.map(r=>r.current));
    const movement=mode==="drift"?driftPercent(opening,current):movementPercent(opening,current);
    const agreement=changes.filter(v=>v!=null&&v>=.005).length/rows.length;
    return{count:rows.length,opening,current,movement,agreement,changes};
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
  function goalConfirmations(match,market){
    const odds=match.odds||{};let c=0,contradictions=0;
    if(market==="over25"||market==="over35"||market==="over15"){
      if(n(odds.under35)>1.60)c++;
      if(n(odds.bttsYes)&&n(odds.bttsYes)<=1.95)c++;
      if(hasPositiveMove(match,"bttsYes",.01))c++;
      if(market!=="over15"&&hasPositiveMove(match,"over15",.01))c++;
      if(market!=="over25"&&hasPositiveMove(match,"over25",.01))c++;
      if(market!=="over35"&&hasPositiveMove(match,"over35",.01))c++;
      if((aggregate(match,"under25","drift").movement||0)>=.02||(aggregate(match,"under35","drift").movement||0)>=.02)c++;
      if(hasPositiveMove(match,"under25",.03)||hasPositiveMove(match,"bttsNo",.04))contradictions++;
    }else{
      if(n(odds.under35)&&n(odds.under35)<=1.40)c++;
      if(n(odds.bttsNo)&&n(odds.bttsNo)<=1.85)c++;
      if(hasPositiveMove(match,"bttsNo",.01))c++;
      if(market!=="under25"&&hasPositiveMove(match,"under25",.01))c++;
      if(market!=="under35"&&hasPositiveMove(match,"under35",.01))c++;
      if((aggregate(match,"over25","drift").movement||0)>=.02||(aggregate(match,"over35","drift").movement||0)>=.02)c++;
      if(hasPositiveMove(match,"over25",.04)||hasPositiveMove(match,"bttsYes",.04))contradictions++;
    }
    return{confirmations:c,contradictions};
  }
  function analyzeGoals(match,engineName){
    const engine=CONFIG.engines[engineName],odds={};
    for(const k of ["over15","over25","over35","under25","under35"])odds[k]=currentOdds(match,k);
    const movement={};for(const k of Object.keys(odds))movement[k]=aggregate(match,k).movement??0;
    const priority=["over35","over25","under25","under35","over15"];
    const primary=priority.map(k=>({key:k,a:aggregate(match,k)})).filter(x=>x.a.count>=engine.minBookmakers).sort((a,b)=>(b.a.movement||0)-(a.a.movement||0))[0];
    if(!primary)return null;
    const confirm=goalConfirmations(match,primary.key);
    const input={bookmakerCount:primary.a.count,bookmakerAgreement:primary.a.agreement,confirmations:confirm.confirmations,contradictions:confirm.contradictions,odds,movement};
    const result=evaluateGoalMarket(input,engineName);if(result.market==="NO_BET")return null;
    const resultKey={OVER_3_5:"over35",OVER_2_5:"over25",UNDER_2_5:"under25",UNDER_3_5:"under35",OVER_1_5:"over15"}[result.market];
    const a=aggregate(match,resultKey);
    if(a.count<engine.minBookmakers||a.agreement<engine.minAgreement)return null;
    const related=goalConfirmations(match,resultKey);
    if(related.confirmations<engine.requiredConfirmations||related.contradictions>engine.maxMildContradictions)return null;
    return{market:MARKET_LABELS[result.market],movement:a.movement||0,agreement:a.agreement,bookmakerCount:a.count,confirmations:related.confirmations,contradictions:related.contradictions,reason:result.reason,downgraded:!!result.downgradedFrom};
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
    const warnings=[];if(best.downgraded)warnings.push("The aggressive market was downgraded by the rebel safety ladder.");if(best.contradictions)warnings.push(`${best.contradictions} mild contradiction remains.`);
    return{bet:true,engine:label,version:VERSION,primary:best.market,confidence:best.confidence,reasons,warnings,dataQuality:quality(match,best.bookmakerCount,best.agreement),rebel:true,bookmakerCount:best.bookmakerCount,bookmakerAgreement:best.agreement,movement:best.movement,confirmations:best.confirmations};
  }
  const spartacusRecommend=match=>recommend(match,"spartacus");
  const leonidasRecommend=match=>recommend(match,"leonidas");

  return{VERSION,CONFIG,movementPercent,evaluateGoalMarket,evaluateFavorite,spartacusRecommend,leonidasRecommend,analyzeMarketSnapshots:aggregate};
});
