(function(){
  "use strict";
  const cfg=window.BETYNZ_BACKEND_CONFIG||{};
  let client=null;
  let subscription=null;

  function clean(value){return String(value||"").trim()}
  function configured(){
    const url=clean(cfg.supabaseUrl),key=clean(cfg.supabaseAnonKey);
    return cfg.enabled===true&&/^https:\/\/.+\.supabase\.co$/i.test(url)&&key.length>40&&!/YOUR_|REPLACE|PLACEHOLDER/i.test(key);
  }
  function requireClient(){
    if(!configured())throw new Error("Secure backend is not configured yet.");
    if(!window.supabase||typeof window.supabase.createClient!=="function")throw new Error("Supabase client failed to load.");
    if(!client){
      client=window.supabase.createClient(clean(cfg.supabaseUrl),clean(cfg.supabaseAnonKey),{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"},
        global:{headers:{"x-client-info":"betynz-web/5.0"}}
      });
    }
    return client;
  }
  function redirectUrl(){return clean(cfg.authRedirectUrl)||`${location.origin}${location.pathname}#profile`}
  function throwIf(error){if(error)throw new Error(error.message||"Backend request failed.")}

  async function init(onAuthChange){
    const c=requireClient();
    if(subscription){subscription.unsubscribe();subscription=null}
    const listener=c.auth.onAuthStateChange((event,session)=>{
      if(typeof onAuthChange==="function")setTimeout(()=>onAuthChange(event,session),0);
    });
    subscription=listener&&listener.data&&listener.data.subscription;
    const {data,error}=await c.auth.getSession();throwIf(error);return data.session||null;
  }

  function signupMetadata(input){
    return {
      display_name:clean(input.name),
      country:clean(input.country),
      date_of_birth:clean(input.dob),
      terms_accepted_at:new Date().toISOString(),
      adult_confirmed:true
    };
  }

  async function signUpWithPassword(input){
    const c=requireClient();
    const email=clean(input.email).toLowerCase();
    const password=String(input.password||"");
    const {data,error}=await c.auth.signUp({
      email,
      password,
      options:{emailRedirectTo:redirectUrl(),data:signupMetadata(input)}
    });
    throwIf(error);return data;
  }

  async function signInWithPassword(email,password){
    const {data,error}=await requireClient().auth.signInWithPassword({email:clean(email).toLowerCase(),password:String(password||"")});
    throwIf(error);return data;
  }

  async function signInWithGoogle(){
    const {data,error}=await requireClient().auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo:redirectUrl(),queryParams:{access_type:"offline",prompt:"consent"}}
    });
    throwIf(error);return data;
  }

  async function sendPasswordReset(email){
    const {data,error}=await requireClient().auth.resetPasswordForEmail(clean(email).toLowerCase(),{redirectTo:redirectUrl()});
    throwIf(error);return data;
  }

  async function updatePassword(password){
    const {data,error}=await requireClient().auth.updateUser({password:String(password||"")});
    throwIf(error);return data;
  }

  async function completeProfile(input){
    const {data,error}=await requireClient().rpc("complete_my_profile",{
      p_display_name:clean(input.name),
      p_country:clean(input.country),
      p_date_of_birth:clean(input.dob),
      p_terms_accepted:true
    });
    throwIf(error);return data;
  }

  async function signOut(){const {error}=await requireClient().auth.signOut();throwIf(error)}

  async function accountState(){
    const c=requireClient();
    const {data:{session},error:sessionError}=await c.auth.getSession();throwIf(sessionError);
    if(!session)return null;
    const {data,error}=await c.rpc("get_my_account_state");throwIf(error);
    return data||{id:session.user.id,email:session.user.email,profile_complete:false,plan:"free"};
  }

  async function preferences(){
    const {data,error}=await requireClient().from("user_preferences").select("favorite_engine,min_confidence,remember_slip,responsible_reminder,notifications").maybeSingle();
    throwIf(error);return data||null;
  }
  async function savePreferences(value){
    const c=requireClient();const {data:{user},error:userError}=await c.auth.getUser();throwIf(userError);if(!user)throw new Error("Sign in required.");
    const payload={user_id:user.id,favorite_engine:clean(value.favoriteEngine)||"zeus",min_confidence:Number(value.confidence)||76,remember_slip:value.rememberSlip!==false,updated_at:new Date().toISOString()};
    const {error}=await c.from("user_preferences").upsert(payload,{onConflict:"user_id"});throwIf(error);
  }
  async function saveNotifications(value){
    const c=requireClient();const {data:{user},error:userError}=await c.auth.getUser();throwIf(userError);if(!user)throw new Error("Sign in required.");
    const {error}=await c.from("user_preferences").upsert({user_id:user.id,notifications:value,updated_at:new Date().toISOString()},{onConflict:"user_id"});throwIf(error);
  }
  async function savedPicks(){
    const {data,error}=await requireClient().from("saved_picks").select("client_key,match_key,home,away,market,odds,engine,match_date").order("created_at",{ascending:true});
    throwIf(error);return Array.isArray(data)?data:[];
  }
  async function syncSavedPicks(items){
    const payload=(Array.isArray(items)?items:[]).slice(0,100).map(item=>({
      client_key:clean(item.key),match_key:clean(item.matchKey),home:clean(item.home),away:clean(item.away),market:clean(item.market),odds:Number.isFinite(Number(item.odds))?Number(item.odds):null,engine:clean(item.engine),match_date:item.date||null
    }));
    const {error}=await requireClient().rpc("sync_my_saved_picks",{payload});throwIf(error);
  }
  async function billing(){
    const {data,error}=await requireClient().from("billing_records").select("provider_event_id,created_at,plan,amount,currency,status,description").order("created_at",{ascending:false}).limit(100);
    throwIf(error);return Array.isArray(data)?data:[];
  }
  async function pauseAccess(days){const {data,error}=await requireClient().rpc("pause_my_account",{pause_days:Math.max(1,Math.min(30,Number(days)||7))});throwIf(error);return data}

  async function invokeFunction(name,body){
    const fn=cfg.functions&&cfg.functions[name]||name;
    const {data,error}=await requireClient().functions.invoke(fn,{body:body||{}});throwIf(error);return data;
  }
  async function createCheckout(plan,cycle){return invokeFunction("checkout",{plan,cycle,returnUrl:`${location.origin}${location.pathname}#billing`})}
  async function cancelSubscription(){return invokeFunction("cancelSubscription",{confirm:"CANCEL_RENEWAL"})}
  async function deleteAccount(){return invokeFunction("deleteAccount",{confirm:"DELETE"})}

  window.BetynzBackend=Object.freeze({
    configured,init,
    signUpWithPassword,signInWithPassword,signInWithGoogle,
    sendPasswordReset,updatePassword,completeProfile,
    signOut,accountState,preferences,savePreferences,saveNotifications,
    savedPicks,syncSavedPicks,billing,pauseAccess,
    createCheckout,cancelSubscription,deleteAccount
  });
})();
