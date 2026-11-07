#!/usr/bin/env node
/** P21 repeatable original-fixture regression runner. No network or game writes.
 * node scripts/verify-p21-checkpoint.cjs --mk2 <dir> [--mk1 <dir>] [--mk3 <dir>] [--through p21|p22|p23|p24|p25|p27|p28|p29|p30|p32|p33|p34] --report <json>
 * Defaults to current P34; earlier --through choices require matching historical source.
 * Missing optional games are explicitly NOT_RUN, never inferred as passing.
 */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const args={};for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i];
 if(!['--mk1','--mk2','--mk3','--through','--report'].includes(key)||!process.argv[i+1]||args[key])throw Error('Invalid or duplicate option '+key);
 args[key]=process.argv[i+1];
}
if(!args['--mk2']||!args['--report'])throw Error('Require --mk2 <directory> --report <output.json>');
const through=args['--through']||'p34';
if(!['p21','p22','p23','p24','p25','p27','p28','p29','p30','p32','p33','p34'].includes(through))throw Error('Unknown source checkpoint '+through);
const reportPath=path.resolve(args['--report']);
for(const key of ['--mk1','--mk2','--mk3'])if(args[key]){
 const fixture=fs.realpathSync(args[key]);
 if(!fs.statSync(fixture).isDirectory())throw Error('Fixture must be an extracted directory: '+key);
 const relative=path.relative(fixture,reportPath);
 if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('Report must be outside every game directory');
 args[key]=fixture;
}
const report={schema:'mkdos_checkpoint_regression_v2',through,status:'RUNNING',startedAt:new Date().toISOString(),
 suites:[],notRun:['--mk1','--mk3'].filter(k=>!args[k]).map(k=>k.slice(2)),browserInteractionVerified:false,commercialAssetsIncluded:false};
function run(name,command,argv){
 process.stderr.write('Running '+name+'\n');
 const r=spawnSync(command,argv,{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,windowsHide:true});
 if(r.error||r.status!==0)throw Error(name+': '+(r.error?.message||r.stderr||r.stdout||'exit '+r.status));
 const result=JSON.parse(r.stdout);if(result.status!=='PASS')throw Error(name+' did not report PASS');
 report.suites.push({name,...result});
}
try{
 run('MK2 input identity',process.env.PYTHON||'python',['scripts/verify-mk2-p16-fixture-identity.py',args['--mk2']]);
 const current=through==='p34'?['p34-cumulative','p34-armory-tail','p33-pit','p32-forest-tail','p30-forest','p29-tower','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p33'?['p33-cumulative','p33-pit','p32-forest-tail','p30-forest','p29-tower','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p32'?['p32-cumulative','p32-forest-tail','p30-forest','p29-tower','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p30'?['p30-cumulative','p30-forest','p29-tower','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p29'?['p29-cumulative','p29-tower','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p28'?['p28-cumulative','p28-portal','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p27'?['p27-cumulative','p27-tomb','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p25'?['p25-cumulative','p25-arena','p24-battle','p23-armory','p22-cave']:
  through==='p24'?['p24-cumulative','p24-battle','p23-armory','p22-cave']:
  through==='p23'?['p23-cumulative','p23-armory','p22-cave']:
  through==='p22'?['p22-cumulative','p22-cave']:['p20-cumulative'];
 for(const suffix of [...current,'p12-intro','p13-mountain','p14-source-viewport','p15-observed-floors','p17-unassigned-images','p18-ordered-sequences','p19-source-order-queue'])
  run('MK2 '+suffix,process.execPath,['scripts/verify-mk2-'+suffix+'.cjs',args['--mk2']]);
 for(const game of ['mk1','mk3'])if(args['--'+game])run(game+' compatibility',process.execPath,['scripts/verify-cross-game-p21.cjs',game,args['--'+game]]);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1;}
report.finishedAt=new Date().toISOString();
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,suites:report.suites.length,notRun:report.notRun,error:report.error},null,2));
