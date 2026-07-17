(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.BetynzAudit=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERSION="5.6.0";
const finite=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
const norm=v=>String(v||"").trim();
function fixtureKey(m){return String(m&&m.id!=null?m.id:`${norm(m&&m.home)}|${norm(m&&m.away)}|${norm(m&&m.matchDate||m&&m.kickoff)}`)}
function auditPrediction(engine,out,match,quarantine={}){
 const checks=[];const add=(name,pass,detail,severity="hard")=>checks.push({name,pass:!!pass,detail,severity});
 add("Fixture identity",!!(match&&match.home&&match.away),"Both teams must be identified.");
 add("Kickoff",!!(match&&match.kickoff),"A valid kickoff is required.");
 const p=out&&out.ppgAgreement;
 add("Overall/split PPG agreement",!!(p&&p.pass),p&&p.reason||"PPG agreement evidence is unavailable.");
 add("Data quality",finite(out&&out.dataQuality)&&Number(out.dataQuality)>=54,`Data quality ${finite(out&&out.dataQuality)?Number(out.dataQuality):"missing"}/100.`);
 add("Engine not quarantined",!quarantine[engine],quarantine[engine]?`Quarantined: ${quarantine[engine].reason||"manual reliability hold"}.`:"Engine is active.");
 if(out&&out.bet){add("Final market",norm(out.primary)&&out.primary!=="No Bet",`Final market: ${out.primary||"missing"}.`);add("Confidence",finite(out.confidence)&&Number(out.confidence)>=1,`Confidence: ${finite(out.confidence)?Number(out.confidence):"missing"}.`);}
 const hardFails=checks.filter(x=>!x.pass&&x.severity==="hard");
 return {version:VERSION,fixtureId:fixtureKey(match),engine,status:hardFails.length?"REJECTED":out&&out.bet?"APPROVED":"NO_BET",passed:hardFails.length===0,checks,failedRules:hardFails.map(x=>x.name),reasons:(out&&out.reasons)||[],warnings:(out&&out.warnings)||[],market:out&&out.bet?out.primary:"No Bet",confidence:Number(out&&out.confidence||0)};
}
function enforceQuarantine(engine,out,match,quarantine={}){
 const audit=auditPrediction(engine,out,match,quarantine);
 if(quarantine[engine]&&out&&out.bet){return{output:{...out,bet:false,primary:"No Bet",confidence:0,reasons:[`Engine ${engine} is temporarily quarantined: ${quarantine[engine].reason||"reliability review"}.`],warnings:[...(out.warnings||[]),"Selection withheld by the v5.6 reliability supervisor."],audit},audit};}
 return{output:{...out,audit},audit};
}
function summarize(rows){
 const all=rows.flatMap(r=>Object.values(r.audits||{}));const approved=all.filter(x=>x.status==="APPROVED").length,rejected=all.filter(x=>x.status==="REJECTED").length,noBet=all.filter(x=>x.status==="NO_BET").length;
 const failures={};all.forEach(a=>a.failedRules.forEach(f=>failures[f]=(failures[f]||0)+1));
 const engines={};all.forEach(a=>{const e=engines[a.engine]||(engines[a.engine]={approved:0,rejected:0,noBet:0,total:0});e.total++;if(a.status==="APPROVED")e.approved++;else if(a.status==="REJECTED")e.rejected++;else e.noBet++;});
 return{version:VERSION,generatedAt:new Date().toISOString(),fixtures:rows.length,evaluations:all.length,approved,rejected,noBet,topFailures:Object.entries(failures).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([rule,count])=>({rule,count})),engines};
}
return{VERSION,fixtureKey,auditPrediction,enforceQuarantine,summarize};
});
