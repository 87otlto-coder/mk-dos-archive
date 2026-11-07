#!/usr/bin/env node
/** P56 consolidation gate — original MK1/MK2/MK3, P52/P54/P55 and frozen P51.
 * node scripts/verify-p56-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir>
 *   --report <private-report.json> [--work <private-work-dir>]
 *
 * Original commercial resources and decoded exports are NEVER written to Git.
 * Browser actions remain separately recorded as human-observed evidence.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const allowed=new Set(['--mk1','--mk2','--mk3','--report','--work']);
const args={};
if((process.argv.length-2)%2!==0)throw Error('Every option requires a value');
for(let i=2;i<process.argv.length;i+=2){
 const key=process.argv[i],value=process.argv[i+1];
 if(!allowed.has(key)||!value||args[key])throw Error('Invalid or duplicate option '+key);
 args[key]=value;
}
for(const key of ['--mk1','--mk2','--mk3','--report'])
 if(!args[key])throw Error('Required option '+key);
const inside=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
function canonical(p){
 let at=path.resolve(p);const remaining=[];
 while(!fs.existsSync(at)){
  const parent=path.dirname(at);assert.notEqual(at,parent,'No existing path ancestor');
  remaining.unshift(path.basename(at));at=parent;
 }
 return path.resolve(fs.realpathSync(at),...remaining);
}
const originals=['mk1','mk2','mk3'].map(game=>{
 const dir=fs.realpathSync(args['--'+game]);assert(fs.statSync(dir).isDirectory(),'Expected original '+game+' directory');
 assert(!inside(root,dir),'Original game directory must stay outside source checkout');
 args['--'+game]=dir;return dir;
});
for(let i=0;i<originals.length;i++)for(let j=i+1;j<originals.length;j++)
 assert(!inside(originals[i],originals[j])&&!inside(originals[j],originals[i]),
 'Original game directories must not overlap');
const out=canonical(args['--report']);
assert(!inside(root,out)&&originals.every(x=>!inside(x,out)),'Report must be outside repository and original fixtures');
const work= args['--work']?canonical(args['--work']):fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p56-'));
assert(!inside(root,work)&&originals.every(x=>!inside(x,work)),'Work must be outside repository and original fixtures');
assert(!inside(work,out)&&!inside(out,work),'Report path and work directory must be separate');
fs.mkdirSync(work,{recursive:true});
const workReal=fs.realpathSync(work);
assert(!inside(root,workReal)&&originals.every(x=>!inside(x,workReal)),'Work directory resolves into protected input');
const report={schema:'mkdos_p56_three_game_checkpoint_v1',status:'RUNNING',
 startedAt:new Date().toISOString(),baseline:'P51 consolidated source',
 games:{mk1:args['--mk1'],mk2:args['--mk2'],mk3:args['--mk3']},
 originalFilesCommitted:false,sourcePromotedToMain:false,
 uiEvidence:{p55TwoOriginalModulePreviewsUserObserved:true,
  source:'2026-11-07 user-supplied browser screenshots; two examples, not all 24',
  automatedBrowserClickVerified:false,automatedBrowserDownloadVerified:false},
 stepResults:[],p51:null,p52:null,p54:null,p55:null};
function save(){
 fs.mkdirSync(path.dirname(out),{recursive:true});
 const temporary=out+'.tmp';
 fs.writeFileSync(temporary,JSON.stringify(report,null,2)+'\n');
 fs.renameSync(temporary,out);
}
function run(label,executable,argv){
 process.stderr.write('P56: '+label+'\n');
 const result=spawnSync(executable,argv,{cwd:root,encoding:'utf8',timeout:3600000,
  maxBuffer:16*1024*1024,windowsHide:true});
 if(result.error||result.status!==0){
  const error=[result.error?.message,result.stderr?.trim(),result.stdout?.trim()].filter(Boolean).join('\n');
  throw Error(label+' failed: '+(error||'exit code '+result.status));
 }
 let resultJson;
 try{resultJson=JSON.parse(result.stdout);}catch{throw Error(label+' did not return JSON PASS');}
 assert.equal(resultJson.status,'PASS',label+' did not report PASS');
 report.stepResults.push({name:label,status:'PASS',finishedAt:new Date().toISOString()});
 save();return resultJson;
}
save();
try{
 const mk1=args['--mk1'];
 const p52=run('P52 187 original Kano indexed ZIPs and altered EXE guard',process.execPath,
  ['scripts/verify-mk1-p52-fallback-indexed.cjs',mk1,path.join(workReal,'p52.json')]);
 assert.equal(p52.originalKanoFrames,187);assert.equal(p52.indexedZipsChecked,187);
 assert.equal(p52.modifiedExeFallbackVerified,true);assert.equal(p52.alteredDescriptorFailsClosed,true);
 report.p52=p52;save();
 const p54=run('P54 24 source-header module/preview joins',process.execPath,
  ['scripts/verify-mk1-p54-stage-joins.cjs',mk1,path.join(workReal,'p54.json')]);
 assert.equal(p54.modules,24);assert.equal(p54.exactPreviewJoins,24);assert.equal(p54.uniqueHeaderResources,15);
 assert.equal(p54.reportSha256,'bb180450381a7f43ecca1f3bc6282bb1c6b0bc1d48cc77e8f9ad5e27092269db');
 report.p54=p54;save();
 const p55=run('P55 original header card to exact asset-ID navigation',process.execPath,
  ['scripts/verify-mk1-p55-stage-navigation.cjs',mk1,path.join(workReal,'p55.json')]);
 assert.equal(p55.exactNavigableModulePreviews,24);assert.equal(p55.linkedHeaders,15);
 assert.equal(p55.p54ReportSha256,p54.reportSha256);assert.equal(p55.sourceReportByteIdentical,true);
 assert.equal(p55.actualBrowserClickVerified,false);
 report.p55=p55;save();
 const synthetic=run('P55 eleven false-claim controls and search parity',process.execPath,
  ['scripts/test-p55-stage-gallery-navigation.cjs']);
 assert.equal(synthetic.deliberateFalseReportsRejected,11);
 const p54controls=run('P54 six false source-join controls',process.execPath,
  ['scripts/test-p54-mk1-stage-bindings.cjs']);
 assert.equal(p54controls.negativeControlsRejected,6);
 const p51out=path.join(workReal,'p51-three-game-report.json');
 run('P51 frozen full three-game cumulative acceptance',process.execPath,
  ['scripts/verify-p51-checkpoint.cjs','--mk1',args['--mk1'],'--mk2',args['--mk2'],
   '--mk3',args['--mk3'],'--report',p51out,'--work',path.join(workReal,'p51-original-outputs')]);
 const p51=JSON.parse(fs.readFileSync(p51out,'utf8'));
 assert.equal(p51.status,'PASS');
 assert.deepStrictEqual(p51.census,{mk1:2656,mk2:5369,mk3:9186});
 assert.equal(p51.completeCurrentGameGates,27);
 assert.equal(p51.imageFamilies.length,12);
 assert.equal(p51.totals.falsifiedExportsRejected,54);
 assert.equal(p51.totals.independentChecks,10712883);
 assert.equal(p51.indexedAcceptance.mk3Independent.sourceIffImages,416);
 assert.equal(p51.indexedAcceptance.mk1.indexedSamples,79);
 report.p51={status:p51.status,census:p51.census,completeCurrentGameGates:p51.completeCurrentGameGates,
  imageFamilies:p51.imageFamilies.length,independentChecks:p51.totals.independentChecks,
  falsifiedExportsRejected:p51.totals.falsifiedExportsRejected};
 report.status='PASS';
}catch(e){
 report.status='FAIL';report.error=e instanceof Error?(e.stack||e.message):String(e);
 process.exitCode=1;
}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({status:report.status,stepsPassed:report.stepResults.length,
 census:report.p51?.census,privateReport:out,privateWork:workReal,error:report.error},null,2));
