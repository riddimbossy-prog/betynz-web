#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),DIST=path.join(ROOT,"dist");
fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
const files=[
  "index.html","404.html","styles.css","runtime-config.js","data-source.js",
  "nav-core.js","experience.js","boot.js","app.js","rebel-engine-core.js",
  "olympian-engine-core.js","manifest.webmanifest","service-worker.js","robots.txt",
  "sitemap.xml","CNAME","privacy.html","terms.html","responsible.html"
];
for(const file of files){
  const src=path.join(ROOT,file);
  if(!fs.existsSync(src))throw new Error(`Missing release file: ${file}`);
  fs.copyFileSync(src,path.join(DIST,file));
}
fs.cpSync(path.join(ROOT,"assets"),path.join(DIST,"assets"),{recursive:true});
fs.writeFileSync(path.join(DIST,".nojekyll"),"");
const bytes=files.reduce((sum,file)=>sum+fs.statSync(path.join(DIST,file)).size,0);
console.log(`Built Betynz v6.2.0: ${files.length} files plus assets; shell ${(bytes/1024/1024).toFixed(2)} MB.`);
