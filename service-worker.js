const CACHE='betynz-v5.9.1';
const DATA_FALLBACK_KEY='/data.js';
const CORE=[
  '/',
  '/index.html',
  '/styles.css?v=5.9.1',
  '/app.js?v=5.9.1',
  '/community-features.js?v=5.9.1',
  '/backend-config.js?v=5.9.1',
  '/backend-client.js?v=5.9.1',
  '/monetization-config.js?v=5.9.1',
  '/rebel-engine-core.js?v=5.9.1',
  '/olympian-engine-core.js?v=5.9.1',
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

function containsFixtures(text){
  return /window\.MATCHES\s*=\s*\[\s*\{/.test(String(text||''));
}

async function cachedLiveBoard(request){
  const exact=await caches.match(request);
  if(exact){
    try{if(containsFixtures(await exact.clone().text()))return exact}catch(_){ }
  }
  const canonical=await caches.match(DATA_FALLBACK_KEY);
  if(canonical){
    try{if(containsFixtures(await canonical.clone().text()))return canonical}catch(_){ }
  }
  return null;
}

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(async key=>{
        const old=await caches.open(key);
        const oldData=await old.match(DATA_FALLBACK_KEY);
        if(oldData){
          try{
            const text=await oldData.clone().text();
            if(containsFixtures(text))await (await caches.open(CACHE)).put(DATA_FALLBACK_KEY,oldData.clone());
          }catch(_){ }
        }
        return caches.delete(key);
      })))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith('/data.js')){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(!response.ok)throw new Error(`data.js ${response.status}`);
        const text=await response.clone().text();
        if(containsFixtures(text)){
          const cache=await caches.open(CACHE);
          await cache.put(event.request,response.clone());
          await cache.put(DATA_FALLBACK_KEY,response.clone());
          return response;
        }
        const fallback=await cachedLiveBoard(event.request);
        return fallback||response;
      }catch(_){
        return (await cachedLiveBoard(event.request))||new Response(
          'window.BETYNZ_DEMO=false;window.BETYNZ_READY=false;window.MATCHES=[];',
          {headers:{'Content-Type':'application/javascript; charset=utf-8'}}
        );
      }
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
      });
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
