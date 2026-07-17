(function(){
  "use strict";
  const VERSION="5.9.3";
  const DATA_TIMEOUT=4500;
  let booted=false;
  let dataFinished=false;
  let timedOut=false;

  function ensureFallback(){
    if(!Array.isArray(window.MATCHES))window.MATCHES=[];
    if(!Array.isArray(window.BETYNZ_HISTORY))window.BETYNZ_HISTORY=[];
    if(!window.BETYNZ_META||typeof window.BETYNZ_META!=="object")window.BETYNZ_META={source:"waiting-for-live-sync",isReady:false,fixtureCount:0,qualifiedCount:0};
    if(typeof window.BETYNZ_READY!=="boolean")window.BETYNZ_READY=false;
    if(typeof window.BETYNZ_DEMO!=="boolean")window.BETYNZ_DEMO=false;
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src=src;
      script.async=false;
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function boot(){
    if(booted)return;
    booted=true;
    ensureFallback();
    try{
      await loadScript(`app.js?v=${VERSION}`);
      await loadScript(`community-features.js?v=${VERSION}`);
    }catch(error){
      console.error("Betynz boot failed",error);
      const status=document.getElementById("system-status");
      if(status)status.textContent="App files failed to load — refresh once";
    }
  }

  const dataScript=document.createElement("script");
  dataScript.src=`data.js?v=${VERSION}`;
  dataScript.async=true;
  dataScript.onload=()=>{
    dataFinished=true;
    if(!timedOut){boot();return;}
    // The UI was allowed to open after the timeout. Reload once so the completed
    // verified board becomes the immutable dataset used by app.js.
    try{
      const key="betynz-late-data-reload-v593";
      if(sessionStorage.getItem(key))return;
      sessionStorage.setItem(key,"1");
    }catch(_){}
    location.reload();
  };
  dataScript.onerror=()=>{dataFinished=true;boot();};
  document.body.appendChild(dataScript);

  setTimeout(()=>{
    if(dataFinished)return;
    timedOut=true;
    boot();
  },DATA_TIMEOUT);
}());
