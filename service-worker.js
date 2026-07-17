const CACHE='betynz-v5.9.3';
const DATA_FALLBACK_KEY='/data.js';
const CORE=[
  '/',
  '/index.html',
  '/styles.css?v=5.9.3',
  '/boot.js?v=5.9.3',
  '/app.js?v=5.9.3',
  '/community-features.js?v=5.9.3',
  '/backend-config.js?v=5.9.3',
  '/backend-client.js?v=5.9.3',
  '/monetization-config.js?v=5.9.3',
  '/rebel-engine-core.js?v=5.9.3',
  '/olympian-engine-core.js?v=5.9.3',
  '/manifest.webmanifest',
  '/assets/betynz-logo.webp',
  '/assets/betynz-mark.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/maskable-icon.png',
  '/assets/gods/zeus.webp',
  '/assets/gods/spartacus.webp',
  '/assets/gods/leonidas.webp',
  '/assets/splash/launch-portrait.webp',
  '/assets/splash/launch-landscape.webp'
];

const DEMO_MARKERS=[
  /"id"\s*:\s*9000(?:0[1-9]|1\d|20)\b/,
  /Manchester City\s+vs\s+Brighton/i,
  /Inter Milan\s+vs\s+Torino/i,
  /Flamengo\s+vs\s+Palmeiras/i
];

function containsVerifiedFixtures(text){
  const value=String(text||'');
  if(!/window\.MATCHES\s*=\s*\[\s*\{/.test(value))return false;
  return !DEMO_MARKERS.some(pattern=>pattern.test(value));
}

async function validResponse(response){
  if(!response||!response.ok)return false;
  try{return containsVerifiedFixtures(await response.clone().text())}catch(_){return false}
}

async function cachedLiveBoard(request){
  const exact=await caches.match(request);
  if(await validResponse(exact))return exact;
  const canonical=await caches.match(DATA_FALLBACK_KEY);
  if(await validResponse(canonical))return canonical;
  return null;
}

async function notifyDataReady(changed){
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  clients.forEach(client=>client.postMessage({type:'BETYNZ_DATA_READY',changed:!!changed}));
}

async function refreshLiveBoard(request){
  const previous=await cachedLiveBoard(request);
  let previousText='';
  try{if(previous)previousText=await previous.clone().text()}catch(_){ }
  const response=await fetch(request,{cache:'no-store'});
  if(!await validResponse(response))throw new Error('The returned data board was empty or invalid.');
  const freshText=await response.clone().text();
  const cache=await caches.open(CACHE);
  await cache.put(request,response.clone());
  await cache.put(DATA_FALLBACK_KEY,response.clone());
  await notifyDataReady(Boolean(previousText&&previousText!==freshText));
  return response;
}

function timeout(ms){
  return new Promise(resolve=>setTimeout(()=>resolve(null),ms));
}

function emptyDataResponse(){
  return new Response(
    'window.BETYNZ_DEMO=false;window.BETYNZ_READY=false;window.BETYNZ_META={source:"waiting-for-live-sync",isReady:false,fixtureCount:0,qualifiedCount:0};window.BETYNZ_HISTORY=[];window.MATCHES=[];',
    {headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}}
  );
}

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const target=await caches.open(CACHE);
    const keys=await caches.keys();
    for(const key of keys){
      if(key===CACHE)continue;
      const old=await caches.open(key);
      const oldData=await old.match(DATA_FALLBACK_KEY);
      if(await validResponse(oldData))await target.put(DATA_FALLBACK_KEY,oldData.clone());
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data&&event.data.type==='REFRESH_DATA'){
    const request=new Request('/data.js',{cache:'no-store'});
    event.waitUntil(refreshLiveBoard(request).catch(()=>{}));
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith('/data.js')){
    const network=refreshLiveBoard(event.request).catch(()=>null);
    event.waitUntil(network);
    event.respondWith((async()=>{
      const cached=await cachedLiveBoard(event.request);

      // Returning the last verified board immediately makes every repeat launch fast.
      // The fresh board is downloaded in the background and used on the next launch.
      if(cached)return cached;

      // A brand-new installation waits only briefly. The network request keeps running
      // after the timeout and the client reloads once when verified data becomes ready.
      const fresh=await Promise.race([network,timeout(4500)]);
      return fresh||emptyDataResponse();
    })());
    return;
  }

  if(url.pathname.endsWith('/api-status.json')){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response.ok)caches.open(CACHE).then(cache=>cache.put('/index.html',response.clone()));
          return response;
        })
        .catch(()=>caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>{
      const network=fetch(event.request).then(response=>{
        if(response.ok&&url.origin===self.location.origin)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
        return response;
      }).catch(()=>null);
      return hit||network;
    })
  );
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const target=list.find(c=>'focus' in c);
    if(target){target.focus();target.navigate('/#notifications');return}
    if(self.clients.openWindow)return self.clients.openWindow('/#notifications');
  }));
});
