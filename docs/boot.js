(function(){
  "use strict";
  const VERSION="6.1.0";
  const DATA_WAIT_MS=650;
  let appStarted=false;
  let dataComplete=false;
  let appStartedWithoutData=false;

  function ensureFallback(){
    if(!Array.isArray(window.MATCHES))window.MATCHES=[];
    if(!Array.isArray(window.BETYNZ_HISTORY))window.BETYNZ_HISTORY=[];
    if(!window.BETYNZ_META||typeof window.BETYNZ_META!=="object"){
      window.BETYNZ_META={source:"waiting-for-live-sync",isReady:false,fixtureCount:0,qualifiedCount:0};
    }
    if(typeof window.BETYNZ_READY!=="boolean")window.BETYNZ_READY=false;
    if(typeof window.BETYNZ_DEMO!=="boolean")window.BETYNZ_DEMO=false;
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src=src;
      script.async=false;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function startApp(withoutData=false){
    if(appStarted)return;
    appStarted=true;
    appStartedWithoutData=withoutData;
    ensureFallback();
    try{
      await loadScript(`app.js?v=${VERSION}`);
    }catch(error){
      console.error("Betynz core failed to start",error);
      const status=document.getElementById("system-status");
      if(status)status.textContent="App file failed to load — refresh once";
    }
  }

  const data=document.createElement("script");
  data.src=`data.js?v=${VERSION}`;
  data.fetchPriority="high";
  data.async=true;
  data.onload=()=>{
    dataComplete=true;
    if(!appStarted){startApp(false);return}
    if(appStartedWithoutData&&Array.isArray(window.MATCHES)&&window.MATCHES.length){
      try{
        const key="betynz-core-late-board-v610";
        if(sessionStorage.getItem(key))return;
        sessionStorage.setItem(key,"1");
      }catch(_){}
      location.reload();
    }
  };
  data.onerror=()=>{dataComplete=true;startApp(true)};
  document.body.appendChild(data);

  setTimeout(()=>{if(!dataComplete)startApp(true)},DATA_WAIT_MS);
}());
