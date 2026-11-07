#!/usr/bin/env node
/** P56 runner safety controls. Synthetic empty directories only; no game files. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p56-preflight-'));
const dirs=['mk1','mk2','mk3'].map(name=>{const p=path.join(temporary,name);fs.mkdirSync(p);return p;});
const report=path.join(temporary,'result.json'),work=path.join(temporary,'work');
const cmd=['scripts/verify-p56-checkpoint.cjs'];
const games=dirs.flatMap((p,i)=>['--'+['mk1','mk2','mk3'][i],p]);
function rejection(name,argv,fragment){
 if(fs.existsSync(report))fs.unlinkSync(report);
 const run=spawnSync(process.execPath,[...cmd,...argv],{cwd:root,encoding:'utf8',timeout:10000,windowsHide:true});
 assert.notEqual(run.status,0,name+' unexpectedly passed');
 assert((run.stderr||'').includes(fragment),name+' wrong refusal: '+run.stderr);
 assert(!fs.existsSync(report),name+' wrote report before preflight');
 return name;
}
const negatives=[];
try{
 negatives.push(rejection('missing mk1',[...games.slice(2),'--report',report],'Required option --mk1'));
 negatives.push(rejection('missing mk3',[...games.slice(0,4),'--report',report],'Required option --mk3'));
 negatives.push(rejection('duplicate option',[...games,'--mk1',dirs[0],'--report',report],'Invalid or duplicate option'));
 negatives.push(rejection('invalid option',[...games,'--unknown','x','--report',report],'Invalid or duplicate option'));
 negatives.push(rejection('report in repository',[...games,'--report',path.join(root,'P56_DO_NOT_CREATE.json')],'Report must be outside'));
 negatives.push(rejection('report in game dir',[...games,'--report',path.join(dirs[1],'report.json')],'Report must be outside'));
 negatives.push(rejection('work in repository',[...games,'--report',report,'--work',path.join(root,'P56_DO_NOT_CREATE')],'Work must be outside'));
 negatives.push(rejection('work in game dir',[...games,'--report',report,'--work',path.join(dirs[2],'work')],'Work must be outside'));
 negatives.push(rejection('overlap game inputs',['--mk1',dirs[0],'--mk2',dirs[0],'--mk3',dirs[2],'--report',report],'Original game directories must not overlap'));
 negatives.push(rejection('report under work',[...games,'--report',path.join(work,'report.json'),'--work',work],'Report path and work directory must be separate'));
 const invalid=spawnSync(process.execPath,[...cmd,...games,'--report',report,'--work',work],{cwd:root,encoding:'utf8',timeout:30000,windowsHide:true});
 assert.notEqual(invalid.status,0,'synthetic empty game installations unexpectedly passed');
 assert(fs.existsSync(report),'runtime failure must preserve a private FAIL report');
 const parsed=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(parsed.status,'FAIL');assert.equal(parsed.originalFilesCommitted,false);
 assert.equal(parsed.sourcePromotedToMain,false);
 assert.equal(parsed.p51,null,'failing source gate must not fabricate a cumulative regression');
 console.log(JSON.stringify({pass:'P56_PREFLIGHT',status:'PASS',preflightRefusals:negatives.length,
  syntheticOriginalGameFailureRecorded:true,p51NotInvented:true,privateOutputOnly:true},null,2));
}finally{
 fs.rmSync(temporary,{recursive:true,force:true});
}
