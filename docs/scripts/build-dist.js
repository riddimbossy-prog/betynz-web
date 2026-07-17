#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),DIST=path.join(ROOT,"dist");
fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
const files=[
  "index.html","404.html","styles.css","nav-core.js","boot.js","app.js",
  "rebel-engine-core.js","olympian-engine-core.js","data.js",
  "manifest.webmanifest","service-worker.js","robots.txt","sitemap.xml","CNAME",
  "api-status.json"
];
for(const file of files){
  const src=path.join(ROOT,file);
  if(fs.existsSync(src))fs.copyFileSync(src,path.join(DIST,file));
}
fs.cpSync(path.join(ROOT,"assets"),path.join(DIST,"assets"),{recursive:true});
fs.writeFileSync(path.join(DIST,".nojekyll"),"");
console.log(`Built Betynz Core release with ${files.filter(f=>fs.existsSync(path.join(ROOT,f))).length} files plus assets.`);
