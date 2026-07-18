const CACHE="betynz-shell-v6.2.0";
const CORE=[
  "/",
  "/index.html",
  "/styles.css?v=6.2.0",
  "/runtime-config.js?v=6.2.0",
  "/data-source.js?v=6.2.0",
  "/experience.js?v=6.2.0",
  "/nav-core.js?v=6.2.0",
  "/boot.js?v=6.2.0",
  "/app.js?v=6.2.0",
  "/rebel-engine-core.js?v=6.2.0",
  "/olympian-engine-core.js?v=6.2.0",
  "/manifest.webmanifest",
  "/assets/betynz-logo.webp",
  "/assets/betynz-mark.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/maskable-icon.png",
  "/assets/gods/zeus.webp"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(response.ok){const cache=await caches.open(CACHE);cache.put("/index.html",response.clone())}
        return response;
      }catch(_){
        return await caches.match("/index.html")||new Response("Betynz is temporarily offline.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    const network=fetch(event.request).then(async response=>{
      if(response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone())}
      return response;
    }).catch(()=>null);
    if(cached){event.waitUntil(network);return cached}
    return await network||new Response("",{status:504});
  })());
});
