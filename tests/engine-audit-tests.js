"use strict";
const assert=require("assert"),audit=require("../engine-audit.js");
const match={id:1,home:"A",away:"B",kickoff:"2026-07-17T18:00:00Z"};
const pass={bet:true,primary:"Home Win",confidence:84,dataQuality:80,ppgAgreement:{pass:true,reason:"same direction"},reasons:[],warnings:[]};
let x=audit.enforceQuarantine("nike",pass,match,{});assert.equal(x.output.bet,true);assert.equal(x.audit.status,"APPROVED");
x=audit.enforceQuarantine("nike",pass,match,{nike:{reason:"review"}});assert.equal(x.output.bet,false);assert.equal(x.audit.status,"REJECTED");
const bad={...pass,ppgAgreement:{pass:false,reason:"conflict"}};x=audit.enforceQuarantine("ares",bad,match,{});assert.equal(x.audit.passed,false);assert(x.audit.failedRules.includes("Overall/split PPG agreement"));
console.log("Engine audit tests passed.");
