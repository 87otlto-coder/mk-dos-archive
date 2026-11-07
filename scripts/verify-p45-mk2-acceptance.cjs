#!/usr/bin/env node
/** P45 current MK2 acceptance: cumulative, report integration and independent original-file
 * coverage/export verifiers and falsification suites. No network or game writes.
 * --mk2 <dir> --report <json> --work <private-dir>
 * Export artwork stays in a private temp directory outside source and fixtures.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),args={};
for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i];
 if(!['--mk2','--report','--work'].includes(key)||!process.argv[i+1]||args[key])throw Error('Invalid or duplicate option '+key);
 args[key]=process.argv[i+1];
}
for(const key of ['--mk2','--report','--work'])if(!args[key])throw Error('Required option '+key);
const contains=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
const fixtures=['mk2'].map(game=>{const dir=fs.realpathSync(args['--'+game]);
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
}else work=fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p45-'));
assert.ok(!contains(root,work)&&fixtures.every(dir=>!contains(dir,work)),'Resolved export directory is not private');
const report={schema:'mkdos_p45_current_mk2_acceptance_v1',status:'RUNNING',startedAt:new Date().toISOString(),
 originalDataBrowserVerified:false,nativeRuntimeVerified:false,commercialAssetsIncluded:false,notRun:['mk1','mk3']};
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
 const standard=path.join(work,'mk2-standard.json');
 run('current cumulative MK2 suites',process.execPath,['scripts/verify-p21-checkpoint.cjs','--mk2',args['--mk2'],'--through','p38','--report',standard]);
 report.standardSuite=JSON.parse(fs.readFileSync(standard,'utf8'));assert.equal(report.standardSuite.suites.length,23);
 assert.deepEqual(report.standardSuite.notRun,['mk1','mk3']);
 report.uniqueAssets=report.standardSuite.suites.find(s=>s.name==='MK2 p35-cumulative').uniqueAssets;assert.equal(report.uniqueAssets,5369);save();
 report.p40=run('PORTAL existing-effect gate',process.execPath,['scripts/verify-mk2-p40-portal-coverage.cjs',args['--mk2']]);save();
 const coverage=path.join(work,'current-coverage.json'),archive=path.join(work,'43-existing-effects.zip'),previews=path.join(work,'p43-observed-preview-hashes.json');
 report.p43=run('TOWER gate and existing-effect export',process.execPath,['scripts/verify-mk2-p43-tower-coverage.cjs',args['--mk2'],coverage,archive]);
 fs.writeFileSync(previews,JSON.stringify(report.p43,null,2)+'\n');save();
 report.independent=run('independent original-file report and 43-effect export oracle',process.env.PYTHON||'python',
 ['scripts/verify-mk2-p44-effects-and-coverage.py',args['--mk2'],coverage,archive,previews,'--report',path.join(work,'independent.json')]);
 assert.equal(report.independent.independentNativeReferences,315);assert.equal(report.independent.falseReportsRejected,8);assert.equal(report.independent.falseExportsRejected,6);
 report.accountingControls=run('source-only interval controls',process.execPath,['scripts/test-p37-source-coverage.cjs']);
 report.portalPreflight=run('source-only PORTAL claim controls',process.execPath,['scripts/verify-mk2-p40-portal-preflight.cjs']);
 report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.stack||e.message;process.exitCode=1;}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({status:report.status,uniqueAssets:report.uniqueAssets,standardSuites:report.standardSuite?.suites?.length||0,
 qualifiedReferences:report.independent?.independentNativeReferences,notRun:report.notRun,error:report.error},null,2));
