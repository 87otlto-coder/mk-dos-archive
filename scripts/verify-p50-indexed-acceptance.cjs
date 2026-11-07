#!/usr/bin/env node
/** P50 cross-game indexed export acceptance: original fixtures and native planes;
 * embedded CMAP and legacy export compatibility. No network or game writes.
 * --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <json> --work <private-dir>
 * Export artwork stays in a private temp directory outside source and fixtures.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),args={};
for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i];
 if(!['--mk1','--mk2','--mk3','--report','--work'].includes(key)||!process.argv[i+1]||args[key])throw Error('Invalid or duplicate option '+key);
 args[key]=process.argv[i+1];
}
for(const key of ['--mk1','--mk2','--mk3','--report','--work'])if(!args[key])throw Error('Required option '+key);
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
}else work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p50-'));
assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Resolved export directory is not private');
const report={schema:'mkdos_p50_cross_game_indexed_acceptance_v1',status:'RUNNING',startedAt:new Date().toISOString(),steps:[],originalDataBrowserVerified:false,commercialAssetsIncluded:false};
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

function step(label,command,argv){const result=run(label,command,argv);report.steps.push({label,result});save();return result;}
save();
try{
 const node=process.execPath,python=process.env.PYTHON||'python',mk1=args['--mk1'],mk2=args['--mk2'],mk3=args['--mk3'];
 const first=step('MK1 compatibility',node,['scripts/verify-cross-game-p21.cjs','mk1',mk1]);
 const third=step('MK3 compatibility',node,['scripts/verify-cross-game-p21.cjs','mk3',mk3]);
 const second=step('Current MK2 acceptance',node,['scripts/verify-p45-mk2-acceptance.cjs','--mk2',mk2,'--report',path.join(work,'mk2-full.json'),'--work',path.join(work,'mk2-current')]);
 report.census={mk1:first.assets,mk2:second.uniqueAssets,mk3:third.assets};assert.deepEqual(report.census,{mk1:2656,mk2:5369,mk3:9186});
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/P46_CHECKPOINT_2026-11-07.json'),'utf8')).regression.standardSuite.suites;
 for(const [game,result]of [['mk1',first],['mk3',third]])assert.equal(result.visualPlaneSha256,baseline.find(s=>s.name===game+' compatibility').visualPlaneSha256);
 report.visualsUnchangedFromP46=true;
 step('MK1 indexed ZIP preservation',node,['scripts/verify-mk1-p50-indexed-export.cjs',mk1,path.join(work,'mk1-indexed')]);
 const indexed=path.join(work,'mk2-indexed');
 step('MK2 indexed ZIP preservation',node,['scripts/verify-mk2-p48-indexed-export.cjs',mk2,indexed]);
 step('Independent original MK2 indexed planes',python,['scripts/verify-mk2-p48-indexed-independent.py',mk2,indexed,'--report',path.join(work,'mk2-independent.json')]);
 const iff=path.join(work,'mk3-iff');
 step('All MK3 embedded-palette archives',node,['scripts/verify-mk3-p49-palette-export.cjs',mk3,iff]);
 step('Independent original IFF planes/CMAP',python,['scripts/verify-mk3-p49-palettes-independent.py',mk3,iff,'--report',path.join(work,'mk3-independent.json')]);
 const queue=path.join(work,'queue');
 step('Original source queues/APNG generation',node,['scripts/verify-mk2-p47-queue-exports.cjs',mk2,queue]);
 step('Independent APNG frames and edits',python,['scripts/verify-mk2-p47-apng-independent.py',queue,'--report',path.join(work,'queue-independent.json')]);
 step('Indexed plane refusal controls',node,['scripts/test-p48-indexed-export.cjs']);
 step('Embedded palette refusal controls',node,['scripts/test-p49-palette-export.cjs']);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.stack||e.message;process.exitCode=1;}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({status:report.status,census:report.census,completedSteps:report.steps.length,originalDataBrowserVerified:false,error:report.error},null,2));
