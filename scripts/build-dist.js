#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");const ROOT=path.resolve(__dirname,".."),DIST=path.join(ROOT,"dist");
fs.rmSync(DIST,{recursive:true,force:true});fs.mkdirSync(DIST,{recursive:true});
const files=["index.html","404.html","styles.css","app.js","community-features.js","backend-config.js","backend-client.js","monetization-config.js","rebel-engine-core.js","olympian-engine-core.js","data.js","manifest.webmanifest","service-worker.js","robots.txt","sitemap.xml","CNAME","api-status.json"];
for(const f of files){const src=path.join(ROOT,f);if(fs.existsSync(src))fs.copyFileSync(src,path.join(DIST,f))}
fs.cpSync(path.join(ROOT,"assets"),path.join(DIST,"assets"),{recursive:true});
fs.writeFileSync(path.join(DIST,".nojekyll"),"");
console.log(`Built public dist with ${files.filter(f=>fs.existsSync(path.join(ROOT,f))).length} files plus assets.`);
