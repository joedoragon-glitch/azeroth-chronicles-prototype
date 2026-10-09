'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const suites=fs.readdirSync(path.join(__dirname,'..','tests'))
 .filter(x=>x.endsWith('.test.cjs')&&!x.includes('browser')).sort();
let failures=[],passes=0;
for(const name of suites){
 const r=cp.spawnSync(process.execPath,[path.join(__dirname,'..','tests',name)],{encoding:'utf8',timeout:120000,maxBuffer:5e6});
 if(r.status===0){passes++;continue;}
 const lines=(r.stderr+'\n'+r.stdout).split('\n').filter(Boolean);
 const snippet=lines.filter(x=>/AssertionError|Error:|not ok|^\s+at |FAIL|error|Cannot|Assertion/.test(x)).slice(0,14);
 failures.push({name,status:r.status,signal:r.signal,problem:snippet});
}
for(const failure of failures)console.log('REGRESSION_FAILURE|'+JSON.stringify(failure));
console.log('AUDIT_TEST_SUMMARY|'+JSON.stringify({passed:passes,failed:failures.length,total:suites.length}));
if(failures.length)process.exitCode=1;
