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
  let matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
  let meta=window.BETYNZ_META&&typeof window.BETYNZ_META==="object"?window.BETYNZ_META:{};
  let settledHistory=Array.isArray(window.BETYNZ_HISTORY)?window.BETYNZ_HISTORY:[];
  let isDemo=!!window.BETYNZ_DEMO||!!meta.isDemo;
  let isPending=window.BETYNZ_READY===false||/waiting|loading|unavailable/.test(String(meta.source||"").toLowerCase());
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc=v=>String(v==null?"":v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const todayISO=new Date().toISOString().slice(0,10);
  const FINISHED=new Set(["FT","AET","PEN","AWD","WO"]);
  const LIVE=new Set(["1H","HT","2H","ET","BT","P","LIVE"]);
  const cache=new Map();
  const pickCache=new Map();
  const enginePickCache=new Map();
  let allPicksMemo=null;
  const CORE_VIEWS=new Set(["dashboard","picks","engines","bankers","results","methodology","responsible"]);
  let activeView=(location.hash||"#dashboard").slice(1);
  if(!CORE_VIEWS.has(activeView))activeView="dashboard";
  let activeDate=null;
  let activeDashboardEngine="all";
  let picksFilter={engine:"all",market:"all",league:"all",grade:"all"};
  let bankerFilter={status:"all",grade:"all",league:"all",odds:"all"};
  let searchTerm="";
  let toastTimer=null;
  let deferredInstallPrompt=null;
  let installPromptAttempted=false;
  let slip=loadJSON("betynz-slip",[]);
  let preferences=loadJSON("betynz-preferences",{favoriteEngine:"zeus",confidence:76,rememberSlip:true});
  const MONETIZATION=window.BETYNZ_MONETIZATION&&typeof window.BETYNZ_MONETIZATION==="object"?window.BETYNZ_MONETIZATION:{mode:"free",freeLaunch:true,subscriptionsEnabled:false,currency:"USD",plans:{},checkoutUrls:{}};
  const BACKEND=window.BetynzBackend||null;
  const secureBackendConfigured=()=>!!(BACKEND&&typeof BACKEND.configured==="function"&&BACKEND.configured());
  const FREE_LAUNCH=MONETIZATION.freeLaunch===true;
  const SUBSCRIPTIONS_ENABLED=MONETIZATION.subscriptionsEnabled===true;
  const usingSecureBackend=()=>MONETIZATION.mode==="production"&&secureBackendConfigured();
  const PLAN_LEVEL={guest:0,free:1,pro:2,supreme:3,day:3};
  let billingCycle="monthly";
  let account=loadJSON("betynz-account",{signedIn:false,name:"",email:"",country:"",plan:"guest",createdAt:null,expiresAt:null,pausedUntil:null});
  let notificationPrefs=loadJSON("betynz-notifications",{newPicks:true,pickChanges:true,scores:true,rebels:false,leagues:""});
  let paymentHistory=loadJSON("betynz-payment-history",[]);
  let backendHydrating=false;
  let backendHydrated=false;
  let backendInitStarted=false;
  const renderedViews=new Set(["dashboard"]);
  let slipSyncTimer=null;

  function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v==null?fallback:v}catch(_){return fallback}}
  function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function normalizeAccount(){
    if(!account||typeof account!=="object")account={signedIn:false,plan:"guest"};
    if(!account.signedIn){account.plan="guest";account.name="";account.email=""}
    if(account.plan==="day"&&account.expiresAt&&Date.parse(account.expiresAt)<=Date.now()){
      account.plan=account.signedIn?"free":"guest";account.expiresAt=null;saveAccount();
    }
    if(!Object.prototype.hasOwnProperty.call(PLAN_LEVEL,account.plan))account.plan=account.signedIn?"free":"guest";
    return account;
  }
  function saveAccount(){saveJSON("betynz-account",account)}
  function planKey(){normalizeAccount();return account.plan||"guest"}
  function planLevel(){return PLAN_LEVEL[planKey()]||0}
  function hasPlan(required){return FREE_LAUNCH||planLevel()>=(PLAN_LEVEL[required]||0)}
  function isPaused(){return !!(account.pausedUntil&&Date.parse(account.pausedUntil)>Date.now())}
  function planName(key=planKey()){
    if(FREE_LAUNCH)return "Free Full Access";
    if(key==="guest")return"Guest";
    const cfg=MONETIZATION.plans&&MONETIZATION.plans[key];
    return cfg&&cfg.name?cfg.name:key==="pro"?"Olympian Pro":key==="supreme"?"Zeus Supreme":key==="day"?"Day Pass":"Free";
  }
  function requiredPlanForEngine(id){if(FREE_LAUNCH)return "guest";if(id==="all")return"guest";if(id==="zeus"||id==="spartacus"||id==="leonidas")return"supreme";return"pro"}
  function requiredPlanForView(name){if(FREE_LAUNCH)return "guest";if(name==="bankers")return"supreme";if(name==="saved"||name==="notifications")return"pro";if(name==="billing")return"free";return"guest"}
  function featurePlanLabel(required){if(FREE_LAUNCH)return "Free Full Access";return required==="supreme"?"Zeus Supreme":required==="pro"?"Olympian Pro":"Free account"}
  function formatMoney(value,currency=MONETIZATION.currency||"USD"){const n=Number(value||0);try{return new Intl.NumberFormat("en",{style:"currency",currency:String(currency||"USD").toUpperCase(),maximumFractionDigits:n%1?2:0}).format(n)}catch(_){return `${String(currency||"USD").toUpperCase()} ${n.toFixed(n%1?2:0)}`}}
  function accountInitials(){return account.signedIn?initials(account.name||account.email):"BZ"}
  function publicLimit(){return FREE_LAUNCH?7:(hasPlan("pro")?7:3)}
  function lockedTeaser(required,title,copy){return `<div class="access-teaser"><span>♛</span><div><b>${esc(title)}</b><p>${esc(copy)}</p></div><button type="button" data-upgrade-required="${required}" data-upgrade-feature="${esc(title)}">View ${esc(featurePlanLabel(required))}</button></div>`}
  function closeAccountModal(){const modal=$("#account-modal"),backdrop=$("#account-modal-backdrop");if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}if(backdrop)backdrop.classList.remove("open")}
  function showAccountModal(html){closeEngine();const modal=$("#account-modal"),backdrop=$("#account-modal-backdrop");if(!modal||!backdrop)return;$("#account-modal-content").innerHTML=html;modal.classList.add("open");modal.setAttribute("aria-hidden","false");backdrop.classList.add("open");requestAnimationFrame(()=>modal.querySelector("input,button,select")?.focus())}
  function googleButton(label="Continue with Google"){
    return `<button class="google-auth-btn" type="button" data-google-auth><span class="google-g">G</span>${esc(label)}</button>`;
  }
  function authDivider(){return `<div class="auth-divider"><span>or</span></div>`}
  function openAuth(mode="signup"){
    const signup=mode!=="signin";
    const authNote=usingSecureBackend()?`<div class="integration-banner secure"><b>Secure account access</b><p>Use email and password or continue with Google. Email confirmation remains enabled.</p></div>`:MONETIZATION.mode==="preview"?`<div class="integration-banner"><b>Preview mode</b><p>This package stores a test account only on this device. Connect Supabase before launch.</p></div>`:`<div class="integration-banner"><b>Backend setup required</b><p>Add your public Supabase URL and anon key in backend-config.js, then enable the connection.</p></div>`;
    const signupForm=`${googleButton("Create account with Google")}${authDivider()}<form id="signup-form" class="auth-form"><label><span>Display name</span><input name="name" autocomplete="name" required maxlength="50"></label><label><span>Email address</span><input name="email" type="email" autocomplete="email" required></label><div class="form-pair"><label><span>Country</span><input name="country" autocomplete="country-name" required></label><label><span>Date of birth</span><input name="dob" type="date" required></label></div><label><span>Password</span><input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label><span>Confirm password</span><input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></label><p class="password-hint">Use at least 8 characters. A longer, unique password is safer.</p><label class="consent-row"><input name="age" type="checkbox" required><span>I confirm I am 18 or older and legally permitted to access this content.</span></label><label class="consent-row"><input name="terms" type="checkbox" required><span>I accept the Terms, Privacy Notice and responsible-play rules.</span></label><button class="primary-btn" type="submit">Create Free Account</button></form>`;
    const signinForm=`${googleButton("Sign in with Google")}${authDivider()}<form id="signin-form" class="auth-form"><label><span>Email address</span><input name="email" type="email" autocomplete="email" required></label><label><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label><button class="primary-btn" type="submit">Sign In</button><button class="text-auth-btn" type="button" data-reset-password>Forgot password?</button></form>`;
    showAccountModal(`<div class="auth-modal-head"><span class="auth-mark">⚡</span><div><small>BETYNZ ACCOUNT</small><h2 id="account-modal-title">${signup?"Create your free account":"Sign in to Betynz"}</h2><p>${signup?"Save preferences and sync your free access across devices.":"Use your password or Google account."}</p></div></div>${authNote}<div class="auth-switch"><button type="button" class="${signup?"active":""}" data-auth-open="signup">Create account</button><button type="button" class="${signup?"":"active"}" data-auth-open="signin">Sign in</button></div>${signup?signupForm:signinForm}`);
  }
  function openProfileCompletion(){
    showAccountModal(`<div class="auth-modal-head"><span class="auth-mark">18+</span><div><small>COMPLETE YOUR ACCOUNT</small><h2 id="account-modal-title">Finish secure setup</h2><p>Google supplied your identity. Betynz still needs adult eligibility and account preferences.</p></div></div><form id="complete-profile-form" class="auth-form"><label><span>Display name</span><input name="name" autocomplete="name" required maxlength="50" value="${esc(account.name||"")}"></label><div class="form-pair"><label><span>Country</span><input name="country" autocomplete="country-name" required></label><label><span>Date of birth</span><input name="dob" type="date" required></label></div><label class="consent-row"><input name="age" type="checkbox" required><span>I confirm I am 18 or older and legally permitted to access this content.</span></label><label class="consent-row"><input name="terms" type="checkbox" required><span>I accept the Terms, Privacy Notice and responsible-play rules.</span></label><button class="primary-btn" type="submit">Complete Account</button></form>`);
  }
  function openNewPassword(){
    showAccountModal(`<div class="auth-modal-head"><span class="auth-mark">🔐</span><div><small>PASSWORD RECOVERY</small><h2 id="account-modal-title">Choose a new password</h2><p>Your recovery link was verified.</p></div></div><form id="new-password-form" class="auth-form"><label><span>New password</span><input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label><span>Confirm new password</span><input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></label><button class="primary-btn" type="submit">Update Password</button></form>`);
  }
  function ageFromDob(value){const dob=new Date(`${value}T12:00:00`);if(!Number.isFinite(dob.getTime()))return 0;const now=new Date();let age=now.getFullYear()-dob.getFullYear();const md=now.getMonth()-dob.getMonth();if(md<0||(md===0&&now.getDate()<dob.getDate()))age--;return age}
  async function handleSignup(form){
    const data=new FormData(form),dob=String(data.get("dob")||""),password=String(data.get("password")||""),confirmPassword=String(data.get("confirmPassword")||"");
    if(ageFromDob(dob)<18){toast("Betynz account access is restricted to adults 18+.");return}
    if(password.length<8){toast("Use a password with at least 8 characters.");return}
    if(password!==confirmPassword){toast("The passwords do not match.");return}
    const input={name:String(data.get("name")||"").trim(),email:String(data.get("email")||"").trim().toLowerCase(),country:String(data.get("country")||"").trim(),dob,password};
    if(MONETIZATION.mode==="production"&&!usingSecureBackend()){toast("Secure backend setup is incomplete.");return}
    if(usingSecureBackend()){
      const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent="Creating secure account…"}
      try{const result=await BACKEND.signUpWithPassword(input);closeAccountModal();toast(result&&result.session?"Account created and signed in.":"Account created. Check your email to confirm it.");if(result&&result.session)await hydrateSecureAccount()}
      catch(err){toast(err&&err.message?err.message:"Account creation failed.")}
      finally{if(button){button.disabled=false;button.textContent="Create Free Account"}}
      return;
    }
    account={signedIn:true,name:input.name,email:input.email,country:input.country,plan:"free",createdAt:new Date().toISOString(),expiresAt:null,pausedUntil:null,preview:true};
    saveAccount();closeAccountModal();renderAccountExperience();toast("Free preview account created on this device.");showView("profile");
  }
  async function handleSignin(form){
    const data=new FormData(form),email=String(data.get("email")||"").trim().toLowerCase(),password=String(data.get("password")||"");if(!email||!password)return;
    if(MONETIZATION.mode==="production"&&!usingSecureBackend()){toast("Secure backend setup is incomplete.");return}
    if(usingSecureBackend()){
      const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent="Signing in…"}
      try{await BACKEND.signInWithPassword(email,password);closeAccountModal();await hydrateSecureAccount();toast("Signed in securely.");showView("profile")}
      catch(err){toast(err&&err.message?err.message:"Sign-in failed.")}
      finally{if(button){button.disabled=false;button.textContent="Sign In"}}
      return;
    }
    const existing=loadJSON("betynz-account",null);
    account=existing&&existing.email===email?{...existing,signedIn:true}:{signedIn:true,name:email.split("@")[0]||"Betynz User",email,country:"",plan:"free",createdAt:new Date().toISOString(),expiresAt:null,pausedUntil:null,preview:true};
    normalizeAccount();saveAccount();closeAccountModal();renderAccountExperience();toast("Signed in on this device.");showView("profile");
  }
  async function handleGoogleAuth(){
    if(!usingSecureBackend()){toast("Connect the secure backend before using Google sign-in.");return}
    try{await BACKEND.signInWithGoogle()}catch(err){toast(err&&err.message?err.message:"Google sign-in could not start.")}
  }
  async function handlePasswordReset(){
    const email=prompt("Enter the email address for your Betynz account:");if(!email)return;
    if(!usingSecureBackend()){toast("Connect the secure backend before resetting passwords.");return}
    try{await BACKEND.sendPasswordReset(email);toast("Password reset email sent.")}catch(err){toast(err&&err.message?err.message:"Password reset failed.")}
  }
  async function handleNewPassword(form){
    const data=new FormData(form),password=String(data.get("password")||""),confirm=String(data.get("confirmPassword")||"");
    if(password.length<8){toast("Use at least 8 characters.");return}if(password!==confirm){toast("The passwords do not match.");return}
    try{await BACKEND.updatePassword(password);closeAccountModal();toast("Password updated.")}catch(err){toast(err&&err.message?err.message:"Password update failed.")}
  }
  async function handleCompleteProfile(form){
    const data=new FormData(form),dob=String(data.get("dob")||"");if(ageFromDob(dob)<18){toast("Betynz account access is restricted to adults 18+.");return}
    const input={name:String(data.get("name")||"").trim(),country:String(data.get("country")||"").trim(),dob};
    try{await BACKEND.completeProfile(input);closeAccountModal();await hydrateSecureAccount();toast("Secure account completed.");showView("profile")}
    catch(err){toast(err&&err.message?err.message:"Account completion failed.")}
  }
  async function signOut(){
    try{if(usingSecureBackend())await BACKEND.signOut()}catch(err){toast(err&&err.message?err.message:"Sign-out failed.");return}
    account={signedIn:false,name:"",email:"",country:"",plan:"guest",createdAt:null,expiresAt:null,pausedUntil:null};
    slip=[];paymentHistory=[];saveAccount();saveJSON("betynz-slip",slip);closeAccountModal();renderAccountExperience();showView("dashboard");toast("Signed out.");
  }

  function mapRemotePick(item){return {key:item.client_key,matchKey:item.match_key,home:item.home,away:item.away,market:item.market,odds:item.odds,engine:item.engine,date:item.match_date}}
  async function hydrateSecureAccount(){
    if(!usingSecureBackend()||backendHydrating)return;
    backendHydrating=true;
    try{
      const state=await BACKEND.accountState();
      if(!state){
        account={signedIn:false,name:"",email:"",country:"",plan:"guest",createdAt:null,expiresAt:null,pausedUntil:null};
        backendHydrated=true;saveAccount();renderAccountExperience();return;
      }
      const profileComplete=state.profile_complete!==false;
      account={id:state.id,signedIn:true,name:state.display_name||state.google_name||"Betynz User",email:state.email||"",country:state.country||"",plan:profileComplete?(state.plan||"free"):"free",createdAt:state.created_at||null,expiresAt:state.plan_expires_at||null,pausedUntil:state.paused_until||null,preview:false,emailVerified:!!state.email_verified,profileComplete,subscriptionCycle:state.subscription_cycle||null,subscriptionProvider:state.subscription_provider||null,canCancelSubscription:!!state.can_cancel_subscription,cancelAtPeriodEnd:!!state.cancel_at_period_end,isAdmin:!!state.is_admin};
      if(!profileComplete){
        saveAccount();backendHydrated=true;renderAccountExperience();
        if(!$("#account-modal").classList.contains("open"))openProfileCompletion();
        return;
      }
      const [remotePrefs,remotePicks,remoteBilling]=await Promise.all([BACKEND.preferences(),BACKEND.savedPicks(),BACKEND.billing()]);
      if(remotePrefs){preferences={favoriteEngine:remotePrefs.favorite_engine||"zeus",confidence:Number(remotePrefs.min_confidence)||76,rememberSlip:remotePrefs.remember_slip!==false};notificationPrefs=remotePrefs.notifications||notificationPrefs;saveJSON("betynz-responsible",{reminder:remotePrefs.responsible_reminder||"60"})}
      slip=(remotePicks||[]).map(mapRemotePick);paymentHistory=(remoteBilling||[]).map(x=>({id:x.provider_event_id,date:x.created_at,plan:planName(x.plan),amount:x.amount,currency:x.currency,status:x.status,cycle:x.description||""}));
      saveAccount();saveJSON("betynz-preferences",preferences);saveJSON("betynz-notifications",notificationPrefs);saveJSON("betynz-slip",slip);saveJSON("betynz-payment-history",paymentHistory);
      backendHydrated=true;renderPreferences();renderAccountExperience();renderBilling();
    }catch(err){console.error("Betynz backend hydrate failed",err);toast("Secure account data could not be loaded.")}
    finally{backendHydrating=false}
  }
  async function initializeSecureBackend(){
    if(!usingSecureBackend()||backendInitStarted)return;
    if(!window.supabase||typeof window.supabase.createClient!=="function"){
      window.addEventListener("betynz:supabase-ready",initializeSecureBackend,{once:true});
      return;
    }
    backendInitStarted=true;
    try{
      await BACKEND.init((event)=>{if(event==="PASSWORD_RECOVERY")openNewPassword();else hydrateSecureAccount()});
      await hydrateSecureAccount();
    }catch(err){backendInitStarted=false;console.error("Betynz backend init failed",err)}
  }
  function openPaywall(required="pro",feature="this feature"){
    if(FREE_LAUNCH){toast(`${feature} is included in Free Full Access.`);return}
    if(required==="free"&&!account.signedIn){openAuth("signup");return}
    const target=required==="supreme"?"supreme":"pro";
    showAccountModal(`<div class="paywall-modal"><span class="paywall-icon">♛</span><small>PREMIUM ACCESS</small><h2 id="account-modal-title">Unlock ${esc(feature)}</h2><p>${esc(feature)} requires <b>${esc(featurePlanLabel(required))}</b>. Your current access is ${esc(planName())}.</p><div class="paywall-actions">${!account.signedIn?`<button class="primary-btn" type="button" data-auth-open="signup">Create Free Account</button>`:`<button class="primary-btn" type="button" data-checkout-plan="${target}">View ${esc(featurePlanLabel(required))}</button>`}<button class="secondary-btn" type="button" data-view="pricing">Compare All Plans</button></div><p class="fine-print">Subscriptions provide access to analytics, alerts and tools. No prediction is guaranteed.</p></div>`);
  }
  async function openCheckout(plan,cycle=billingCycle){
    if(FREE_LAUNCH||!SUBSCRIPTIONS_ENABLED){toast("Subscriptions are disabled during the free launch phase.");return}
    if(!account.signedIn){openAuth("signup");return}
    const cfg=MONETIZATION.plans&&MONETIZATION.plans[plan];if(!cfg)return;
    if(usingSecureBackend()){
      try{const result=await BACKEND.createCheckout(plan,cycle);if(result&&result.url){location.href=result.url;return}throw new Error("Checkout URL was not returned.")}
      catch(err){toast(err&&err.message?err.message:"Secure checkout is not configured yet.");return}
    }
    const key=plan==="day"?"day":`${plan}_${cycle}`;const url=MONETIZATION.checkoutUrls&&MONETIZATION.checkoutUrls[key];
    if(url){location.href=url;return}
    const amount=plan==="day"?cfg.oneTime:cfg[cycle];const renewal=plan==="day"?"One-time 24-hour access":cycle==="annual"?"Renews annually":"Renews monthly";
    const preview=MONETIZATION.mode==="preview"?`<button class="secondary-btn preview-plan-btn" type="button" data-activate-preview-plan="${plan}" data-activate-preview-cycle="${cycle}">Activate test access on this device</button><p class="fine-print warning">Testing only. Remove preview mode when hosted checkout is connected.</p>`:"";
    showAccountModal(`<div class="checkout-modal"><span class="paywall-icon">⚡</span><small>HOSTED CHECKOUT</small><h2 id="account-modal-title">${esc(cfg.name)}</h2><div class="checkout-price"><b>${esc(formatMoney(amount))}</b><span>${plan==="day"?"/ 24 hours":cycle==="annual"?"/ year":"/ month"}</span></div><p>${esc(cfg.description||"")}</p><div class="checkout-summary"><span>Account</span><b>${esc(account.email)}</b><span>Billing</span><b>${esc(renewal)}</b><span>Card handling</span><b>Hosted provider only</b></div><button class="primary-btn" type="button" id="unconfigured-checkout">Continue to Secure Checkout</button>${preview}<p class="fine-print">No card information is collected by this static website package.</p></div>`);
  }
  function openCancelSubscription(){
    if(!account.canCancelSubscription){toast("No active recurring subscription is available to cancel.");return}
    showAccountModal(`<div class="paywall-modal"><span class="paywall-icon">⏹</span><small>SUBSCRIPTION CONTROL</small><h2 id="account-modal-title">Cancel automatic renewal?</h2><p>Your current access remains active until the paid period ends. This does not reverse completed payments.</p><div class="paywall-actions"><button class="primary-btn" type="button" data-confirm-cancel-subscription>Cancel Renewal</button><button class="secondary-btn" type="button" data-view="profile">Keep Subscription</button></div></div>`);
  }
  async function confirmCancelSubscription(){
    try{const result=await BACKEND.cancelSubscription();closeAccountModal();await hydrateSecureAccount();toast(result&&result.message?result.message:"Automatic renewal cancelled.")}
    catch(err){toast(err&&err.message?err.message:"Subscription cancellation failed.")}
  }
  function activatePreviewPlan(plan,cycle){
    if(MONETIZATION.mode!=="preview")return;
    account.plan=plan;account.expiresAt=plan==="day"?new Date(Date.now()+24*60*60*1000).toISOString():null;saveAccount();
    const cfg=MONETIZATION.plans[plan]||{},amount=plan==="day"?cfg.oneTime:cfg[cycle]||0;
    paymentHistory.unshift({id:`preview-${Date.now()}`,date:new Date().toISOString(),plan:planName(plan),amount,status:"Preview",cycle:plan==="day"?"24 hours":cycle});saveJSON("betynz-payment-history",paymentHistory);
    closeAccountModal();renderAccountExperience();toast(`${planName(plan)} preview activated.`);showView("profile");
  }

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
  const ODDS_KEYS={"Home Win":"home","Draw":"draw","Away Win":"away","Home DNB":"homeDnb","Away DNB":"awayDnb","Double Chance 1X":"dc1x","Double Chance X2":"dcx2","Double Chance 12":"dc12","Over 1.5 Goals":"over15","Over 2.0 Asian Goals":"over20","Over 2.5 Goals":"over25","Over 3.5 Goals":"over35","Under 1.5 Goals":"under15","Under 2.5 Goals":"under25","Under 3.0 Asian Goals":"under30","Under 3.5 Goals":"under35","BTTS Yes":"bttsYes","BTTS No":"bttsNo","Home Team Over 0.5 Goals":"homeOver05","Away Team Over 0.5 Goals":"awayOver05","Home Team Over 1.5 Goals":"homeOver15","Away Team Over 1.5 Goals":"awayOver15","First Half Over 0.5":"fhOver05","First Half Under 1.5":"fhUnder15"};
  function priceOf(m,market){const key=ODDS_KEYS[normalizeMarket(market)];const v=key&&m.odds?Number(m.odds[key]):NaN;return Number.isFinite(v)&&v>1?v:null}

  function runEngine(m,engine){
    const ck=`${keyOf(m)}|${engine.id}`;if(cache.has(ck))return cache.get(ck);
    let out=null;
    if(Array.isArray(m.olympianPredictions)){
      const d=m.olympianPredictions.find(x=>x.engine===engine.id);
      out=d&&d.bet?{...d,bet:true,primary:normalizeMarket(d.market),confidence:Number(d.confidence),reasons:d.reasons||[],warnings:d.warnings||[],dataQuality:d.dataQuality,supportOnly:!!d.supportOnly}:null;
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
      const p={m,market:normalizeMarket(m.zeusDecision.market),confidence:Math.round(Number(m.zeusDecision.confidence||0)),grade:m.zeusDecision.grade||"WATCH",engine:z,engines:engs,votes:ids.length,odds:Number(m.zeusDecision.odds)||priceOf(m,m.zeusDecision.market),conflict:false,reasons:m.zeusDecision.reasons||[],warnings:m.zeusDecision.warnings||[],locked:!!m.zeusDecision.locked,provisional:!!m.zeusDecision.provisional,dataQuality:m.zeusDecision.dataQuality??null,ppgAgreement:m.zeusDecision.ppgAgreement||null};
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

  function allPicks(){
    if(allPicksMemo)return allPicksMemo;
    allPicksMemo=matches.map(finalPick).filter(Boolean).sort((a,b)=>gradeRank(b.grade)-gradeRank(a.grade)||b.confidence-a.confidence||String(a.m.kickoff||"").localeCompare(String(b.m.kickoff||"")));
    return allPicksMemo;
  }
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
    const rows=matches.map(m=>{const out=runEngine(m,engine);if(!out)return null;const confidence=Math.round(Number(out.confidence||0));return{m,market:out.primary,confidence,grade:confidence>=88?"A1":confidence>=82?"A2":"WATCH",engine,engines:[engine],votes:1,odds:priceOf(m,out.primary),conflict:false,reasons:out.reasons||[],warnings:out.warnings||[],locked:false,provisional:true,dataQuality:out.dataQuality??null,engineOnly:true,rebel:engine.family==="rebel",signal:out}}).filter(Boolean).sort((a,b)=>b.confidence-a.confidence||String(a.m.kickoff||"").localeCompare(String(b.m.kickoff||"")));
    enginePickCache.set(id,rows);return rows;
  }
  function gradeRank(g){return g==="A1"?3:g==="A2"?2:g==="WATCH"?1:0}
  function matchesForDate(date){return matches.filter(m=>dateOf(m)===date)}
  function dates(){return [...new Set(matches.map(dateOf).filter(d=>d&&d!=="Undated"))].sort()}
  function friendlyDate(d){if(!d)return"All dates";const x=new Date(`${d}T12:00:00`);const delta=Math.round((x-new Date(`${todayISO}T12:00:00`))/86400000);const prefix=delta===0?"Today":delta===1?"Tomorrow":delta===-1?"Yesterday":x.toLocaleDateString([],{weekday:"short"});return `${prefix} · ${x.toLocaleDateString([],{month:"short",day:"numeric"})}`}
  function isUpcoming(m){return !FINISHED.has(String(m.status||"").toUpperCase())}
  function isLive(m){return LIVE.has(String(m.status||"").toUpperCase())}
  function isFinished(m){return FINISHED.has(String(m.status||"").toUpperCase())}
  function hasScore(m){return m&&m.homeGoals!=null&&m.awayGoals!=null}
  function scoreText(m){return hasScore(m)?`${Number(m.homeGoals)}–${Number(m.awayGoals)}`:"—"}
  function matchClock(m){
    if(!isLive(m))return "";
    const elapsed=Number(m.elapsed),extra=Number(m.elapsedExtra);
    if(Number.isFinite(elapsed)&&elapsed>0)return `${elapsed}${Number.isFinite(extra)&&extra>0?`+${extra}`:""}′`;
    const status=String(m.status||"").toUpperCase();
    return status==="HT"?"HT":status||"LIVE";
  }
  function matchStateHtml(m){
    if(isLive(m))return `<span class="match-state live"><i></i>LIVE${matchClock(m)?` ${esc(matchClock(m))}`:""}</span><strong class="match-score live-score">${scoreText(m)}</strong>`;
    if(isFinished(m)&&hasScore(m))return `<span class="match-state finished">${esc(String(m.status||"FT").toUpperCase())}</span><strong class="match-score">${scoreText(m)}</strong>`;
    return "";
  }

  function settlePick(p){
    const m=p.m;if(!hasScore(m)||!isFinished(m))return"Pending";
    const mk=normalizeMarket(p.market),h=Number(m.homeGoals),a=Number(m.awayGoals),t=h+a;
    const hh=m.htHome!=null?Number(m.htHome):null,ha=m.htAway!=null?Number(m.htAway):null,ht=hh!=null&&ha!=null?hh+ha:null;
    if(/first half/i.test(mk)){
      if(ht==null)return"Pending";
      if(/over 0\.5/i.test(mk))return ht>=1?"Won":"Lost";
      if(/over 1\.5/i.test(mk))return ht>=2?"Won":"Lost";
      if(/under 1\.5/i.test(mk))return ht<=1?"Won":"Lost";
      if(/under 2\.5/i.test(mk))return ht<=2?"Won":"Lost";
    }
    if(typeof window.settleMarket==="function"){try{const result=window.settleMarket(mk,h,a);if(result&&result!=="Pending")return result}catch(_){}}
    if(mk==="Home Win")return h>a?"Won":"Lost";if(mk==="Away Win")return a>h?"Won":"Lost";if(mk==="Home DNB")return h===a?"Void":h>a?"Won":"Lost";if(mk==="Away DNB")return h===a?"Void":a>h?"Won":"Lost";if(mk==="Double Chance 1X")return h>=a?"Won":"Lost";if(mk==="Double Chance X2")return a>=h?"Won":"Lost";if(mk==="Double Chance 12")return h!==a?"Won":"Lost";
    if(mk.includes("Over 2.0 Asian"))return t>2?"Won":t===2?"Void":"Lost";if(mk.includes("Under 3.0 Asian"))return t<3?"Won":t===3?"Void":"Lost";
    if(mk.includes("Over 1.5")&&!mk.includes("Team"))return t>=2?"Won":"Lost";if(mk.includes("Over 2.5")&&!mk.includes("Team"))return t>=3?"Won":"Lost";if(mk.includes("Over 3.5")&&!mk.includes("Team"))return t>=4?"Won":"Lost";if(mk.includes("Under 1.5")&&!mk.includes("Team"))return t<=1?"Won":"Lost";if(mk.includes("Under 2.5")&&!mk.includes("Team"))return t<=2?"Won":"Lost";if(mk.includes("Under 3.5")&&!mk.includes("Team"))return t<=3?"Won":"Lost";if(mk.includes("Under 4.5")&&!mk.includes("Team"))return t<=4?"Won":"Lost";
    if(mk==="BTTS Yes")return h>0&&a>0?"Won":"Lost";if(mk==="BTTS No")return !(h>0&&a>0)?"Won":"Lost";
    if(mk.includes("Home Team Over 0.5"))return h>=1?"Won":"Lost";if(mk.includes("Away Team Over 0.5"))return a>=1?"Won":"Lost";if(mk.includes("Home Team Over 1.5"))return h>=2?"Won":"Lost";if(mk.includes("Away Team Over 1.5"))return a>=2?"Won":"Lost";if(mk.includes("Home Team Over 2.5"))return h>=3?"Won":"Lost";if(mk.includes("Away Team Over 2.5"))return a>=3?"Won":"Lost";
    return"Pending";
  }


  function boardSettlements(){
    const verifiedMap=new Map(settledHistory.filter(x=>x&&["Won","Lost","Void"].includes(x.result)).map(x=>[`${x.fixtureId}|${normalizeMarket(x.market)}`,x]));
    return allPicks().filter(p=>isFinished(p.m)&&hasScore(p.m)).map(p=>{
      const fixtureId=keyOf(p.m),market=normalizeMarket(p.market),verified=verifiedMap.get(`${fixtureId}|${market}`);
      return verified?{...verified,verified:true,locked:true}:{fixtureId,home:p.m.home,away:p.m.away,league:p.m.league,kickoff:p.m.kickoff,market,confidence:p.confidence,grade:p.grade,odds:p.odds||null,engineIds:(p.engines||[]).map(e=>e.id),score:`${p.m.homeGoals}-${p.m.awayGoals}`,result:settlePick(p),verified:false,locked:!!p.locked};
    }).filter(x=>["Won","Lost","Void"].includes(x.result)).sort((a,b)=>String(b.kickoff||"").localeCompare(String(a.kickoff||"")));
  }

  function renderMetrics(){
    const picks=allPicks(),up=picks.filter(p=>isUpcoming(p.m));
    const settled=settledHistory.filter(x=>x&&["Won","Lost","Void"].includes(x.result));
    const wins=settled.filter(x=>x.result==="Won").length,losses=settled.filter(x=>x.result==="Lost").length;
    const hit=wins+losses?Math.round(wins/(wins+losses)*100):0;const priced=up.filter(p=>p.odds);const avg=priced.length?(priced.reduce((s,p)=>s+p.odds,0)/priced.length).toFixed(2):"—";
    const publishedCounts=meta.engineCounts&&typeof meta.engineCounts==="object"?meta.engineCounts:null;
    const active=publishedCounts?ENGINES.filter(e=>Number(publishedCounts[e.id]??publishedCounts[e.name]??0)>0).length:ENGINES.filter(e=>matches.some(m=>runEngine(m,e))).length;
    const liveCount=matches.filter(isLive).length;
    $("#metric-grid").innerHTML=[
      ["♜",active,"Active Engines",isDemo?"Demo snapshot":isPending?"Waiting for verified data":"Qualified systems"],
      ["▦",matches.filter(isUpcoming).length,"Upcoming Matches",`${liveCount} live · ${dates().length} board days`],
      ["◎",settled.length?`${hit}%`:"—","Verified Record",settled.length?`${settled.length} locked results`:"Waiting for locked results"],
      ["◆",avg,"Average Pick Odds",priced.length?"Current qualified prices":"Odds pending"]
    ].map(x=>`<article class="metric-card"><span class="metric-icon">${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small><em>${esc(x[3])}</em></div></article>`).join("");
    $("#trend-rate").textContent=settled.length?`${hit}%`:"—";$("#streak-value").innerHTML=`${winningStreakHistory()} <em>Days</em>`;
    const trendPanel=$(".trend-panel"),streakPanel=$("#streak-panel");
    if(trendPanel)trendPanel.hidden=!settled.length;
    if(streakPanel)streakPanel.hidden=!settled.length;
  }
  function winningStreakHistory(){const by={};settledHistory.forEach(x=>{const d=String(x.kickoff||"").slice(0,10);if(d)(by[d]=by[d]||[]).push(x.result)});let n=0;for(const d of Object.keys(by).sort().reverse()){if(by[d].some(x=>x==="Won"))n++;else break}return n}
  function winningStreak(picks){const by={};picks.forEach(p=>{const r=settlePick(p);if(r!=="Pending")(by[dateOf(p.m)]=by[dateOf(p.m)]||[]).push(r)});let n=0;Object.keys(by).sort().reverse().some(d=>{if(by[d].some(x=>x==="Won")){n++;return false}return true});return n}

  function renderEngineTabs(){
    const featured=["zeus","athena","apollo","ares","hermes","spartacus","leonidas"].map(id=>ENGINE_MAP[id]).filter(Boolean);
    const tabs=[{id:"all",name:"All Engines",glyph:"◎"},...featured];
    $("#engine-tabs").innerHTML=tabs.map(e=>{const required=requiredPlanForEngine(e.id),locked=!hasPlan(required);return `<button class="engine-tab ${activeDashboardEngine===e.id?"active":""} ${locked?"locked":""}" data-engine-tab="${e.id}" ${locked?`data-required-plan="${required}"`:""}>${e.glyph||""} ${esc(e.name)}${locked?'<i>♛</i>':''}</button>`}).join("");
    $$("[data-engine-tab]").forEach(b=>b.onclick=()=>{const required=b.dataset.requiredPlan;if(required){openPaywall(required,`${ENGINE_MAP[b.dataset.engineTab]?.name||"Engine"} analysis`);return}activeDashboardEngine=b.dataset.engineTab;renderDashboardList();renderEngineTabs()});
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
  function databaseStateLabel(m){
    if(isLive(m))return{label:`LIVE ${matchClock(m)}`.trim(),className:"live",detail:"Score updating from the database"};
    if(isFinished(m))return{label:String(m.status||"FT").toUpperCase(),className:"finished",detail:hasScore(m)?scoreText(m):"Result received"};
    const state=String(m.databaseState||"").toLowerCase();
    if(state==="analysing")return{label:"ANALYSING",className:"analysing",detail:"Engines are preparing this fixture"};
    if(state==="data-pending")return{label:"DATA PENDING",className:"pending",detail:"Required statistics are still arriving"};
    if(state==="no-banker")return{label:"NO BANKER",className:"no-banker",detail:"Analysed — no market passed the gates"};
    return{label:"SCHEDULED",className:"scheduled",detail:"Loaded automatically from the database"};
  }
  function fixtureStatusRow(m){
    const state=databaseStateLabel(m),statusHtml=matchStateHtml(m);
    return `<article class="match-row database-fixture ${isLive(m)?"is-live":""} ${isFinished(m)?"is-finished":""}">
      <div class="fixture-cell"><span class="league-flag">${leagueBadge(m)}</span><div class="fixture-teams">
        <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.homeLogo,m.home)}</span><b>${esc(m.home)}</b></div>
        <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.awayLogo,m.away)}</span><b>${esc(m.away)}</b></div>
        <small>${esc(m.league||"Football")} · ${kickoff(m)}</small>${statusHtml?`<div class="fixture-live-line">${statusHtml}</div>`:""}
      </div></div>
      <div class="market-cell"><span class="database-state ${state.className}">${esc(state.label)}</span><small>${esc(state.detail)}</small></div>
      <div class="engine-cell"><span class="engine-glyph">⚡</span>Automatic database feed</div>
      <div class="confidence"><span class="database-pulse" aria-hidden="true"></span></div>
      <div class="odds-cell">—</div>
      <div class="mobile-match-footer"><span class="mobile-engine">${esc(state.detail)}</span><span class="mobile-confidence">${esc(state.label)}</span></div>
      <span class="add-btn disabled" aria-hidden="true">·</span>
    </article>`;
  }
  function databaseRowsForDate(date){return matches.filter(m=>dateOf(m)===date&&isUpcoming(m)).sort((a,b)=>String(a.kickoff||"").localeCompare(String(b.kickoff||"")))}
  function databaseSummary(rows,picks){
    const analysing=rows.filter(m=>m.databaseState==="analysing").length;
    return `<div class="database-board-note"><span class="database-live-dot"></span><div><b>${rows.length} game${rows.length===1?"":"s"} loaded automatically</b><small>${picks} qualified pick${picks===1?"":"s"}${analysing?` · ${analysing} analysing`:""} · Refreshes every 5 minutes</small></div></div>`;
  }
  function renderDashboardList(){
    const allRows=filteredDashboardPicks(),limit=publicLimit(),rows=allRows.slice(0,limit),databaseRows=databaseRowsForDate(activeDate);
    let html=databaseSummary(databaseRows,allRows.length);
    if(rows.length){
      html+=rows.map(matchRow).join("");
      const picked=new Set(rows.map(p=>keyOf(p.m)));
      const preparing=databaseRows.filter(m=>!picked.has(keyOf(m))).slice(0,Math.max(0,7-rows.length));
      if(preparing.length)html+=`<div class="database-section-head"><b>Other database games</b><small>Analysing or no banker</small></div>${preparing.map(fixtureStatusRow).join("")}`;
    }else if(databaseRows.length){
      html+=databaseRows.slice(0,10).map(fixtureStatusRow).join("");
    }else{
      html+=empty(isPending?"Connecting to the database and loading fixtures…":"No games are scheduled for this date.");
    }
    $("#dashboard-list").innerHTML=html;
  }
  function matchRow(p){
    const m=p.m,finished=isFinished(m),live=isLive(m),settled=finished?settlePick(p):"Pending",added=slip.some(x=>x.key===slipKey(p));
    const eng=p.engines.slice(0,2).map(e=>e.name).join(" + ");
    const gradeLabel=p.engineOnly?"SIGNAL":p.grade;
    const stateLabel=finished&&settled!=="Pending"?settled:p.engineOnly?(p.rebel?"REBEL":"ENGINE"):(p.locked?"LOCKED":"PROVISIONAL");
    const stateClass=finished&&settled!=="Pending"?`settled ${String(settled).toLowerCase()}`:p.engineOnly?"provisional":p.locked?"locked":"provisional";
    const statusHtml=matchStateHtml(m);
    const addAttributes=finished?'disabled aria-disabled="true"':`data-add-pick="${esc(slipKey(p))}"`;
    const addLabel=finished?"Match finished":added?"Remove from slip":"Add to slip";
    return `<article class="match-row ${live?"is-live":""} ${finished?"is-finished":""}" data-pick-key="${esc(keyOf(m))}" data-pick-detail-row="${esc(keyOf(m))}" data-pick-source="${p.engineOnly?"engine":"consensus"}" data-pick-engine="${esc(p.engine&&p.engine.id?p.engine.id:"zeus")}" role="button" tabindex="0" aria-label="Open prediction summary for ${esc(m.home)} versus ${esc(m.away)}">
      <div class="fixture-cell">
        <span class="league-flag">${leagueBadge(m)}</span>
        <div class="fixture-teams">
          <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.homeLogo,m.home)}</span><b>${esc(m.home)}</b></div>
          <div class="team-line"><span class="team-logo-wrap">${teamCrest(m.awayLogo,m.away)}</span><b>${esc(m.away)}</b></div>
          <small>${esc(m.league||"Football")} · ${kickoff(m)}</small>
          ${statusHtml?`<div class="fixture-live-line">${statusHtml}</div>`:""}
        </div>
      </div>
      <div class="market-cell"><button class="pick-detail-link" data-pick-detail="${esc(keyOf(m))}" data-pick-source="${p.engineOnly?"engine":"consensus"}" data-pick-engine="${esc(p.engine&&p.engine.id?p.engine.id:"zeus")}">${esc(marketClean(p.market))}</button><small>${esc(marketFamily(p.market))} · <span class="grade ${p.engineOnly?"WATCH":p.grade}">${gradeLabel}</span> · <span class="lock-state ${stateClass}">${stateLabel}</span></small></div>
      <div class="engine-cell"><span class="engine-glyph">${p.engine.glyph}</span>${esc(eng)}</div>
      <div class="confidence"><span class="confidence-ring" style="--v:${p.confidence}"><span>${p.confidence}%</span></span></div>
      <div class="odds-cell">${p.odds?p.odds.toFixed(2):"—"}</div>
      <div class="mobile-match-footer" aria-hidden="true">
        <span class="mobile-engine"><span class="engine-glyph">${p.engine.glyph}</span>${esc(eng)}</span>
        ${live||finished?`<span class="mobile-live-score">${live?`LIVE ${esc(matchClock(m))}`:esc(String(m.status||"FT").toUpperCase())} · ${scoreText(m)}</span>`:`<span class="mobile-confidence">${p.confidence}%</span>`}
        <span class="mobile-odds">${p.odds?p.odds.toFixed(2):"No odds"}</span>
      </div>
      <button class="add-btn ${added?"added":""} ${finished?"disabled":""}" ${addAttributes} aria-label="${addLabel}">${finished?"FT":added?"✓":"+"}</button>
    </article>`;
  }
  function empty(text){return `<div class="empty-state"><b>Nothing forced</b>${esc(text)}</div>`}

  function renderDashboardSelectors(){
    const ds=dates();if(!activeDate)activeDate=ds.includes(todayISO)?todayISO:(ds.find(d=>d>=todayISO)||ds[0]||todayISO);
    $("#dashboard-date").innerHTML=ds.map(d=>`<option value="${d}" ${d===activeDate?"selected":""}>${friendlyDate(d)}</option>`).join("");
    const families=[...new Set(allPicks().map(p=>marketFamily(p.market)))].sort();$("#dashboard-market").innerHTML=`<option value="all">All Markets</option>${families.map(x=>`<option>${esc(x)}</option>`).join("")}`;
  }

  function renderRecentResults(){
    const rows=boardSettlements().slice(0,5),panel=$("#recent-results-panel");
    if(panel)panel.hidden=!rows.length;
    $("#recent-results").innerHTML=rows.length?rows.map(x=>`<div class="recent-result"><span>${esc(x.home)} vs ${esc(x.away)}<small>${esc(x.score||"—")} · ${x.verified?"LOCKED":"BOARD"}</small></span><b class="${String(x.result).toLowerCase()}">${esc(x.result)}${x.odds?` · ${Number(x.odds).toFixed(2)}`:""}</b></div>`).join(""):`<div class="slip-empty">No finished board picks yet.</div>`;
  }

  function renderPicksView(){
    const ds=dates();
    const engine=ENGINE_MAP[picksFilter.engine]||null;
    const requiredEnginePlan=engine?requiredPlanForEngine(engine.id):"guest";
    if(engine&&!hasPlan(requiredEnginePlan)){openPaywall(requiredEnginePlan,`${engine.name} engine picks`);picksFilter.engine="all";return renderPicksView()}
    const engineRows=engine?enginePicks(engine.id):[];
    const engineDates=[...new Set(engineRows.map(p=>dateOf(p.m)))].sort();
    if(!activeDate)activeDate=engineDates[0]||ds[0]||todayISO;
    if(engine&&engineDates.length&&!engineDates.includes(activeDate))activeDate=engineDates.find(d=>d>=todayISO)||engineDates[0];
    if(!hasPlan("pro")&&ds.includes(todayISO))activeDate=todayISO;

    $("#date-strip").innerHTML=ds.map(d=>{const locked=!hasPlan("pro")&&d!==todayISO;return `<button class="date-btn ${d===activeDate?"active":""} ${locked?"locked":""}" data-date="${d}" ${locked?'data-required-plan="pro"':""}><b>${friendlyDate(d).split(" · ")[0]}${locked?' ♛':''}</b><small>${friendlyDate(d).split(" · ")[1]||d}</small></button>`}).join("");
    $$('[data-date]').forEach(b=>b.onclick=()=>{if(b.dataset.requiredPlan){openPaywall("pro","Seven-day Match Board");return}activeDate=b.dataset.date;renderPicksView();renderDashboardSelectors();renderDashboardList();if(window.BetynzDataSource)window.BetynzDataSource.setActiveDate(activeDate).catch(()=>{})});

    const engSel=$("#picks-engine");
    engSel.innerHTML=`<option value="all">All Engines</option>${ENGINES.map(e=>{const locked=!hasPlan(requiredPlanForEngine(e.id));return `<option value="${e.id}">${e.name}${locked?" — Locked":""}</option>`}).join("")}`;
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
    const boardLimit=hasPlan("pro")?rows.length:3;
    const visibleRows=rows.slice(0,boardLimit);
    let boardHtml=visibleRows.length?visibleRows.map(matchRow).join(""):"";
    if(!engine){
      const represented=new Set(visibleRows.map(p=>keyOf(p.m)));
      let databaseRows=databaseRowsForDate(activeDate).filter(m=>!represented.has(keyOf(m)));
      if(picksFilter.league!=="all")databaseRows=databaseRows.filter(m=>m.league===picksFilter.league);
      if(searchTerm)databaseRows=databaseRows.filter(m=>`${m.home} ${m.away} ${m.league}`.toLowerCase().includes(searchTerm));
      if(databaseRows.length){
        boardHtml+=`${visibleRows.length?'<div class="database-section-head"><b>All database games</b><small>Automatic fixture feed</small></div>':databaseSummary(databaseRows,visibleRows.length)}${databaseRows.map(fixtureStatusRow).join("")}`;
      }
    }
    if(!boardHtml)boardHtml=empty(isPending?"Loading games from the database…":emptyText);
    $("#picks-list").innerHTML=boardHtml;
    updatePageArt();
  }

  function renderEngines(){
    $("#engine-grid").innerHTML=ENGINES.map(e=>{
      const publishedCount=meta.engineCounts&&typeof meta.engineCounts==="object"?Number(meta.engineCounts[e.id]??meta.engineCounts[e.name]):NaN;
      const count=Number.isFinite(publishedCount)?publishedCount:enginePicks(e.id).length;
      const art=ENGINE_ART[e.id]||ENGINE_ART.zeus;
      const rebel=e.family==="rebel";
      const coverage=rebel?rebelCoverage(e.id):null;
      const status=count?`${count} PICKS`:rebel?(coverage.moving?`${coverage.moving} MOVING`:coverage.ready?`${coverage.ready} READY`:"COLLECTING"):"0 PICKS";
      const required=requiredPlanForEngine(e.id),locked=!hasPlan(required);
      return `<article class="engine-card deity-card ${rebel?"rebel-card":""} ${locked?"access-locked":""}" data-engine-picks="${e.id}" data-required-plan="${required}" style="--card-art:url('${art}')" role="button" tabindex="0" aria-label="View ${esc(e.name)} picks"><div class="engine-top"><span class="engine-icon">${e.glyph}</span><span class="engine-status">${locked?`♛ ${required==="supreme"?"SUPREME":"PRO"}`:status}</span></div>${rebel?'<span class="engine-family-badge">REBEL</span>':''}<h3>${e.name}</h3><small>${e.role}</small><p>${e.summary}</p><div class="engine-tags">${e.tags.map(t=>`<span>${t}</span>`).join("")}</div><div class="engine-card-cta">${locked?`Unlock with ${featurePlanLabel(required)}`:`View ${e.name} picks →`}</div></article>`
    }).join("");
    $$('[data-engine-picks]').forEach(c=>{
      c.onclick=()=>viewEnginePicks(c.dataset.enginePicks);
      c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();viewEnginePicks(c.dataset.enginePicks)}};
    });
  }
  function viewEnginePicks(id){
    const engine=ENGINE_MAP[id];if(!engine)return;
    const required=requiredPlanForEngine(id);if(!hasPlan(required)){openPaywall(required,`${engine.name} engine picks`);return}
    picksFilter={engine:id,market:"all",league:"all",grade:"all"};
    const engineRows=enginePicks(id);
    const availableDates=[...new Set(engineRows.map(p=>dateOf(p.m)))].sort();
    activeDate=availableDates.find(d=>d>=todayISO)||availableDates[0]||activeDate||todayISO;
    showView("picks");
    toast(engineRows.length?`${engine.name} picks loaded.`:`${engine.name} has no qualified picks right now.`);
  }
  function openEngine(id){
    const e=ENGINE_MAP[id];if(!e)return;
    const modal=$("#engine-modal");if(modal)modal.classList.remove("pick-summary-modal");
    $("#engine-modal-content").innerHTML=`<div class="modal-engine-head"><span class="engine-icon">${e.glyph}</span><div><h2 id="engine-modal-title">${e.name} Engine</h2><p>${e.role}</p></div></div><h4>Purpose</h4><div class="rule-box">${e.summary}</div><h4>How it works</h4><ul>${e.checks.map(x=>`<li>${x}</li>`).join("")}</ul><h4>Final safety gate</h4><div class="rule-box">${e.gate}<br><br><b>Universal PPG direction gate:</b> overall PPG and the relevant home/away split PPG must point to the same team before any signal can be published.</div>`;
    $("#engine-modal-backdrop").classList.add("open");
    $("#engine-modal").classList.add("open");
  }

  function resolveDetailPick(matchKey,engineId,source){
    const key=String(matchKey);
    if(source==="engine"&&engineId){
      const exact=enginePicks(engineId).find(x=>keyOf(x.m)===key);
      if(exact)return exact;
    }
    if(picksFilter.engine!=="all"){
      const filtered=enginePicks(picksFilter.engine).find(x=>keyOf(x.m)===key);
      if(filtered)return filtered;
    }
    return allPicks().find(x=>keyOf(x.m)===key)||null;
  }

  function evidenceCards(p){
    const m=p.m,cards=[];
    if(Number.isFinite(Number(m.homePPG))||Number.isFinite(Number(m.awayPPG)))cards.push(["Overall PPG",`${Number.isFinite(Number(m.homePPG))?Number(m.homePPG).toFixed(2):"—"} vs ${Number.isFinite(Number(m.awayPPG))?Number(m.awayPPG).toFixed(2):"—"}`]);
    if(Number.isFinite(Number(m.homeVenuePPG))||Number.isFinite(Number(m.awayVenuePPG)))cards.push(["Venue PPG",`${Number.isFinite(Number(m.homeVenuePPG))?Number(m.homeVenuePPG).toFixed(2):"—"} vs ${Number.isFinite(Number(m.awayVenuePPG))?Number(m.awayVenuePPG).toFixed(2):"—"}`]);
    const ppg=p.ppgAgreement||(p.signal&&p.signal.ppgAgreement)||null;
    if(ppg&&ppg.pass)cards.push(["PPG agreement",`Both favour ${ppg.direction==="home"?"Home":"Away"}`]);
    const homeDef=Number(m.homeConcededAtHome),awayDef=Number(m.awayConcededAway);
    if(Number.isFinite(homeDef)||Number.isFinite(awayDef)){
      const band=v=>!Number.isFinite(v)?"unknown":v<1?"tight":v<1.5?"medium":"leaky";
      cards.push(["Venue defence",`${Number.isFinite(homeDef)?homeDef.toFixed(2)+" "+band(homeDef):"—"} vs ${Number.isFinite(awayDef)?awayDef.toFixed(2)+" "+band(awayDef):"—"}`]);
    }
    if(m.xgReal&&(Number.isFinite(Number(m.xgHomeReal))||Number.isFinite(Number(m.xgAwayReal))))cards.push(["Trusted xG",`${Number.isFinite(Number(m.xgHomeReal))?Number(m.xgHomeReal).toFixed(2):"—"} vs ${Number.isFinite(Number(m.xgAwayReal))?Number(m.xgAwayReal).toFixed(2):"—"}`]);
    if(p.odds)cards.push(["Current odds",Number(p.odds).toFixed(2)]);
    if(p.dataQuality!=null)cards.push(["Data quality",`${Math.round(Number(p.dataQuality))}/100`]);
    cards.push(["Model confidence",`${Math.round(Number(p.confidence||0))}%`]);
    return cards.slice(0,7);
  }

  function openPickDetail(matchKey,engineId,source){
    const p=resolveDetailPick(matchKey,engineId,source);if(!p)return;
    if(isPaused()){showAccountModal(`<div class="paywall-modal"><span class="paywall-icon">◈</span><small>ACCESS PAUSED</small><h2 id="account-modal-title">Prediction access is paused</h2><p>Live scores and settled results remain available while current prediction details are hidden.</p><button class="secondary-btn" type="button" data-view="results">View Settled Results</button></div>`);return}
    const m=p.m,signal=!!p.engineOnly,displayGrade=signal?"SIGNAL":p.grade;
    const required=signal?requiredPlanForEngine(p.engine.id):"guest";if(!hasPlan(required)){openPaywall(required,`${p.engine.name} match explanation`);return}
    const basicOnly=!hasPlan("pro"),supreme=hasPlan("supreme");
    const statusText=signal?`${p.engine.name} produced this specialist signal. Zeus may still reject or change the market.`:p.locked?"Locked before kickoff and eligible for the verified public record.":"Provisional and still subject to the pre-kickoff safety checks.";
    const supporting=(p.engines||[p.engine]).filter(Boolean);
    const engineNames=[...new Set(supporting.map(e=>e.name).filter(Boolean))];
    const reasons=(p.reasons||[]).filter(Boolean);
    const warnings=(p.warnings||[]).filter(Boolean);
    const cards=evidenceCards(p);
    const resultState=isFinished(m)?settlePick(p):"Pending";
    const modal=$("#engine-modal");if(modal)modal.classList.add("pick-summary-modal");
    const basicCards=(basicOnly?cards.filter(x=>["Current odds","Model confidence"].includes(x[0])):cards);
    const advancedHtml=basicOnly?lockedTeaser("pro","Full prediction evidence","Olympian Pro reveals PPG, venue form, xG, all supporting reasons, warnings and contradiction checks."):`<div class="advanced-summary"><h4>Advanced evidence</h4><div class="pick-summary-flow"><article class="summary-step"><span>4</span><div><b>Data quality check</b><p>Betynz verified the fixture, league context, team samples and available market data before allowing an engine signal.</p></div></article><article class="summary-step"><span>5</span><div><b>All supporting evidence</b>${reasons.length?`<ul>${reasons.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p>The market cleared the active engine thresholds and ranking rules.</p>`}</div></article><article class="summary-step"><span>6</span><div><b>Safety and contradiction check</b>${warnings.length?`<ul class="summary-warnings">${warnings.slice(0,5).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p>No major published contradiction was recorded for this selection.</p>`}</div></article></div></div>`;
    const rebelAudit=signal&&p.signal&&p.signal.rebel?(supreme?`<h4>Rebel market audit</h4><div class="rule-box rebel-audit"><b>Original market:</b> ${esc(marketClean(p.signal.originalMarket||p.market))}<br><b>Final market:</b> ${esc(marketClean(p.signal.finalMarket||p.market))}<br><b>Opening odds:</b> ${p.signal.openingOdds!=null?esc(Number(p.signal.openingOdds).toFixed(2)):"—"}<br><b>Current odds:</b> ${p.signal.currentOdds!=null?esc(Number(p.signal.currentOdds).toFixed(2)):"—"}<br><b>Movement:</b> ${p.signal.movement!=null?esc((Number(p.signal.movement)*100).toFixed(1))+"%":"—"}<br><b>Bookmakers:</b> ${esc(p.signal.bookmakerCount??"—")} · <b>Agreement:</b> ${p.signal.bookmakerAgreement!=null?esc(Math.round(Number(p.signal.bookmakerAgreement)*100))+"%":"—"}<br><b>Confirmations:</b> ${esc(p.signal.confirmations??"—")} · <b>Downgrade:</b> ${esc(p.signal.downgradeLevel??0)} level(s)${p.signal.classification?`<br><b>Class:</b> ${esc(p.signal.classification)}`:""}</div>`:lockedTeaser("supreme","Rebel market audit","Zeus Supreme reveals opening odds, current odds, movement, bookmaker agreement, confirmations and downgrade logic.")):"";
    $("#engine-modal-content").innerHTML=`
      <div class="modal-engine-head pick-summary-head">
        <span class="engine-icon">${p.engine.glyph||"⚡"}</span>
        <div><h2 id="engine-modal-title">${esc(m.home)} vs ${esc(m.away)}</h2><p>${esc(m.league||"Football")} · ${esc(friendlyDate(dateOf(m)))} · ${esc(kickoff(m))}${isLive(m)?` · LIVE ${esc(matchClock(m))} ${esc(scoreText(m))}`:isFinished(m)?` · ${esc(String(m.status||"FT").toUpperCase())} ${esc(scoreText(m))}`:""}</p></div>
      </div>
      <div class="decision-hero">
        <span class="grade ${signal?"WATCH":p.grade}">${displayGrade}</span>
        <div><small>${signal?esc(p.engine.name)+" engine signal":"Final Betynz market"}</small><b>${esc(marketClean(p.market))}</b></div>
        <strong>${Math.round(Number(p.confidence||0))}%</strong>
      </div>
      <div class="summary-evidence-grid">${basicCards.map(([label,value])=>`<article><small>${esc(label)}</small><b>${esc(value)}</b></article>`).join("")}</div>
      <h4>How this pick was reached</h4>
      <div class="pick-summary-flow">
        <article class="summary-step"><span>1</span><div><b>Specialist support</b><p>${engineNames.length?`${esc(engineNames.join(", "))} supported the selected direction.`:`${esc(p.engine.name)} supplied the leading signal.`}</p></div></article>
        <article class="summary-step"><span>2</span><div><b>Basic qualification reason</b>${reasons.length?`<p>${esc(reasons[0])}</p>`:`<p>The market cleared the active engine thresholds and ranking rules.</p>`}</div></article>
        <article class="summary-step final"><span>3</span><div><b>${signal?"Specialist output":"Final board status"}</b><p>${esc(statusText)}${resultState!=="Pending"?` Final board settlement: ${esc(resultState)}.`:""}</p></div></article>
      </div>
      ${advancedHtml}
      ${rebelAudit}
      <div class="summary-disclaimer">Model confidence is not a guarantee. Football outcomes remain uncertain.</div>`;
    $("#engine-modal-backdrop").classList.add("open");
    $("#engine-modal").classList.add("open");
    window.dispatchEvent(new CustomEvent("betynz:pick-detail",{detail:{matchKey:keyOf(m),home:m.home,away:m.away,league:m.league||"Football",kickoff:kickoff(m),date:dateOf(m),market:marketClean(p.market),confidence:Math.round(Number(p.confidence||0)),grade:displayGrade,odds:p.odds||null,engine:p.engine&&p.engine.name?p.engine.name:"Zeus"}}));
    requestAnimationFrame(()=>$("#engine-modal-close")?.focus());
  }

  function closeEngine(){
    $("#engine-modal-backdrop").classList.remove("open");
    $("#engine-modal").classList.remove("open");
    $("#engine-modal").classList.remove("pick-summary-modal");
  }

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
    const rows=boardSettlements();
    const wins=rows.filter(x=>x.result==="Won").length,losses=rows.filter(x=>x.result==="Lost").length,verified=rows.filter(x=>x.verified).length,rate=wins+losses?Math.round(wins/(wins+losses)*100):0;
    $("#result-metrics").innerHTML=[[rows.length,"Board Settled"],[wins,"Won"],[losses,"Lost"],[verified,"Verified Locks"]].map(x=>`<article class="summary-card"><small>${x[1]}</small><b>${x[0]}</b></article>`).join("");
    $("#results-list").innerHTML=rows.length?`<div class="result-head"><span>Match</span><span>Selection</span><span>Score</span><span>Result</span></div>${rows.map(x=>`<div class="result-row"><span><b>${esc(x.home)} vs ${esc(x.away)}</b><br><small>${esc(String(x.kickoff||"").slice(0,10))} · ${x.verified?"VERIFIED LOCK":"BOARD SETTLEMENT"}</small></span><span>${esc(marketClean(x.market))}</span><span>${esc(x.score||"—")}</span><span class="result-status ${String(x.result).toLowerCase()}">${esc(x.result)}</span></div>`).join("")}`:empty("Finished board picks will settle automatically when final scores arrive.");
    const rateNode=$("#results-rate-note");if(rateNode)rateNode.textContent=rows.length?`${rate}% board hit rate · ${verified} verified locked result${verified===1?"":"s"}`:"Waiting for finished games.";
  }


  function slipKey(p){return `${keyOf(p.m)}|${p.market}`}
  function addPickByKey(k){if(!hasPlan("pro")){openPaywall("pro","Saved Picks");return}let p=allPicks().find(x=>slipKey(x)===k);if(!p&&picksFilter.engine!=="all")p=enginePicks(picksFilter.engine).find(x=>slipKey(x)===k);if(!p)return;const idx=slip.findIndex(x=>x.key===k);if(idx>=0)slip.splice(idx,1);else slip.push({key:k,matchKey:keyOf(p.m),home:p.m.home,away:p.m.away,market:p.market,odds:p.odds,engine:p.engine.name,date:dateOf(p.m)});persistSlip();renderAllPickLists();renderSlip();renderSavedPicks()}
  function persistSlip(){
    if(preferences.rememberSlip!==false)saveJSON("betynz-slip",slip);
    if(usingSecureBackend()&&account.signedIn){clearTimeout(slipSyncTimer);slipSyncTimer=setTimeout(()=>BACKEND.syncSavedPicks(slip).catch(err=>console.error("Saved-pick sync failed",err)),450)}
  }
  function removeSlip(k){slip=slip.filter(x=>x.key!==k);persistSlip();renderAllPickLists();renderSlip();renderSavedPicks()}
  function slipOdds(){return slip.reduce((x,l)=>x*(Number(l.odds)||1),1)}
  function slipHtml(){return slip.length?slip.map(l=>`<div class="slip-item"><div><b>${esc(l.home)} vs ${esc(l.away)}</b><small>${esc(marketClean(l.market))}${l.odds?` · ${Number(l.odds).toFixed(2)}`:""} · ${esc(l.engine)}</small></div><button data-remove-slip="${esc(l.key)}">×</button></div>`).join(""):`<div class="slip-empty">Tap + beside a qualified pick.</div>`}
  function renderSlip(){const html=slipHtml(),odds=slipOdds().toFixed(2);$("#slip-items").innerHTML=html;$("#drawer-items").innerHTML=html;$("#slip-count").textContent=slip.length;$("#mobile-slip-count").textContent=slip.length;$("#slip-odds").textContent=odds;$("#drawer-odds").textContent=odds;$("#mobile-slip-odds").textContent=odds;const panel=$("#selection-panel");if(panel)panel.classList.toggle("is-empty",slip.length===0);const mobile=$("#mobile-slip");if(mobile)mobile.classList.toggle("is-empty",slip.length===0)}
  function copySlip(){if(!slip.length){toast("Your slip is empty.");return}const text=["BETYNZ — SMART BETTING PREDICTIONS",...slip.map((l,i)=>`${i+1}. ${l.home} vs ${l.away} — ${marketClean(l.market)}${l.odds?` @ ${Number(l.odds).toFixed(2)}`:""}`),`Total odds: ${slipOdds().toFixed(2)}`,"Predictions are informational. 18+"].join("\n");navigator.clipboard?.writeText(text).then(()=>toast("Slip copied.")).catch(()=>toast("Copy is unavailable in this browser."))}

  function renderPreferences(){const sel=$("#favorite-engine");sel.innerHTML=ENGINES.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");sel.value=preferences.favoriteEngine||"zeus";$("#confidence-pref").value=String(preferences.confidence||76);$("#remember-slip").checked=preferences.rememberSlip!==false}
  async function savePreferences(){preferences={favoriteEngine:$("#favorite-engine").value,confidence:Number($("#confidence-pref").value),rememberSlip:$("#remember-slip").checked};saveJSON("betynz-preferences",preferences);if(!preferences.rememberSlip)localStorage.removeItem("betynz-slip");try{if(usingSecureBackend()&&account.signedIn)await BACKEND.savePreferences(preferences);toast("Preferences saved securely.")}catch(err){toast(err&&err.message?err.message:"Preferences could not be saved.")}}

  function renderPlanChrome(){
    normalizeAccount();const signed=!!account.signedIn,name=planName();
    const avatar=$("#profile-avatar"),profileName=$("#profile-name"),profilePlan=$("#profile-plan"),signin=$("#top-signin-btn"),upgrade=$("#top-upgrade-btn"),signout=$("#sidebar-signout");
    if(avatar)avatar.textContent=accountInitials();
    if(profileName)profileName.textContent=signed?(account.name||"Betynz User"):"Guest";
    if(profilePlan)profilePlan.textContent=name;
    if(signin)signin.hidden=signed;
    if(upgrade)upgrade.hidden=true;
    if(signout)signout.hidden=!signed;
    const cardName=$("#sidebar-plan-name"),cardCopy=$("#sidebar-plan-copy"),cardAction=$("#sidebar-plan-action");
    if(cardName)cardName.textContent="Free Full Access";
    if(cardCopy)cardCopy.textContent="All 18 engines, the seven-day board, Bankers, Rebels, explanations and alerts are free during launch.";
    if(cardAction){cardAction.textContent=signed?"My Account":"Create Account";cardAction.dataset.view=signed?"profile":"profile"}
  }
  function planFeatures(){
    return ["All 16 Olympian engines","Zeus consensus and Banker Board","Leonidas and Spartacus","Complete seven-day Match Board","Opening-to-current odds evidence","Saved picks and alerts","Live scores and automatic settlement","No subscription or payment required"];
  }
  function renderPricing(){
    const root=$("#pricing-grid");if(!root)return;
    root.innerHTML=`<article class="plan-card featured current free-launch-card"><span class="best-value">FREE LAUNCH</span><div class="plan-title"><span>⚡</span><div><h3>Free Full Access</h3><p>Every Betynz board and engine is unlocked while the platform grows its community.</p></div></div><div class="plan-price"><b>Free</b><span>No card required</span></div><ul>${planFeatures().map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${account.signedIn?'<button type="button" class="primary-btn" data-view="profile">Manage Free Account</button>':'<button type="button" class="primary-btn" data-auth-open="signup">Create Free Account</button>'}<small class="renewal-note">Accounts are optional for viewing. Sign in to sync preferences and saved picks.</small></article>`;
    $$("[data-billing-cycle]").forEach(b=>b.hidden=true);
    const table=$("#comparison-table");if(table)table.innerHTML=`<div class="comparison-row header"><b>Launch feature</b><b>Access</b></div>${planFeatures().map(x=>`<div class="comparison-row"><b>${esc(x)}</b><span>Included</span></div>`).join("")}`;
  }
  function renderAccount(){
    const root=$("#account-content");if(!root)return;const signed=!!account.signedIn;const pill=$("#account-plan-pill"),sub=$("#account-page-subtitle");
    if(pill)pill.textContent="Free Full Access";
    if(sub)sub.textContent=signed?"Manage your secure account and synced preferences.":"All boards are free. Create an account only to sync preferences and saved picks.";
    root.innerHTML=signed?`<div class="account-hero"><div class="large-avatar">${esc(accountInitials())}</div><div><span>FREE FULL ACCESS</span><h3>${esc(account.name||"Betynz User")}</h3><p>${esc(account.email)}${account.country?` · ${esc(account.country)}`:""}</p>${account.preview?'<small>Local preview account · secure backend not connected</small>':account.emailVerified?'<small>Verified secure account</small>':'<small>Secure account</small>'}</div><div class="account-hero-actions"><button class="primary-btn compact" type="button" data-view="pricing">View Free Access</button><button class="secondary-btn compact" type="button" id="account-signout">Sign Out</button></div></div><div class="account-stats"><article><small>Current access</small><b>Free Full Access</b></article><article><small>Saved picks</small><b>${slip.length}</b></article><article><small>Alerts</small><b>Available</b></article><article><small>Account status</small><b>${isPaused()?"Paused":"Active"}</b></article></div>`:`<section class="guest-account-card"><span>⚡</span><div><small>FREE FULL ACCESS</small><h3>Everything is unlocked</h3><p>Browse all 18 engines, Bankers, Rebels and the seven-day board without payment. Create a free adult account to sync settings and saved picks across devices.</p><div><button class="primary-btn compact" type="button" data-auth-open="signup">Create Free Account</button><button class="secondary-btn compact" type="button" data-auth-open="signin">Sign In</button></div></div></section>`;
  }
  function renderSavedPicks(){const root=$("#saved-picks-content");if(!root)return;root.innerHTML=slip.length?`<div class="saved-list">${slip.map(x=>`<article><div><small>${esc(friendlyDate(x.date))}</small><h3>${esc(x.home)} vs ${esc(x.away)}</h3><p>${esc(marketClean(x.market))}${x.odds?` · ${Number(x.odds).toFixed(2)}`:""} · ${esc(x.engine)}</p></div><button type="button" data-remove-slip="${esc(x.key)}" aria-label="Remove saved pick">×</button></article>`).join("")}</div><div class="saved-actions"><button class="primary-btn compact" id="saved-copy" type="button">Copy Saved List</button><button class="secondary-btn compact" id="saved-clear" type="button">Clear Saved Picks</button></div>`:empty("No saved picks yet. Tap + beside a qualified match.")}
  function renderNotifications(){const locked=false;["notify-new-picks","notify-pick-changes","notify-scores","notify-rebels","notify-leagues","save-notifications","enable-browser-notifications"].forEach(id=>{const el=$("#"+id);if(el)el.disabled=locked});if($("#notify-new-picks"))$("#notify-new-picks").checked=!!notificationPrefs.newPicks;if($("#notify-pick-changes"))$("#notify-pick-changes").checked=!!notificationPrefs.pickChanges;if($("#notify-scores"))$("#notify-scores").checked=!!notificationPrefs.scores;if($("#notify-rebels"))$("#notify-rebels").checked=!!notificationPrefs.rebels;if($("#notify-leagues"))$("#notify-leagues").value=notificationPrefs.leagues||"";const pill=$("#notification-plan-pill");if(pill)pill.textContent="Free Full Access"}
  async function saveNotifications(){notificationPrefs={newPicks:$("#notify-new-picks").checked,pickChanges:$("#notify-pick-changes").checked,scores:$("#notify-scores").checked,rebels:$("#notify-rebels").checked,leagues:$("#notify-leagues").value.trim()};saveJSON("betynz-notifications",notificationPrefs);try{if(usingSecureBackend()&&account.signedIn)await BACKEND.saveNotifications(notificationPrefs);toast(account.signedIn?"Notification preferences saved securely.":"Notification preferences saved on this device.")}catch(err){toast(err&&err.message?err.message:"Notification preferences could not be saved.")}}
  async function enableBrowserNotifications(){if(!("Notification" in window)){toast("Browser notifications are not supported here.");return}const result=await Notification.requestPermission();toast(result==="granted"?"Device notification permission enabled.":"Notification permission was not enabled.")}
  function renderBilling(){const root=$("#billing-content");if(!root)return;root.innerHTML=`<div class="billing-empty"><span>◎</span><h3>Subscriptions are not active</h3><p>Betynz is in a free-access launch phase. No payment method, checkout or recurring charge is required.</p><button class="primary-btn compact" type="button" data-view="pricing">View Free Access</button></div>`}
  function renderResponsible(){const sel=$("#responsible-reminder");if(sel)sel.value=loadJSON("betynz-responsible",{reminder:"60"}).reminder||"60";const btn=$("#pause-account");if(btn)btn.textContent=isPaused()?`Paused until ${new Date(account.pausedUntil).toLocaleDateString()}`:"Pause prediction access for 7 days"}
  function renderAccountExperience(){renderPlanChrome();renderPricing();renderAccount();renderSavedPicks();renderNotifications();renderBilling();renderResponsible();renderEngineTabs();renderDashboardList();renderEngines();renderSlip()}


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

  function renderViewData(name){
    if(renderedViews.has(name))return;
    switch(name){
      case "picks": renderPicksView(); break;
      case "engines": renderEngines(); break;
      case "bankers": renderBankers(); break;
      case "results": renderResults(); break;
      case "profile": renderAccount(); renderPreferences(); break;
      case "pricing": renderPricing(); break;
      case "saved": renderSavedPicks(); break;
      case "notifications": renderNotifications(); break;
      case "billing": renderBilling(); break;
      case "responsible": renderResponsible(); break;
      default: break;
    }
    renderedViews.add(name);
  }

  function scheduleSecondaryViews(){
    const task=()=>{
      // Pre-render only the lightweight high-use pages. The engine directory and
      // Banker Board are rendered when opened so the dashboard is never delayed.
      ["picks","results"].forEach(renderViewData);
    };
    if("requestIdleCallback" in window)requestIdleCallback(task,{timeout:1800});
    else setTimeout(task,120);
  }

  function showView(name,options={}){
    if(!CORE_VIEWS.has(name)||!$( `[data-view-panel="${name}"]`))name="dashboard";
    const required=requiredPlanForView(name);if(!hasPlan(required)){const current=$("[data-view-panel].active")?.dataset.viewPanel||"dashboard";activeView=current;if(location.hash!==`#${current}`)window.history.replaceState(null,"",`#${current}`);closeSidebar(true);openPaywall(required,name==="bankers"?"Banker Board":name==="saved"?"Saved Picks":name==="notifications"?"Notifications":"Account billing");return}
    if(isPaused()&&["picks","engines","bankers"].includes(name)){closeSidebar(true);showAccountModal(`<div class="paywall-modal"><span class="paywall-icon">◈</span><small>ACCESS PAUSED</small><h2 id="account-modal-title">Prediction access is paused</h2><p>This device is paused until ${esc(new Date(account.pausedUntil).toLocaleString())}. Live scores and settled results remain available.</p><button class="secondary-btn" type="button" data-view="results">View Settled Results</button></div>`);return}

    const route=`#${name}`;
    if(options.updateHistory!==false&&location.hash!==route){
      const method=options.replaceHistory?"replaceState":"pushState";
      window.history[method](null,"",route);
    }

    const changed=activeView!==name||!$(`[data-view-panel="${name}"]`)?.classList.contains("active");
    activeView=name;
    $$('[data-view-panel]').forEach(v=>v.classList.toggle("active",v.dataset.viewPanel===name));
    $$('[data-view]').forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    if(!renderedViews.has(name))requestAnimationFrame(()=>renderViewData(name));
    closeSidebar(true);
    closeSelectionDrawer();

    // Views are pre-rendered during initialization and updated by their own state actions.
    // Avoid rebuilding large fixture lists on every navigation tap.
    if(changed||options.force){
      updatePageArt();
      window.scrollTo({top:0,left:0,behavior:"auto"});
      window.dispatchEvent(new CustomEvent("betynz:viewchange",{detail:{view:name}}));
    }
  }
  function renderAllPickLists(){renderDashboardList();if(activeView==="picks")renderPicksView();if(activeView==="bankers")renderBankers()}
  function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}

  function closeSelectionDrawer(){
    const drawer=$("#mobile-drawer"),backdrop=$("#drawer-backdrop");
    if(drawer)drawer.classList.remove("open");
    if(backdrop)backdrop.classList.remove("open");
  }
  function openSelectionDrawer(){
    closeSidebar();
    const drawer=$("#mobile-drawer"),backdrop=$("#drawer-backdrop");
    if(drawer)drawer.classList.add("open");
    if(backdrop)backdrop.classList.add("open");
  }
  function setSidebar(open,immediate=false){
    const sidebar=$("#sidebar"),backdrop=$("#sidebar-backdrop"),menu=$("#menu-btn");
    if(!sidebar)return;
    if(open)closeSelectionDrawer();
    if(immediate){
      sidebar.classList.add("nav-instant");
      if(backdrop)backdrop.classList.add("nav-instant");
    }
    sidebar.classList.toggle("open",!!open);
    if(backdrop)backdrop.classList.toggle("open",!!open);
    document.body.classList.toggle("sidebar-open",!!open);
    if(menu)menu.setAttribute("aria-expanded",open?"true":"false");
    if(immediate)requestAnimationFrame(()=>requestAnimationFrame(()=>{
      sidebar.classList.remove("nav-instant");
      if(backdrop)backdrop.classList.remove("nav-instant");
    }));
  }
  function closeSidebar(immediate=false){setSidebar(false,immediate)}

  function bindNavigationControls(){
    $$('[data-view]').forEach(control=>{
      control.dataset.navBound="true";
      control.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        closeSelectionDrawer();closeAccountModal();
        showView(control.dataset.view);
      });
    });
  }

  async function requestInstall(){
    if(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches){toast("Betynz is already installed.");return}
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      const choice=await deferredInstallPrompt.userChoice.catch(()=>null);
      deferredInstallPrompt=null;
      const btn=$("#install-app-btn");if(btn)btn.hidden=true;
      if(choice&&choice.outcome==="accepted")toast("Betynz installation started.");
      return;
    }
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(isiOS?"On iPhone/iPad: Share → Add to Home Screen.":"Use your browser menu and choose Install app.");
  }
  function setupPWA(){
    const installBtn=$("#install-app-btn");
    if(installBtn)installBtn.onclick=requestInstall;
    $$('[data-install-app]').forEach(button=>button.onclick=requestInstall);
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault();
      deferredInstallPrompt=event;
      if(installBtn){installBtn.hidden=false;installBtn.classList.add("ready")}
    });
    window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;if(installBtn)installBtn.hidden=true;toast("Betynz installed.")});
    if(!("serviceWorker" in navigator))return;
    navigator.serviceWorker.register("service-worker.js",{updateViaCache:"none"}).then(reg=>{
      // Check once on open. The new app shell is used on the next normal launch,
      // avoiding update/reload loops that previously froze navigation.
      reg.update().catch(()=>{});
    }).catch(()=>{});
  }

  function wire(){
    $$('[data-toast]').forEach(b=>b.addEventListener("click",()=>toast(b.dataset.toast)));
    bindNavigationControls();
    document.addEventListener("click",e=>{
      const dynamicView=e.target.closest("[data-view]");if(dynamicView&&!dynamicView.dataset.navBound){e.preventDefault();e.stopPropagation();closeSelectionDrawer();closeAccountModal();showView(dynamicView.dataset.view);return}
      const remove=e.target.closest("[data-remove-slip]");if(remove){e.preventDefault();e.stopPropagation();removeSlip(remove.dataset.removeSlip);return}
      const auth=e.target.closest("[data-auth-open]");if(auth){e.preventDefault();e.stopPropagation();openAuth(auth.dataset.authOpen||"signup");return}
      const google=e.target.closest("[data-google-auth]");if(google){e.preventDefault();e.stopPropagation();handleGoogleAuth();return}
      const reset=e.target.closest("[data-reset-password]");if(reset){e.preventDefault();e.stopPropagation();handlePasswordReset();return}
      const cancel=e.target.closest("[data-cancel-subscription]");if(cancel){e.preventDefault();e.stopPropagation();openCancelSubscription();return}
      const confirmCancel=e.target.closest("[data-confirm-cancel-subscription]");if(confirmCancel){e.preventDefault();e.stopPropagation();confirmCancelSubscription();return}
      const upgrade=e.target.closest("[data-upgrade-required]");if(upgrade){e.preventDefault();e.stopPropagation();openPaywall(upgrade.dataset.upgradeRequired,upgrade.dataset.upgradeFeature||"this feature");return}
      const checkout=e.target.closest("[data-checkout-plan]");if(checkout){e.preventDefault();e.stopPropagation();openCheckout(checkout.dataset.checkoutPlan,checkout.dataset.checkoutCycle||billingCycle);return}
      const preview=e.target.closest("[data-activate-preview-plan]");if(preview){e.preventDefault();e.stopPropagation();activatePreviewPlan(preview.dataset.activatePreviewPlan,preview.dataset.activatePreviewCycle||billingCycle);return}
      const cycle=e.target.closest("[data-billing-cycle]");if(cycle){e.preventDefault();billingCycle=cycle.dataset.billingCycle;renderPricing();return}
      const add=e.target.closest("[data-add-pick]");if(add){e.preventDefault();e.stopPropagation();addPickByKey(add.dataset.addPick);return}
      const detail=e.target.closest("[data-pick-detail]");if(detail){e.preventDefault();e.stopPropagation();openPickDetail(detail.dataset.pickDetail,detail.dataset.pickEngine,detail.dataset.pickSource);return}
      const about=e.target.closest("[data-engine-about]");if(about){e.preventDefault();openEngine(about.dataset.engineAbout);return}
      const row=e.target.closest("[data-pick-detail-row]");
      if(row&&!e.target.closest("button,a,input,select,textarea,label")){openPickDetail(row.dataset.pickDetailRow,row.dataset.pickEngine,row.dataset.pickSource);return}
    });
    const menu=$("#menu-btn");if(menu){
      menu.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();setSidebar(!$("#sidebar").classList.contains("open"))});
    }
    const sidebarBackdrop=$("#sidebar-backdrop");if(sidebarBackdrop)sidebarBackdrop.onclick=closeSidebar;
    if($("#dashboard-date"))$("#dashboard-date").onchange=e=>{activeDate=e.target.value;renderDashboardList();if(window.BetynzDataSource)window.BetynzDataSource.setActiveDate(activeDate).catch(()=>{})};
    if($("#dashboard-market"))$("#dashboard-market").onchange=renderDashboardList;
    if($("#dashboard-odds"))$("#dashboard-odds").onchange=renderDashboardList;
    if($("#clear-filters"))$("#clear-filters").onclick=()=>{activeDashboardEngine="all";$("#dashboard-market").value="all";$("#dashboard-odds").value="all";renderEngineTabs();renderDashboardList()};
    if($("#picks-engine"))$("#picks-engine").onchange=e=>{const id=e.target.value,required=requiredPlanForEngine(id);if(!hasPlan(required)){e.target.value=picksFilter.engine;openPaywall(required,`${ENGINE_MAP[id]?.name||"Engine"} picks`);return}picksFilter.engine=id;renderPicksView()};
    if($("#picks-market"))$("#picks-market").onchange=e=>{picksFilter.market=e.target.value;renderPicksView()};
    if($("#picks-league"))$("#picks-league").onchange=e=>{picksFilter.league=e.target.value;renderPicksView()};
    if($("#picks-grade"))$("#picks-grade").onchange=e=>{picksFilter.grade=e.target.value;renderPicksView()};
    if($("#banker-status"))$("#banker-status").onchange=e=>{bankerFilter.status=e.target.value;renderBankers()};
    if($("#banker-grade"))$("#banker-grade").onchange=e=>{bankerFilter.grade=e.target.value;renderBankers()};
    if($("#banker-league"))$("#banker-league").onchange=e=>{bankerFilter.league=e.target.value;renderBankers()};
    if($("#banker-odds"))$("#banker-odds").onchange=e=>{bankerFilter.odds=e.target.value;renderBankers()};
    if($("#banker-reset"))$("#banker-reset").onclick=()=>{bankerFilter={status:"all",grade:"all",league:"all",odds:"all"};renderBankers();toast("Banker filters reset.")};
    if($("#global-search"))$("#global-search").oninput=e=>{searchTerm=e.target.value.trim().toLowerCase();renderDashboardList();if(activeView==="picks")renderPicksView()};
    if($("#clear-slip"))$("#clear-slip").onclick=()=>{slip=[];persistSlip();renderSlip();renderSavedPicks();renderAllPickLists()};
    if($("#copy-slip"))$("#copy-slip").onclick=copySlip;
    if($("#drawer-copy"))$("#drawer-copy").onclick=copySlip;
    if($("#mobile-slip"))$("#mobile-slip").onclick=openSelectionDrawer;
    if($("#drawer-close"))$("#drawer-close").onclick=closeSelectionDrawer;
    if($("#drawer-backdrop"))$("#drawer-backdrop").onclick=closeSelectionDrawer;
    if($("#engine-modal-close"))$("#engine-modal-close").onclick=closeEngine;
    if($("#engine-modal-backdrop"))$("#engine-modal-backdrop").onclick=closeEngine;
    if($("#account-modal-close"))$("#account-modal-close").onclick=closeAccountModal;
    if($("#account-modal-backdrop"))$("#account-modal-backdrop").onclick=closeAccountModal;
    document.addEventListener("submit",e=>{if(e.target.id==="signup-form"){e.preventDefault();handleSignup(e.target)}if(e.target.id==="signin-form"){e.preventDefault();handleSignin(e.target)}if(e.target.id==="complete-profile-form"){e.preventDefault();handleCompleteProfile(e.target)}if(e.target.id==="new-password-form"){e.preventDefault();handleNewPassword(e.target)}});
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape"){closeEngine();closeAccountModal();closeSelectionDrawer();closeSidebar();return}
      if((e.key==="Enter"||e.key===" ")&&e.target.closest&&e.target.closest("[data-pick-detail-row]")&&!e.target.closest("button,a,input,select,textarea,label")){
        e.preventDefault();const row=e.target.closest("[data-pick-detail-row]");openPickDetail(row.dataset.pickDetailRow,row.dataset.pickEngine,row.dataset.pickSource);
      }
    });
    if($("#add-visible"))$("#add-visible").onclick=()=>{if(!hasPlan("pro")){openPaywall("pro","Saved Picks");return}const source=picksFilter.engine!=="all"?enginePicks(picksFilter.engine):allPicks();const dateRows=source.filter(p=>dateOf(p.m)===activeDate&&isUpcoming(p.m));dateRows.forEach(p=>{const k=slipKey(p);if(!slip.some(x=>x.key===k))slip.push({key:k,matchKey:keyOf(p.m),home:p.m.home,away:p.m.away,market:p.market,odds:p.odds,engine:p.engine.name,date:dateOf(p.m)})});persistSlip();renderSlip();renderAllPickLists();toast(`${dateRows.length} visible picks added.`)};
    if($("#save-prefs"))$("#save-prefs").onclick=savePreferences;
    if($("#save-notifications"))$("#save-notifications").onclick=saveNotifications;
    if($("#enable-browser-notifications"))$("#enable-browser-notifications").onclick=enableBrowserNotifications;
    if($("#sidebar-signout"))$("#sidebar-signout").onclick=signOut;
    if($("#support-contact-btn"))$("#support-contact-btn").onclick=()=>{const email=MONETIZATION.supportEmail||"";if(email)location.href=`mailto:${email}`;else toast("Connect a support email before launch.")};
    if($("#pause-account"))$("#pause-account").onclick=async()=>{if(isPaused()){toast("Prediction access is already paused.");return}try{account.pausedUntil=usingSecureBackend()&&account.signedIn?await BACKEND.pauseAccess(7):new Date(Date.now()+7*24*60*60*1000).toISOString();saveAccount();renderResponsible();toast("Prediction access paused for 7 days.")}catch(err){toast(err&&err.message?err.message:"Account pause failed.")}};
    if($("#responsible-reminder"))$("#responsible-reminder").onchange=e=>{saveJSON("betynz-responsible",{reminder:e.target.value});toast("Viewing reminder saved.")};
    document.addEventListener("click",e=>{if(e.target.id==="account-signout")signOut();if(e.target.id==="saved-copy")copySlip();if(e.target.id==="saved-clear"){slip=[];persistSlip();renderSlip();renderSavedPicks();renderAllPickLists();toast("Saved picks cleared.")}if(e.target.id==="unconfigured-checkout")toast("Subscriptions are disabled during the free launch phase.")});
    const syncHistoryView=()=>{
      const next=(location.hash||"#dashboard").slice(1);
      if(next!==activeView)showView(next,{updateHistory:false});
    };
    window.addEventListener("popstate",syncHistoryView);
    window.addEventListener("hashchange",syncHistoryView);
  }

  function updateStatusChrome(){
    const generated=meta.generatedAt?new Date(meta.generatedAt):null;
    const age=generated&&Number.isFinite(generated.getTime())?(Date.now()-generated.getTime())/36e5:null;
    const stale=age!=null&&age>12;
    const liveNow=matches.filter(isLive).length;
    const processing=meta.processing&&typeof meta.processing==="object"?meta.processing:{};
    const pendingCount=Number(processing.pending||0);
    const unavailable=String(meta.source||"").includes("unavailable");
    const statusText=unavailable?"Database unavailable — retrying automatically":isPending&&!matches.length?"Connecting to the live database…":stale&&matches.length?"Cached board shown — refreshing":liveNow?`${liveNow} live game${liveNow===1?"":"s"} updating`:pendingCount?`${pendingCount} game${pendingCount===1?"":"s"} analysing`:matches.length?`${matches.length} database game${matches.length===1?"":"s"} loaded`:"Database connected — no fixtures returned";
    const dataText=unavailable?"Retrying Database":isPending&&!matches.length?"Loading Games":stale?"Cached Data":liveNow?`Live · ${liveNow}`:matches.length?"Database Live":"No Fixtures";
    if($("#system-status"))$("#system-status").textContent=statusText;
    if($("#data-state"))$("#data-state").textContent=dataText;
    const statusBox=$("#data-status-content");
    if(statusBox)statusBox.innerHTML=`<article><small>Source</small><b>${esc(meta.source||"Database")}</b></article><article><small>Updated</small><b>${esc(meta.generatedAt?new Date(meta.generatedAt).toLocaleString():"Connecting…")}</b></article><article><small>Fixtures</small><b>${esc(meta.fixtureCount??matches.length)}</b></article><article><small>Qualified</small><b>${esc(meta.qualifiedCount??allPicks().length)}</b></article>`;
    const dateLabel=$("#dashboard-date-label"),fixtureSummary=$("#dashboard-fixture-summary"),updatedLabel=$("#dashboard-updated-label");
    if(dateLabel)dateLabel.textContent=friendlyDate(activeDate||todayISO);
    if(fixtureSummary){const dateGames=matches.filter(m=>dateOf(m)===(activeDate||todayISO)).length,datePicks=allPicks().filter(p=>dateOf(p.m)===(activeDate||todayISO)).length;fixtureSummary.textContent=`${dateGames} games · ${datePicks} qualified prediction${datePicks===1?"":"s"}`}
    if(updatedLabel)updatedLabel.textContent=meta.generatedAt?new Date(meta.generatedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Checking…";
  }

  function applyRuntimeData(detail){
    if(!detail||typeof detail!=="object")return;
    matches=Array.isArray(detail.matches)?detail.matches:(Array.isArray(window.MATCHES)?window.MATCHES:[]);
    settledHistory=Array.isArray(detail.history)?detail.history:(Array.isArray(window.BETYNZ_HISTORY)?window.BETYNZ_HISTORY:[]);
    meta=detail.meta&&typeof detail.meta==="object"?detail.meta:(window.BETYNZ_META||{});
    isDemo=!!window.BETYNZ_DEMO||!!meta.isDemo;
    isPending=window.BETYNZ_READY===false||/waiting|loading|unavailable/.test(String(meta.source||"").toLowerCase());
    cache.clear();pickCache.clear();enginePickCache.clear();allPicksMemo=null;
    const validMatchKeys=new Set(matches.map(keyOf));
    const previousSlip=slip.length;slip=slip.filter(item=>validMatchKeys.has(String(item.matchKey)));
    if(previousSlip!==slip.length)persistSlip();
    const ds=dates();
    if(!activeDate||(!ds.includes(activeDate)&&ds.length))activeDate=ds.includes(todayISO)?todayISO:(ds.find(d=>d>=todayISO)||ds[0]||todayISO);
    updateStatusChrome();
    renderDashboardSelectors();renderMetrics();renderEngineTabs();renderDashboardList();renderRecentResults();renderSlip();
    if(renderedViews.has("picks")||activeView==="picks")renderPicksView();
    if(renderedViews.has("engines")||activeView==="engines")renderEngines();
    if(renderedViews.has("bankers")||activeView==="bankers")renderBankers();
    if(renderedViews.has("results")||activeView==="results")renderResults();
  }

  function init(){
    normalizeAccount();
    const validMatchKeys=new Set(matches.map(keyOf));
    const originalSlipSize=slip.length;
    slip=slip.filter(item=>validMatchKeys.has(String(item.matchKey)));
    if(slip.length!==originalSlipSize)persistSlip();
    const ds=dates();activeDate=ds.includes(todayISO)?todayISO:(ds.find(d=>d>=todayISO)||ds[0]||todayISO);
    updateStatusChrome();

    // First paint: build only what the dashboard actually needs.
    renderDashboardSelectors();
    renderMetrics();
    renderEngineTabs();
    renderDashboardList();
    renderRecentResults();
    renderSlip();
    renderPlanChrome();
    wire();
    setupPWA();
    showView(activeView,{replaceHistory:true,force:true});

    // Secondary pages and remote account services are deliberately delayed until
    // after the first board paint so live fixtures never wait behind hidden views.
    scheduleSecondaryViews();
    window.BETYNZ_APP_READY=true;
    window.dispatchEvent(new Event("betynz:app-ready"));
  }
  window.addEventListener("betynz:data-updated",event=>{if(window.BETYNZ_APP_READY)applyRuntimeData(event.detail||{})});
  window.addEventListener("betynz:data-error",event=>{if(!window.BETYNZ_APP_READY)return;meta={...(window.BETYNZ_META||{}),error:event.detail&&event.detail.error};isPending=true;updateStatusChrome();renderDashboardList()});
  window.BetynzApp=Object.freeze({updateData:applyRuntimeData,refresh:()=>window.BetynzDataSource&&window.BetynzDataSource.refresh()});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
