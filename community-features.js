(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v==null?"":v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const load=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch(_){return f}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const engines=[
    ["zeus","Zeus","⚡"],["athena","Athena","♙"],["apollo","Apollo","☀"],["ares","Ares","⚔"],["poseidon","Poseidon","♆"],["hermes","Hermes","☿"],["hera","Hera","♕"],["artemis","Artemis","☾"],["hephaestus","Hephaestus","⚒"],["demeter","Demeter","❦"],["dionysus","Dionysus","♢"],["hades","Hades","♜"],["atlas","Atlas","◉"],["orion","Orion","✦"],["nike","Nike","✧"],["prometheus","Prometheus","♨"],["spartacus","Spartacus","⛓"],["leonidas","Leonidas","Λ"]
  ];
  const backend=window.BetynzBackend||null;
  let follows=load("betynz-follows",[]), activity=load("betynz-activity-days",[]), notices=load("betynz-notification-center",[]), currentPick=null;
  let remoteReady=false;

  function account(){return load("betynz-account",{signedIn:false,name:"Guest"})}
  function backendReady(){return !!(backend&&backend.configured&&backend.configured())}
  function toast(message){const el=$("#toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove("show"),2600)}
  function slug(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
  function today(){return new Date().toISOString().slice(0,10)}
  function dateLabel(v){try{return new Date(v).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(_){return v}}
  function followed(type,key){return follows.some(x=>x.itemType===type&&x.itemKey===key)}
  function upsertFollow(itemType,itemKey,label){
    if(followed(itemType,itemKey))follows=follows.filter(x=>!(x.itemType===itemType&&x.itemKey===itemKey));
    else follows.push({itemType,itemKey,label,createdAt:new Date().toISOString()});
    save("betynz-follows",follows);renderCommunity();renderFavoriteShortcuts();decorateEngineCards();syncFollow(itemType,itemKey,label);
  }
  async function syncFollow(type,key,label){
    if(!backendReady()||!account().signedIn)return;
    try{if(followed(type,key))await backend.setFollow(type,key,label);else await backend.removeFollow(type,key)}catch(err){console.warn(err);toast("Follow saved on this device; cloud sync is unavailable.")}
  }
  function calculateStreak(days){
    const set=new Set(days), d=new Date();let n=0;
    while(set.has(d.toISOString().slice(0,10))){n++;d.setUTCDate(d.getUTCDate()-1)}
    return n;
  }
  async function recordActivity(){
    if(!activity.includes(today())){activity.push(today());activity=activity.slice(-400);save("betynz-activity-days",activity)}
    if(backendReady()&&account().signedIn){try{await backend.recordActivity()}catch(_){}}
  }
  function addNotice(id,title,body,view="dashboard"){
    if(notices.some(n=>n.id===id))return;
    notices.unshift({id,title,body,view,createdAt:new Date().toISOString(),read:false});notices=notices.slice(0,60);save("betynz-notification-center",notices);renderNotificationCenter();
  }
  function seedNotices(){
    const meta=window.BETYNZ_META||{}, matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
    if(meta.generatedAt)addNotice(`data-${meta.generatedAt}`,"Board updated",`${meta.qualifiedCount??"New"} qualified selections in the latest snapshot.`,"picks");
    const live=matches.filter(m=>["1H","HT","2H","ET","BT","P","LIVE"].includes(String(m.status||"").toUpperCase()));
    if(live.length)addNotice(`live-${today()}-${live.length}`,`${live.length} live game${live.length===1?"":"s"}`,"Open the board for current scores.","picks");
  }
  function renderNotificationCenter(){
    const unread=notices.filter(n=>!n.read).length, badge=$("#notification-unread"),feed=$("#notification-feed");if(badge){badge.textContent=String(unread);badge.hidden=unread===0}
    if(feed)feed.innerHTML=notices.length?notices.map(n=>`<button type="button" class="notification-feed-item ${n.read?"":"unread"}" data-notice-id="${esc(n.id)}" data-view="${esc(n.view||"dashboard")}"><span></span><div><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${esc(dateLabel(n.createdAt))}</small></div></button>`).join(""):`<div class="empty-state"><b>All quiet</b>No new Betynz updates.</div>`;
  }
  function setNotificationDrawer(open){$("#notification-drawer")?.classList.toggle("open",open);$("#notification-drawer-backdrop")?.classList.toggle("open",open)}

  function onboardingStep(step){
    const pages=[
      {icon:"⚡",eyebrow:"WELCOME TO BETYNZ",title:"Predict Smarter. <mark>Let the Gods Decide.</mark>",copy:"Betynz combines 16 Olympian specialists, two Rebel odds-movement engines and Zeus consensus to filter supported football fixtures.",features:[["18","Specialist engines"],["⚡","Zeus final gate"],["◆","No Bet protection"],["✓","Transparent settlement"]]},
      {icon:"▦",eyebrow:"THE MATCH BOARD",title:"Read every pick in <mark>one clear card.</mark>",copy:"Each card shows the teams, approved market, current odds, grade, confidence, kickoff time and supporting engines. Use the filters to narrow the board.",features:[["A1","Strictest grade"],["A2","Strong qualified pick"],["LIVE","Current score"],["+","Save to your list"]]},
      {icon:"♜",eyebrow:"SPECIALISTS FIRST",title:"Engines analyse. <mark>Zeus decides.</mark>",copy:"Olympian engines study form, PPG, splits, goals, defence and context. Spartacus and Leonidas inspect market movement. Zeus rejects conflicts before publication.",features:[["PPG","Overall + split"],["xG","Chance quality"],["ODDS","Market evidence"],["NO BET","Conflict control"]]},
      {icon:"◎",eyebrow:"TAP ANY MATCH",title:"See exactly <mark>why it qualified.</mark>",copy:"Open a match to review PPG direction, league environment, odds, engine agreement, passed rules, warnings, downgrades and rejection safeguards.",features:[["↗","Direction check"],["◇","Odds support"],["▤","Audit trail"],["!","Contradictions"]]},
      {icon:"●",eyebrow:"LIVE TO SETTLED",title:"Follow the score. <mark>Verify the result.</mark>",copy:"Live matches show the current minute and score. Finished picks settle as Won, Lost or Void and remain in the public record.",features:[["LIVE","Minute + score"],["W","Won"],["L","Lost"],["V","Void"]]},
      {icon:"18+",eyebrow:"USE IT RESPONSIBLY",title:"Analysis is helpful. <mark>Nothing is guaranteed.</mark>",copy:"Betynz is informational analysis for adults. Review the full record, take breaks and never treat a prediction as certain.",features:[["✓","Complete records"],["⏱","Take breaks"],["◇","No guarantees"],["○","Free access"]]}
    ];
    const page=pages[step],modal=$("#onboarding-modal"),content=$("#onboarding-content");if(!modal||!content)return;
    content.innerHTML=`<div class="onboarding-shell"><div class="onboarding-card"><div class="onboarding-brand"><img src="assets/betynz-mark.png" alt=""><div><strong>BETYNZ<span>.com</span></strong><small>LET THE GODS DECIDE.</small></div></div><div class="onboarding-progress">${pages.map((_,i)=>`<i class="${i===step?"active":""}"></i>`).join("")}</div><span class="onboarding-step-label">${page.eyebrow}</span><span class="onboarding-icon">${page.icon}</span><h2 id="onboarding-title">${page.title}</h2><p>${page.copy}</p><div class="onboarding-features">${page.features.map(([icon,label])=>`<span><i>${icon}</i>${label}</span>`).join("")}</div><div class="onboarding-actions">${step?'<button type="button" class="secondary-btn" data-onboarding-back>Back</button>':'<button type="button" class="secondary-btn" data-onboarding-skip>Skip</button>'}<button type="button" class="primary-btn" data-onboarding-next="${step}">${step===pages.length-1?"Enter Betynz":"Continue"}</button><span class="onboarding-counter">${step+1} / ${pages.length}</span></div></div></div>`;
  }
  function openOnboarding(force=false){if(!force&&localStorage.getItem("betynz-onboarding-v57"))return;$("#onboarding-backdrop").hidden=false;$("#onboarding-modal").hidden=false;document.body.classList.add("onboarding-open");onboardingStep(0)}
  function closeOnboarding(){localStorage.setItem("betynz-onboarding-v57","done");$("#onboarding-backdrop").hidden=true;$("#onboarding-modal").hidden=true;document.body.classList.remove("onboarding-open")}

  function availableValues(field){return [...new Set((window.MATCHES||[]).map(m=>m&&m[field]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)))}
  function renderCommunity(){
    const root=$("#community-content");if(!root)return;
    const leagues=availableValues("league"),teams=[...new Set([...(window.MATCHES||[]).map(m=>m.home),...(window.MATCHES||[]).map(m=>m.away)].filter(Boolean))].sort();
    const streak=calculateStreak(activity), followedEngines=follows.filter(x=>x.itemType==="engine").length;
    root.innerHTML=`<div class="community-metrics"><article><small>Visit streak</small><b>${streak}</b><em>day${streak===1?"":"s"}</em></article><article><small>Engines followed</small><b>${followedEngines}</b><em>of 18</em></article><article><small>Favourite leagues</small><b>${follows.filter(x=>x.itemType==="league").length}</b><em>saved</em></article><article><small>Favourite teams</small><b>${follows.filter(x=>x.itemType==="team").length}</b><em>saved</em></article></div>
      <section class="page-panel community-section"><div class="panel-title"><div><h3>Follow engines</h3><p>Following changes your shortcuts and alerts, not Zeus decisions.</p></div></div><div class="community-engine-grid">${engines.map(([id,name,glyph])=>`<button type="button" class="follow-engine-card ${followed("engine",id)?"followed":""}" data-follow-type="engine" data-follow-key="${id}" data-follow-label="${name}"><span>${glyph}</span><b>${name}</b><small>${followed("engine",id)?"Following":"Follow"}</small></button>`).join("")}</div></section>
      <div class="community-two-col"><section class="page-panel community-section"><h3>Favourite leagues</h3><div class="favorite-adder"><select id="community-league-select"><option value="">Choose a league</option>${leagues.map(x=>`<option value="${esc(slug(x))}" data-label="${esc(x)}">${esc(x)}</option>`).join("")}</select><button type="button" class="primary-btn compact" data-add-community-favorite="league">Add</button></div><div class="favorite-chip-list">${follows.filter(x=>x.itemType==="league").map(x=>`<button type="button" data-follow-type="league" data-follow-key="${esc(x.itemKey)}" data-follow-label="${esc(x.label)}">${esc(x.label)} ×</button>`).join("")||'<small>No favourite leagues yet.</small>'}</div></section>
      <section class="page-panel community-section"><h3>Favourite teams</h3><div class="favorite-adder"><select id="community-team-select"><option value="">Choose a team</option>${teams.map(x=>`<option value="${esc(slug(x))}" data-label="${esc(x)}">${esc(x)}</option>`).join("")}</select><button type="button" class="primary-btn compact" data-add-community-favorite="team">Add</button></div><div class="favorite-chip-list">${follows.filter(x=>x.itemType==="team").map(x=>`<button type="button" data-follow-type="team" data-follow-key="${esc(x.itemKey)}" data-follow-label="${esc(x.label)}">${esc(x.label)} ×</button>`).join("")||'<small>No favourite teams yet.</small>'}</div></section></div>
      <section class="page-panel community-guidelines"><span>♧</span><div><h3>Community standard</h3><p>Discuss the evidence, not other people. No guaranteed-win claims, harassment, spam or requests for private payment details.</p></div></section>`;
  }
  function renderFavoriteShortcuts(){
    const root=$("#favorite-shortcuts");if(!root)return;const items=follows.filter(x=>x.itemType==="league"||x.itemType==="team").slice(0,8);
    root.innerHTML=items.length?`<small>FAVOURITES</small>${items.map(x=>`<button type="button" data-favorite-search="${esc(x.label)}">${x.itemType==="team"?"☆":"▦"} ${esc(x.label)}</button>`).join("")}`:`<small>FAVOURITES</small><button type="button" data-view="community">Add teams or leagues</button>`;
  }
  function decorateEngineCards(){
    $$('.engine-card[data-engine-picks]').forEach(card=>{const id=card.dataset.enginePicks,name=engines.find(x=>x[0]===id)?.[1]||id;let btn=card.querySelector('.engine-follow-btn');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='engine-follow-btn';btn.dataset.followType='engine';btn.dataset.followKey=id;btn.dataset.followLabel=name;card.appendChild(btn)}btn.classList.toggle('followed',followed('engine',id));btn.textContent=followed('engine',id)?'★ Following':'☆ Follow';});
  }

  function normalizeResult(v){const s=String(v||"").toLowerCase();if(["won","win","w"].includes(s))return"won";if(["lost","loss","l"].includes(s))return"lost";if(["void","push","v"].includes(s))return"void";return""}
  function engineRecord(name){
    const rows=(window.BETYNZ_HISTORY||[]).filter(r=>{const e=String(r.engine||r.engineName||r.sourceEngine||"").toLowerCase();return e===name.toLowerCase()});
    let won=0,lost=0,voided=0;rows.forEach(r=>{const x=normalizeResult(r.result||r.outcome||r.settlement);if(x==="won")won++;else if(x==="lost")lost++;else if(x==="void")voided++});return{won,lost,voided,total:won+lost+voided};
  }
  function renderPerformance(){
    const root=$("#performance-content");if(!root)return;
    const cards=engines.map(([id,name,glyph])=>{const r=engineRecord(name),decided=r.won+r.lost,rate=decided?Math.round(r.won/decided*100):null;return `<article class="performance-card"><div><span>${glyph}</span><div><h3>${name}</h3><small>${id==="spartacus"||id==="leonidas"?"REBEL":"OLYMPIAN"}</small></div></div><div class="performance-rate"><b>${rate==null?"—":rate+"%"}</b><small>${rate==null?"Awaiting verified sample":"Win rate excluding voids"}</small></div><dl><div><dt>Settled</dt><dd>${r.total}</dd></div><div><dt>Won</dt><dd>${r.won}</dd></div><div><dt>Lost</dt><dd>${r.lost}</dd></div><div><dt>Void</dt><dd>${r.voided}</dd></div></dl><button type="button" data-engine-picks="${id}">View ${name} picks</button></article>`}).join("");
    root.innerHTML=`<section class="performance-notice"><span>✓</span><div><b>Only settled records count</b><p>No synthetic performance, no projected wins and no hiding engines with zero verified samples.</p></div></section><div class="performance-grid">${cards}</div>`;
  }
  async function renderHealth(){
    const root=$("#health-content");if(!root)return;root.innerHTML='<div class="health-loading">Checking the public data snapshot…</div>';
    const meta=window.BETYNZ_META||{}, generated=meta.generatedAt?new Date(meta.generatedAt):null,age=generated&&Number.isFinite(generated.getTime())?(Date.now()-generated.getTime())/36e5:null,matches=window.MATCHES||[];
    let api={};try{const r=await fetch(`api-status.json?t=${Date.now()}`,{cache:"no-store"});if(r.ok)api=await r.json()}catch(_){}
    const live=matches.filter(m=>["1H","HT","2H","ET","BT","P","LIVE"].includes(String(m.status||"").toUpperCase())).length;
    const stale=age==null||age>12, oddsReady=matches.filter(m=>m.odds||m.marketOdds||m.oddsBooks).length, reliability=meta.reliability||{};
    const checks=[
      [stale?"warn":"ok","Data snapshot",generated?`${generated.toLocaleString()} · ${age.toFixed(1)}h old`:"No generation timestamp"],
      [matches.length?"ok":"warn","Fixtures",`${matches.length} loaded · ${live} live`],
      [oddsReady?"ok":"warn","Odds coverage",`${oddsReady} fixtures include odds evidence`],
      [meta.qualifiedCount||0?"ok":"info","Qualified board",`${meta.qualifiedCount??"—"} selections`],
      [api.error?"warn":"ok","Public API status",api.error||api.status||api.message||"No reported error"],
      [navigator.onLine?"ok":"warn","Device connection",navigator.onLine?"Online":"Offline"]
    ];
    root.innerHTML=`<div class="health-overview ${stale?"warning":"healthy"}"><span>${stale?"!":"✓"}</span><div><small>CURRENT STATUS</small><h3>${stale?"Attention recommended":"Core public snapshot is healthy"}</h3><p>${stale?"The data snapshot is missing or older than 12 hours. Run the main GitHub workflow.":"Fixtures and the latest board snapshot are available."}</p></div></div><div class="health-grid">${checks.map(([state,title,copy])=>`<article class="health-card ${state}"><i></i><small>${title}</small><b>${esc(copy)}</b></article>`).join("")}</div><section class="page-panel reliability-panel"><div class="panel-title"><div><h3>Engine reliability audit</h3><p>Every fixture is traced through the publication gates before it reaches the board.</p></div><span class="plan-pill">Audit v${esc(meta.auditVersion||"5.6.0")}</span></div><div class="reliability-metrics"><article><small>Evaluations</small><b>${reliability.evaluations??0}</b></article><article><small>Approved</small><b>${reliability.approved??0}</b></article><article><small>Rejected</small><b>${reliability.rejected??0}</b></article><article><small>No Bet</small><b>${reliability.noBet??0}</b></article></div><div class="audit-failures"><h4>Most common hard failures</h4>${(reliability.topFailures||[]).length?(reliability.topFailures||[]).map(x=>`<div><span>${esc(x.rule)}</span><b>${x.count}</b></div>`).join(""):"<p>No hard-failure summary is available yet. Run the main workflow.</p>"}</div>${(meta.quarantinedEngines||[]).length?`<div class="quarantine-warning"><b>Quarantined engines:</b> ${esc(meta.quarantinedEngines.join(", "))}</div>`:""}</section><section class="page-panel health-actions"><h3>Recovery order</h3><p>1. Run <b>Smart Global Coverage and Deep Enrichment</b>. 2. Review rejected rules and quarantined engines here. 3. Run <b>Refresh Live & Finished Scores and Deploy</b> for settlements.</p></section><section id="admin-overview" class="page-panel admin-overview" hidden></section>`;
    if(account().isAdmin&&backendReady())try{const a=await backend.adminOverview();const admin=$("#admin-overview");if(admin&&a){admin.hidden=false;admin.innerHTML=`<div class="panel-title"><div><h3>Secure admin overview</h3><p>Visible only to accounts marked as administrators in Supabase.</p></div></div><div class="admin-metrics"><article><small>Users</small><b>${a.users??0}</b></article><article><small>Active 7 days</small><b>${a.active_7d??0}</b></article><article><small>Comments</small><b>${a.comments??0}</b></article><article><small>Comments 24h</small><b>${a.comments_24h??0}</b></article><article><small>Follows</small><b>${a.follows??0}</b></article></div>`}}catch(err){console.warn(err)}
  }

  async function hydrateRemoteFollows(){if(!backendReady()||!account().signedIn||remoteReady)return;try{const rows=await backend.follows();if(rows.length){follows=rows.map(x=>({itemType:x.item_type,itemKey:x.item_key,label:x.label,createdAt:x.created_at}));save("betynz-follows",follows)}remoteReady=true;renderCommunity();renderFavoriteShortcuts();decorateEngineCards()}catch(err){console.warn(err)}}

  function reactionStore(){return load("betynz-community-reactions",{})}
  function commentStore(){return load("betynz-community-comments",{})}
  async function loadMatchCommunity(detail){
    currentPick=detail;const shell=$("#match-community-shell");if(!shell)return;
    let comments=(commentStore()[detail.matchKey]||[]),reactions=[];
    if(backendReady()){
      try{const [rc,rr]=await Promise.all([backend.communityComments(detail.matchKey),backend.communityReactions(detail.matchKey)]);comments=rc.map(x=>({...x,displayName:"Betynz Member"}));reactions=rr}catch(err){console.warn(err)}
    }
    renderMatchCommunity(detail,comments,reactions);
  }
  function renderMatchCommunity(detail,comments,reactions){
    const shell=$("#match-community-shell");if(!shell)return;let localReaction=reactionStore()[detail.matchKey]||"";const me=account().id;if(me){const mine=reactions.find(x=>x.user_id===me);if(mine)localReaction=mine.reaction}const counts={useful:0,strong:0,watch:0};
    reactions.forEach(x=>{if(counts[x.reaction]!=null)counts[x.reaction]++});if(!reactions.length&&localReaction)counts[localReaction]++;
    const signed=account().signedIn;
    shell.innerHTML=`<div class="match-share-row"><button type="button" class="primary-btn compact" data-share-pick>Share Pick Card</button><small>Share the analysis, not a guarantee.</small></div><div class="reaction-row"><b>Community reaction</b><div>${[["useful","Useful"],["strong","Strong"],["watch","Watch"]].map(([key,label])=>`<button type="button" class="${localReaction===key?"active":""}" data-match-reaction="${key}">${label} <span>${counts[key]}</span></button>`).join("")}</div></div><div class="discussion-head"><div><h4>Match discussion</h4><small>${comments.length} comment${comments.length===1?"":"s"}</small></div></div><div class="comment-list">${comments.length?comments.map(c=>`<article><span>${esc((c.displayName||"M").slice(0,1).toUpperCase())}</span><div><b>${esc(c.displayName||"Betynz Member")}</b><small>${esc(dateLabel(c.created_at||c.createdAt))}</small><p>${esc(c.body)}</p></div>${signed&&c.user_id&&c.user_id===account().id?`<button type="button" data-delete-comment="${esc(c.id)}">×</button>`:""}</article>`).join(""):'<div class="comment-empty">No comments yet. Start with the evidence behind the selection.</div>'}</div>${signed||!backendReady()?`<form class="comment-form" id="match-comment-form"><textarea name="body" maxlength="500" placeholder="Discuss the evidence respectfully…" required></textarea><button class="secondary-btn compact" type="submit">Post Comment</button></form>`:`<button type="button" class="secondary-btn compact" data-auth-open="signin">Sign in to comment</button>`}`;
  }
  async function react(key){if(!currentPick)return;const store=reactionStore(),current=store[currentPick.matchKey]||"";if(current===key)delete store[currentPick.matchKey];else store[currentPick.matchKey]=key;save("betynz-community-reactions",store);if(backendReady()&&account().signedIn){try{if(current===key)await backend.removeCommunityReaction(currentPick.matchKey);else await backend.setCommunityReaction(currentPick.matchKey,key)}catch(err){toast("Reaction saved on this device; cloud sync failed.")}}loadMatchCommunity(currentPick)}
  async function postComment(form){if(!currentPick)return;const text=String(new FormData(form).get("body")||"").trim();if(text.length<2)return;
    if(backendReady()&&account().signedIn){try{await backend.addCommunityComment(currentPick.matchKey,text);form.reset();loadMatchCommunity(currentPick);return}catch(err){toast(err.message||"Comment could not be posted.");return}}
    const store=commentStore(),rows=store[currentPick.matchKey]||[];rows.push({id:`local-${Date.now()}`,body:text,displayName:account().name||"Guest",createdAt:new Date().toISOString()});store[currentPick.matchKey]=rows.slice(-100);save("betynz-community-comments",store);form.reset();loadMatchCommunity(currentPick)
  }
  async function sharePick(){
    if(!currentPick)return;const d=currentPick,canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const c=canvas.getContext("2d");
    const g=c.createLinearGradient(0,0,1080,1350);g.addColorStop(0,"#090b0f");g.addColorStop(1,"#19110a");c.fillStyle=g;c.fillRect(0,0,1080,1350);c.strokeStyle="#c47a2c";c.lineWidth=8;c.strokeRect(42,42,996,1266);
    c.fillStyle="#f09a3e";c.font="700 44px Sora,Arial";c.fillText("BETYNZ.COM",80,130);c.fillStyle="#ffffff";c.font="700 62px Sora,Arial";wrap(c,`${d.home} vs ${d.away}`,80,255,920,76);c.fillStyle="#9ca7b3";c.font="500 30px Manrope,Arial";c.fillText(`${d.league} · ${d.date} · ${d.kickoff}`,80,425);
    c.fillStyle="#f09a3e";c.font="700 30px Manrope,Arial";c.fillText("SELECTED MARKET",80,560);c.fillStyle="#ffffff";c.font="800 70px Sora,Arial";wrap(c,d.market,80,650,920,82);c.fillStyle="#c7ced6";c.font="600 34px Manrope,Arial";c.fillText(`${d.grade} · ${d.confidence}% model score${d.odds?` · ${Number(d.odds).toFixed(2)}`:""}`,80,820);c.fillText(`Lead engine: ${d.engine}`,80,885);
    c.fillStyle="#f09a3e";c.font="800 48px Sora,Arial";c.fillText("Predict Smarter.",80,1040);c.fillStyle="#fff";c.fillText("Let the Gods Decide.",80,1105);c.fillStyle="#88929d";c.font="500 24px Manrope,Arial";c.fillText("18+ · Informational analysis · No outcome is guaranteed",80,1235);
    const blob=await new Promise(res=>canvas.toBlob(res,"image/png",.95));const file=new File([blob],`betynz-${slug(d.home)}-${slug(d.away)}.png`,{type:"image/png"});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:`${d.home} vs ${d.away}`,text:`Betynz: ${d.market}`,files:[file]});return}}catch(_){return}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);toast("Share card created.")
  }
  function wrap(c,text,x,y,max,line){const words=String(text).split(/\s+/);let row="",yy=y;for(const w of words){const next=row?`${row} ${w}`:w;if(c.measureText(next).width>max&&row){c.fillText(row,x,yy);row=w;yy+=line}else row=next}if(row)c.fillText(row,x,yy)}

  function renderAccountTools(){const root=$("#account-launch-tools");if(!root)return;root.innerHTML=`<div class="panel-title"><div><h3>Launch & community controls</h3><p>Manage onboarding, local data and your secure account.</p></div></div><div class="account-tool-grid"><button type="button" data-replay-onboarding><span>?</span><b>Replay Quick Start</b><small>Replay the six-screen guided tour.</small></button><button type="button" data-export-account><span>⇩</span><b>Export Local Data</b><small>Download preferences, follows and comments.</small></button><button type="button" data-clear-local><span>⌫</span><b>Clear Guest Data</b><small>Remove this device's local Betynz settings.</small></button>${account().signedIn&&backendReady()?'<button type="button" class="danger" data-delete-account><span>×</span><b>Delete Account</b><small>Permanently remove the secure account.</small></button>':""}</div>`}
  function exportData(){const data={exportedAt:new Date().toISOString(),preferences:load("betynz-preferences",{}),notifications:load("betynz-notifications",{}),follows,activity,comments:commentStore(),reactions:reactionStore(),savedPicks:load("betynz-slip",[])};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`betynz-export-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function clearLocal(){if(!confirm("Clear guest preferences, follows, local comments and notification history on this device?"))return;["betynz-follows","betynz-activity-days","betynz-community-comments","betynz-community-reactions","betynz-notification-center","betynz-onboarding-v53","betynz-onboarding-v57"].forEach(k=>localStorage.removeItem(k));location.reload()}
  async function deleteAccount(){if(!backendReady()||!account().signedIn)return;if(!confirm("Permanently delete your Betynz account and synced community data? This cannot be undone."))return;try{await backend.deleteAccount();localStorage.clear();location.href="/#dashboard"}catch(err){toast(err.message||"Account deletion failed.")}}

  function wire(){
    document.addEventListener("click",e=>{
      const follow=e.target.closest("[data-follow-type]");if(follow){e.preventDefault();e.stopPropagation();upsertFollow(follow.dataset.followType,follow.dataset.followKey,follow.dataset.followLabel||follow.dataset.followKey);return}
      const addFav=e.target.closest("[data-add-community-favorite]");if(addFav){const type=addFav.dataset.addCommunityFavorite,sel=$(type==="league"?"#community-league-select":"#community-team-select");if(!sel||!sel.value)return;const option=sel.selectedOptions[0];if(!followed(type,sel.value))upsertFollow(type,sel.value,option.dataset.label||option.textContent);return}
      const search=e.target.closest("[data-favorite-search]");if(search){const input=$("#global-search");if(input){input.value=search.dataset.favoriteSearch;input.dispatchEvent(new Event("input",{bubbles:true}))}return}
      if(e.target.closest("#notification-center-btn")){setNotificationDrawer(true);return}if(e.target.closest("#notification-drawer-close")||e.target.closest("#notification-drawer-backdrop")){setNotificationDrawer(false);return}
      if(e.target.closest("#mark-notifications-read")){notices=notices.map(n=>({...n,read:true}));save("betynz-notification-center",notices);renderNotificationCenter();return}
      const notice=e.target.closest("[data-notice-id]");if(notice){const n=notices.find(x=>x.id===notice.dataset.noticeId);if(n)n.read=true;save("betynz-notification-center",notices);renderNotificationCenter();setNotificationDrawer(false);return}
      const next=e.target.closest("[data-onboarding-next]");if(next){const step=Number(next.dataset.onboardingNext||0);if(step>=5)closeOnboarding();else onboardingStep(step+1);return}if(e.target.closest("[data-onboarding-back]")){const active=$$(".onboarding-progress i").findIndex(i=>i.classList.contains("active"));onboardingStep(Math.max(0,active-1));return}if(e.target.closest("[data-onboarding-skip]")){closeOnboarding();return}
      const reaction=e.target.closest("[data-match-reaction]");if(reaction){react(reaction.dataset.matchReaction);return}if(e.target.closest("[data-share-pick]")){sharePick();return}
      if(e.target.closest("[data-replay-onboarding]")){openOnboarding(true);return}if(e.target.closest("[data-export-account]")){exportData();return}if(e.target.closest("[data-clear-local]")){clearLocal();return}if(e.target.closest("[data-delete-account]")){deleteAccount();return}
    });
    document.addEventListener("submit",e=>{if(e.target.id==="match-comment-form"){e.preventDefault();postComment(e.target)}});
    window.addEventListener("betynz:pick-detail",e=>loadMatchCommunity(e.detail));
    window.addEventListener("hashchange",()=>{const v=(location.hash||"#dashboard").slice(1);if(v==="community")renderCommunity();if(v==="performance")renderPerformance();if(v==="health")renderHealth();if(v==="profile")renderAccountTools()});
    $("#refresh-health")?.addEventListener("click",renderHealth);
  }
  function observe(){new MutationObserver(()=>decorateEngineCards()).observe(document.body,{childList:true,subtree:true})}
  async function init(){await recordActivity();seedNotices();renderNotificationCenter();renderCommunity();renderPerformance();renderHealth();renderFavoriteShortcuts();renderAccountTools();decorateEngineCards();wire();observe();hydrateRemoteFollows();setTimeout(hydrateRemoteFollows,2500);setTimeout(recordActivity,3000);setTimeout(()=>openOnboarding(false),1750)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
