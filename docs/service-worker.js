const CACHE='betynz-core-v6.1.0';
const DATA_KEY='/data.js';
const CORE=[
  '/',
  '/index.html',
  '/styles.css?v=6.1.0',
  '/experience.js?v=6.1.0',
  '/nav-core.js?v=6.1.0',
  '/boot.js?v=6.1.0',
  '/app.js?v=6.1.0',
  '/rebel-engine-core.js?v=6.1.0',
  '/olympian-engine-core.js?v=6.1.0',
  '/manifest.webmanifest',
  '/assets/betynz-logo.webp',
  '/assets/betynz-mark.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/maskable-icon.png',
  '/assets/gods/zeus.webp'
];

const DEMO_MARKERS=[
  /"id"\s*:\s*9000(?:0[1-9]|1\d|20)\b/,
  /Manchester City\s+vs\s+Brighton/i,
  /Inter Milan\s+vs\s+Torino/i,
  /Flamengo\s+vs\s+Palmeiras/i
];

function isVerifiedDataText(text){
  const value=String(text||'');
  if(!/window\.MATCHES\s*=\s*\[\s*\{/.test(value))return false;
  return !DEMO_MARKERS.some(pattern=>pattern.test(value));
}

async function isVerifiedResponse(response){
  if(!response||!response.ok)return false;
  try{return isVerifiedDataText(await response.clone().text())}catch(_){return false}
}

async function cachedBoard(request){
  const exact=await caches.match(request);
  if(await isVerifiedResponse(exact))return exact;
  const canonical=await caches.match(DATA_KEY);
  if(await isVerifiedResponse(canonical))return canonical;
  return null;
}

async function refreshBoard(request){
  const response=await fetch(request,{cache:'no-store'});
  if(!await isVerifiedResponse(response))throw new Error('Invalid or empty live board');
  const cache=await caches.open(CACHE);
  await cache.put(request,response.clone());
  await cache.put(DATA_KEY,response.clone());
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  clients.forEach(client=>client.postMessage({type:'BETYNZ_DATA_READY'}));
  return response;
}

function timeout(ms){return new Promise(resolve=>setTimeout(()=>resolve(null),ms))}

function emptyBoard(){
  return new Response(
    'window.BETYNZ_DEMO=false;window.BETYNZ_READY=false;window.BETYNZ_META={source:"waiting-for-live-sync",isReady:false,fixtureCount:0,qualifiedCount:0};window.BETYNZ_HISTORY=[];window.MATCHES=[];',
    {headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}}
  );
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const current=await caches.open(CACHE);
    const keys=await caches.keys();
    for(const key of keys){
      if(key===CACHE)continue;
      const old=await caches.open(key);
      const oldData=await old.match(DATA_KEY);
      if(await isVerifiedResponse(oldData))await current.put(DATA_KEY,oldData.clone());
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='REFRESH_DATA'){
    event.waitUntil(refreshBoard(new Request(DATA_KEY,{cache:'no-store'})).catch(()=>{}));
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith('/data.js')){
    event.respondWith((async()=>{
      const cached=await cachedBoard(event.request);
      const refresh=refreshBoard(event.request).catch(()=>null);
      event.waitUntil(refresh);
      if(cached)return cached;
      return (await Promise.race([refresh,timeout(3500)]))||emptyBoard();
    })());
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const cached=await caches.match('/index.html');
      const network=fetch(event.request,{cache:'no-store'}).then(response=>{
        if(response.ok)caches.open(CACHE).then(cache=>cache.put('/index.html',response.clone()));
        return response;
      }).catch(()=>null);
      event.waitUntil(network);
      return cached||(await network)||new Response('Betynz is temporarily offline.',{status:503,headers:{'Content-Type':'text/plain'}});
    })());
    return;
  }

  event.respondWith(caches.match(event.request).then(hit=>{
    const fresh=fetch(event.request).then(response=>{
      if(response.ok&&url.origin===self.location.origin)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
      return response;
    }).catch(()=>null);
    return hit||fresh;
  }));
});
