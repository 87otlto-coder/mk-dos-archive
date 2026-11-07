#!/usr/bin/env node
/** P61 input/path/source-checkpoint preflight refusal controls; NO DOS media. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const checkout=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p61-preflight-'));
const dirs=['mk1','mk2','mk3'].map(name=>{const d=path.join(temp,name);fs.mkdirSync(d);return d;});
const normal=dirs.flatMap((dir,i)=>['--'+['mk1','mk2','mk3'][i],dir]);
const out=path.join(temp,'private-p61-report.json'),work=path.join(temp,'private-work');
const script='scripts/verify-p61-checkpoint.cjs',refusals=[];
function reject(label,args,pattern){
 if(fs.existsSync(out))fs.unlinkSync(out);
 const r=spawnSync(process.execPath,[script,...args],{cwd:checkout,encoding:'utf8',timeout:30000,windowsHide:true});
 assert.notEqual(r.status,0,label+' unexpectedly passed');
 assert.match((r.stderr||'')+(r.stdout||''),pattern,label+' wrong refusal');
 assert(!fs.existsSync(out),label+' wrote a PASS or FAIL report before full preflight');
 refusals.push(label);
}
try{
 reject('missing MK1',[...normal.slice(2),'--report',out],/required option --mk1/);
 reject('missing MK2',[...normal.slice(0,2),...normal.slice(4),'--report',out],/required option --mk2/);
 reject('duplicate MK1',[...normal,'--mk1',dirs[0],'--report',out],/invalid or duplicate option/);
 reject('unknown --main',[...normal,'--main','true','--report',out],/invalid or duplicate option/);
 reject('missing game directory',['--mk1',dirs[0],'--mk2',path.join(temp,'absent'),
  '--mk3',dirs[2],'--report',out],/ENOENT|no such file/i);
 reject('source checkout is not original MK1',['--mk1',checkout,'--mk2',dirs[1],
  '--mk3',dirs[2],'--report',out],/commercial game folder inside source checkout/);
 reject('overlapping original directories',['--mk1',dirs[0],'--mk2',dirs[0],
  '--mk3',dirs[2],'--report',out],/original game folders must not overlap/);
 reject('report in checkout',[...normal,'--report',path.join(checkout,'P61_DO_NOT_CREATE.json')],
  /report must be outside source checkout/);
 reject('report in original game',[...normal,'--report',path.join(dirs[0],'report.json')],
  /report must be outside source checkout/);
 reject('work in checkout',[...normal,'--report',out,'--work',path.join(checkout,'P61_DO_NOT_CREATE')],
  /work must be outside source checkout/);
 reject('work in original game',[...normal,'--report',out,'--work',path.join(dirs[2],'work')],
  /work must be outside source checkout/);
 reject('report nested in work',[...normal,'--report',path.join(work,'report.json'),'--work',work],
  /report path and work dir must not overlap/);
 reject('work nested beneath report path',[...normal,'--report',path.join(temp,'future'),
  '--work',path.join(temp,'future','work')],/report path and work dir must not overlap/);
 console.log(JSON.stringify({pass:'P61_PREFLIGHT',status:'PASS',unsafeInputsRejected:refusals.length,
  originalGameDataUsed:false,invalidInputsCreatedNoCheckpointReport:true,
  mainBranchNeverWritten:true,sourceOnly:true},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
