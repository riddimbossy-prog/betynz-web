const CACHE='betynz-v3.1-banker-filters';
const CORE=['/','/index.html','/styles.css?v=3.1','/app.js?v=3.1','/olympian-engine-core.js?v=3.1','/manifest.webmanifest','/assets/betynz-mark.svg','/assets/gods/zeus.png','/assets/gods/athena.png','/assets/gods/apollo.png','/assets/gods/ares.png','/assets/gods/poseidon.png','/assets/gods/hermes.png','/assets/gods/hera.png','/assets/gods/artemis.png','/assets/gods/hephaestus.png','/assets/gods/atlas.png','/assets/gods/demeter.png','/assets/gods/dionysus.png','/assets/gods/hades.png','/assets/gods/orion.png','/assets/gods/nike.png','/assets/gods/prometheus.png'];

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

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
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
    caches.match(event.request)
      .then(hit=>hit||fetch(event.request).then(response=>{
        if(response.ok&&url.origin===self.location.origin){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }))
  );
});
