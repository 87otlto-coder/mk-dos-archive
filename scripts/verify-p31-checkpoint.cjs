#!/usr/bin/env node
/** Full P31 checkpoint: all three games plus eight independent original MK2
 * image/export verifiers and falsification suites. No network or game writes.
 * --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <json> [--work <private-dir>]
 * Export artwork stays in a private temp directory outside source and fixtures.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),args={};
for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i];
 if(!['--mk1','--mk2','--mk3','--report','--work'].includes(key)||!process.argv[i+1]||args[key])throw Error('Invalid or duplicate option '+key);
 args[key]=process.argv[i+1];
}
for(const key of ['--mk1','--mk2','--mk3','--report'])if(!args[key])throw Error('Required option '+key);
const contains=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
const fixtures=['mk1','mk2','mk3'].map(game=>{const dir=fs.realpathSync(args['--'+game]);
 assert.ok(fs.statSync(dir).isDirectory(),'Expected directory for '+game);args['--'+game]=dir;return dir;});
function canonical(target){
 let at=path.resolve(target);const missing=[];
 while(!fs.existsSync(at)){missing.unshift(path.basename(at));const parent=path.dirname(at);assert.notEqual(parent,at);at=parent;}
 return path.resolve(fs.realpathSync(at),...missing);
}
const output=canonical(args['--report']);
assert.ok(!contains(root,output)&&fixtures.every(dir=>!contains(dir,output)),'Report must be outside repository and original fixture directories');
let work;
if(args['--work']){
 work=canonical(args['--work']);
 assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Private exports must be outside repository and original fixtures');
 fs.mkdirSync(work,{recursive:true});work=fs.realpathSync(work);
}else work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p31-'));
assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Resolved export directory is not private');
const report={schema:'mkdos_p31_checkpoint_regression_v1',status:'RUNNING',startedAt:new Date().toISOString(),
 standardSuite:null,p21VisualBaseline:null,p26VisualBaseline:null,imageFamilies:[],census:null,browserInteractionVerified:false,nativePlaybackVerified:false,commercialAssetsIncluded:false};
function save(){fs.mkdirSync(path.dirname(output),{recursive:true});const temp=output+'.tmp';fs.writeFileSync(temp,JSON.stringify(report,null,2)+'\n');fs.renameSync(temp,output);}
function run(label,command,argv){
 process.stderr.write('Running '+label+'\n');
 const result=spawnSync(command,argv,{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:16*1024*1024,windowsHide:true});
 if(result.error||result.status!==0){
  const detail=[result.error?.message,result.stderr?.trim(),result.stdout?.trim()].filter(Boolean).join('\n');
  throw Error(label+': '+(detail||'exit '+result.status));
 }
 const parsed=JSON.parse(result.stdout);assert.equal(parsed.status,'PASS',label+' must report PASS');return parsed;
}
save();
try{
 const standard=path.join(work,'three-game-regression.json');
 run('complete current three-game fixture regression',process.execPath,['scripts/verify-p21-checkpoint.cjs',
  '--mk1',args['--mk1'],'--mk2',args['--mk2'],'--mk3',args['--mk3'],'--through','p30','--report',standard]);
 report.standardSuite=JSON.parse(fs.readFileSync(standard,'utf8'));
 assert.equal(report.standardSuite.status,'PASS');assert.deepEqual(report.standardSuite.notRun,[]);
 const suites=report.standardSuite.suites;
 report.census={mk1:suites.find(s=>s.name==='mk1 compatibility').assets,
  mk2:suites.find(s=>s.name==='MK2 p30-cumulative').uniqueAssets,mk3:suites.find(s=>s.name==='mk3 compatibility').assets};
 assert.deepEqual(report.census,{mk1:2656,mk2:5304,mk3:9186});
 report.p21VisualBaseline=run('P21 MK1/MK3 visual-plane baseline parity',process.execPath,['scripts/verify-p26-visual-baseline.cjs',standard]);save();
 const p26=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/P26_CHECKPOINT_REGRESSION_2026-11-06.json'),'utf8')).regression.standardSuite;
 report.p26VisualBaseline=['mk1','mk3'].map(game=>{
  const name=game+' compatibility',now=suites.find(s=>s.name===name),before=p26.suites.find(s=>s.name===name);
  assert.equal(now.assets,before.assets,game+' census differs from P26');
  assert.equal(now.visualPlaneSha256,before.visualPlaneSha256,game+' visual planes differ from P26');
  return {game,visualPlaneSha256:now.visualPlaneSha256,unchangedFromP26:true,
   wholeEvidenceArchiveHashesEqual:JSON.stringify(now.packageHashes)===JSON.stringify(before.packageHashes)};
 });save();
 const families=[['p22','cave',49,3],['p23','armory',18,3],['p24','battle',20,4],['p25','arena',15,3],
  ['p27','tomb',16,4],['p28','portal',13,4],['p29','tower',6,5],['p30','forest',49,5]];
 for(const [pass,family,expectedImages,expectedNegatives]of families){
  const adapterReport=path.join(work,pass+'-adapter.json'),zip=path.join(work,pass+'-private.zip');
  const adapter=run(pass+' original export generation',process.execPath,['scripts/verify-mk2-'+pass+'-'+family+'.cjs',args['--mk2'],adapterReport,zip]);
  const independent=run(pass+' independent original-file PNG/index/opacity/provenance verification',process.env.PYTHON||'python',
   ['scripts/verify-mk2-'+pass+'-'+family+'-independent.py',args['--mk2'],'--export',zip]);
  const negatives=run(pass+' falsified export rejection',process.env.PYTHON||'python',
   ['scripts/test-mk2-'+pass+'-'+family+'-negative.py',args['--mk2'],zip,path.join(work,pass+'-negative')]);
  const field='original'+family[0].toUpperCase()+family.slice(1)+'Images';
  assert.equal(adapter[field],expectedImages,pass+' original image count');
  assert.equal(independent[field],expectedImages,pass+' independent image count');
  assert.equal(negatives.falsifiedExportsRejected,expectedNegatives,pass+' false-export controls');
  assert.equal(negatives.cleanExportReverified,true,pass+' clean export recheck');
  report.imageFamilies.push({pass,family,images:expectedImages,adapter,independent,negatives});save();
 }
 assert.equal(report.standardSuite.suites.length,19,'19 complete source-fixture suites');
 report.totals={originalImageRepresentations:report.imageFamilies.reduce((n,f)=>n+f.images,0),
  indexedPixels:report.imageFamilies.reduce((n,f)=>n+f.adapter.indexedPixels,0),
  independentChecks:report.imageFamilies.reduce((n,f)=>n+f.independent.checks,0),
  falsifiedExportsRejected:report.imageFamilies.reduce((n,f)=>n+f.negatives.falsifiedExportsRejected,0)};
 assert.equal(report.totals.originalImageRepresentations,186);
 assert.equal(report.totals.indexedPixels,691028);
 assert.equal(report.totals.falsifiedExportsRejected,31);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.stack||e.message;process.exitCode=1;}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({status:report.status,census:report.census,standardSuites:report.standardSuite?.suites?.length||0,
 independentImageFamilies:report.imageFamilies.length,privateExportDirectory:work,error:report.error},null,2));
