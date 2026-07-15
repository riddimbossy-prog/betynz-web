const CACHE='betynz-v5.1-free-launch-access';
const CORE=[
  '/',
  '/index.html',
  '/styles.css?v=5.1',
  '/app.js?v=5.1',
  '/backend-config.js?v=5.1',
  '/backend-client.js?v=5.1',
  '/monetization-config.js?v=5.1',
  '/rebel-engine-core.js?v=5.1',
  '/olympian-engine-core.js?v=5.1',
  '/manifest.webmanifest',
  '/assets/betynz-logo.webp',
  '/assets/betynz-mark.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/maskable-icon.png',
  '/assets/gods/zeus.webp',
  '/assets/gods/spartacus.webp',
  '/assets/gods/leonidas.webp'
];

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
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith('/data.js')||url.pathname.endsWith('/api-status.json')){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          }
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
          if(response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put('/index.html',copy));
          }
          return response;
        })
        .catch(()=>caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>{
      const network=fetch(event.request).then(response=>{
        if(response.ok&&url.origin===self.location.origin){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      });
      return hit||network;
    })
  );
});
