"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

class EventHub{
  constructor(){this.listeners=new Map()}
  addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(handler)}
  dispatchEvent(event){for(const handler of this.listeners.get(event.type)||[])handler(event);return true}
}
class CustomEventMock{constructor(type,init={}){this.type=type;this.detail=init.detail}}

const payload={
  date:"2026-07-18",generatedAt:"2026-07-18T20:00:00Z",
  fixtures:[
    {fixtureId:101,kickoff:"2026-07-18T18:00:00Z",status:"NS",league:{name:"Premier League",country:"England"},home:{name:"Alpha FC"},away:{name:"Beta United"},fulltime:{home:null,away:null},halftime:{home:null,away:null}},
    {fixtureId:102,kickoff:"2026-07-18T19:00:00Z",status:"NS",league:{name:"National Cup",country:"Ghana"},home:{name:"Accra Stars"},away:{name:"Kumasi Kings"},fulltime:{home:null,away:null},halftime:{home:null,away:null}}
  ],
  predictions:[
    {fixtureId:101,kickoff:"2026-07-18T18:00:00Z",status:"NS",league:{name:"Premier League",country:"England"},home:{name:"Alpha FC"},away:{name:"Beta United"},primary:{market:"Totals",selection:"Over 1.5 Goals",confidence:91,tier:"A1",qualified:true},reasons:["Goal support passed."],engines:{zeus:{qualified:true}}}
  ],
  recentResults:[],stats:{today:{fixtures:2,predictions:1}},
  processing:{state:"running",totalFixtures:2,readyPredictions:1,pending:1,withheld:0}
};

(async()=>{
  const storage=new Map();
  const window=new EventHub();
  window.BETYNZ_RUNTIME_CONFIG={apiBases:["https://mock.betynz.test"],refreshMs:300000};
  const document=new EventHub();document.visibilityState="visible";
  const context={
    window,document,console,CustomEvent:CustomEventMock,AbortController,
    setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
    fetch:async()=>({ok:true,status:200,statusText:"OK",json:async()=>payload})
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("data-source.js","utf8"),context,{filename:"data-source.js"});
  await window.BetynzDataSource.loadDate("2026-07-18");
  assert.equal(window.MATCHES.length,2,"all database fixtures must be retained");
  assert.equal(window.MATCHES[0].home,"Alpha FC");
  assert.equal(window.MATCHES[0].zeusDecision.market,"Over 1.5 Goals");
  assert.equal(window.MATCHES[0].zeusDecision.grade,"A1");
  assert.equal(window.MATCHES[1].databaseState,"analysing","unpublished fixtures must remain visible as analysing");
  assert.equal(window.BETYNZ_META.fixtureCount,2);
  assert.equal(window.BETYNZ_META.qualifiedCount,1);
  assert.equal(window.BETYNZ_META.source,"live-database");
  console.log("Database source test passed: all fixtures render and qualified predictions map to Zeus.");
})().catch(error=>{console.error(error);process.exitCode=1});
