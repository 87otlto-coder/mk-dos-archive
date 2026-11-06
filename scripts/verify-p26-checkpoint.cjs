#!/usr/bin/env node
/** Full P26 checkpoint: all three games plus four independent original MK2
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
const output=path.resolve(args['--report']);
assert.ok(fixtures.every(dir=>!contains(dir,output)),'Report must be outside original fixture directories');
let work;
if(args['--work']){
 work=path.resolve(args['--work']);
 assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Private exports must be outside repository and original fixtures');
 fs.mkdirSync(work,{recursive:true});work=fs.realpathSync(work);
}else work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p26-'));
assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Resolved export directory is not private');
const report={schema:'mkdos_p26_checkpoint_regression_v1',status:'RUNNING',startedAt:new Date().toISOString(),
 standardSuite:null,p21VisualBaseline:null,imageFamilies:[],census:null,browserInteractionVerified:false,nativePlaybackVerified:false,commercialAssetsIncluded:false};
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
  '--mk1',args['--mk1'],'--mk2',args['--mk2'],'--mk3',args['--mk3'],'--through','p25','--report',standard]);
 report.standardSuite=JSON.parse(fs.readFileSync(standard,'utf8'));
 assert.equal(report.standardSuite.status,'PASS');assert.deepEqual(report.standardSuite.notRun,[]);
 const suites=report.standardSuite.suites;
 report.census={mk1:suites.find(s=>s.name==='mk1 compatibility').assets,
  mk2:suites.find(s=>s.name==='MK2 p25-cumulative').uniqueAssets,mk3:suites.find(s=>s.name==='mk3 compatibility').assets};
 assert.deepEqual(report.census,{mk1:2656,mk2:5220,mk3:9186});
 report.p21VisualBaseline=run('P21 MK1/MK3 visual-plane baseline parity',process.execPath,['scripts/verify-p26-visual-baseline.cjs',standard]);save();
 for(const [pass,family]of [['p22','cave'],['p23','armory'],['p24','battle'],['p25','arena']]){
  const adapterReport=path.join(work,pass+'-adapter.json'),zip=path.join(work,pass+'-private.zip');
  const adapter=run(pass+' original export generation',process.execPath,['scripts/verify-mk2-'+pass+'-'+family+'.cjs',args['--mk2'],adapterReport,zip]);
  const independent=run(pass+' independent original-file PNG/index/opacity/provenance verification',process.env.PYTHON||'python',
   ['scripts/verify-mk2-'+pass+'-'+family+'-independent.py',args['--mk2'],'--export',zip]);
  const negatives=run(pass+' falsified export rejection',process.env.PYTHON||'python',
   ['scripts/test-mk2-'+pass+'-'+family+'-negative.py',args['--mk2'],zip,path.join(work,pass+'-negative')]);
  report.imageFamilies.push({pass,family,adapter,independent,negatives});save();
 }
 assert.equal(report.imageFamilies.reduce((n,f)=>n+(f.adapter.originalCaveImages||f.adapter.originalArmoryImages||f.adapter.originalBattleImages||f.adapter.originalArenaImages),0),102);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.stack||e.message;process.exitCode=1;}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({status:report.status,census:report.census,standardSuites:report.standardSuite?.suites?.length||0,
 independentImageFamilies:report.imageFamilies.length,privateExportDirectory:work,error:report.error},null,2));
