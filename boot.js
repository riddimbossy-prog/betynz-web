(function(){
  "use strict";
  const VERSION="6.2.0";
  const FIRST_PAINT_WAIT_MS=1800;
  let appStarted=false;

  function ensureFallback(){
    if(!Array.isArray(window.MATCHES))window.MATCHES=[];
    if(!Array.isArray(window.BETYNZ_HISTORY))window.BETYNZ_HISTORY=[];
    if(!window.BETYNZ_META||typeof window.BETYNZ_META!=="object"){
      window.BETYNZ_META={version:VERSION,source:"database-loading",isReady:false,fixtureCount:0,qualifiedCount:0};
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

  async function startApp(){
    if(appStarted)return;
    appStarted=true;
    ensureFallback();
    try{await loadScript(`app.js?v=${VERSION}`)}
    catch(error){
      console.error("Betynz core failed to start",error);
      const status=document.getElementById("system-status");
      if(status)status.textContent="App failed to start — refresh once";
    }
  }

  ensureFallback();
  const source=window.BetynzDataSource;
  const initial=source&&typeof source.loadInitial==="function"
    ?source.loadInitial()
    :Promise.reject(new Error("Database data source is missing"));

  Promise.race([
    initial.catch(()=>null),
    new Promise(resolve=>setTimeout(resolve,FIRST_PAINT_WAIT_MS))
  ]).then(startApp);

  initial.then(()=>{
    if(!appStarted)return startApp();
    if(window.BetynzApp&&typeof window.BetynzApp.updateData==="function"){
      window.BetynzApp.updateData({matches:window.MATCHES,history:window.BETYNZ_HISTORY,meta:window.BETYNZ_META});
    }
  }).catch(error=>{
    console.warn("Betynz database did not answer during startup",error);
    startApp();
  });
}());
