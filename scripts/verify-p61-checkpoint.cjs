#!/usr/bin/env node
/** P61 fifth-pass ORIGINAL MK1/MK2/MK3 checkpoint gate.
 * Reuses accepted P56/P51 instead of truncating independent family/animation tests.
 * Adds P57–P60 original-fixture, independent Tomb and false-evidence acceptance.
 *
 * node scripts/verify-p61-checkpoint.cjs --mk1 <original MK1 dir> --mk2 <original MK2 dir>
 *   --mk3 <original MK3 dir> --report <PRIVATE-report.json> [--work <PRIVATE-work-dir>]
 *
 * Does not mutate original game files or write commercial content into Git.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const allowed=new Set(['--mk1','--mk2','--mk3','--report','--work']),options={};
if((process.argv.length-2)%2!==0)throw Error('P61: option without value');
for(let i=2;i<process.argv.length;i+=2){
 const key=process.argv[i],val=process.argv[i+1];
 if(!allowed.has(key)||!val||Object.hasOwn(options,key))throw Error('P61: invalid or duplicate option '+key);
 options[key]=val;
}
for(const name of ['--mk1','--mk2','--mk3','--report'])if(!options[name])throw Error('P61: required option '+name);
const contains=(parent,child)=>{const rel=path.relative(parent,child);
 return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
function canonical(target){
 let at=path.resolve(target),suffix=[];
 while(!fs.existsSync(at)){
  const parent=path.dirname(at);assert.notEqual(parent,at,'P61 path has no existing ancestor');
  suffix.unshift(path.basename(at));at=parent;
 }
 return path.resolve(fs.realpathSync(at),...suffix);
}
const games={};
for(const key of ['mk1','mk2','mk3']){
 const dir=fs.realpathSync(options['--'+key]);
 assert(fs.statSync(dir).isDirectory(),'P61 original '+key+' directory is missing');
 assert(!contains(root,dir),'P61 commercial game folder inside source checkout: '+key);
 games[key]=dir;
}
const originals=Object.values(games);
for(let i=0;i<originals.length;i++)for(let j=i+1;j<originals.length;j++)
 assert(!contains(originals[i],originals[j])&&!contains(originals[j],originals[i]),
  'P61 original game folders must not overlap');
const output=canonical(options['--report']);
assert(!contains(root,output)&&originals.every(dir=>!contains(dir,output)),
 'P61 report must be outside source checkout and original game directories');
const work=options['--work']?canonical(options['--work']):canonical(fs.mkdtempSync(path.join(os.tmpdir(),'mkdos-p61-')));
assert(!contains(root,work)&&originals.every(dir=>!contains(dir,work)),
 'P61 work must be outside source checkout and original game directories');
assert(!contains(work,output)&&!contains(output,work),'P61 report path and work dir must not overlap');
function git(args){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:20000,windowsHide:true});
 if(r.error||r.status!==0)throw Error('P61 Git source audit failed: '+[r.error?.message,r.stderr].filter(Boolean).join(' '));
 return r.stdout.trim();
}
const checkout=fs.realpathSync(git(['rev-parse','--show-toplevel']));
assert.equal(checkout,root,'P61 Git source root mismatch');
const branch=git(['rev-parse','--abbrev-ref','HEAD']);
assert(new Set(['develop','interim/p79-original-extraction']).has(branch),
 'P61 requires clean develop or explicitly approved P79–P81 interim branch, not '+branch);
const changes=git(['status','--porcelain','--untracked-files=no']);
assert.equal(changes,'','P61 requires clean tracked source (commit or revert local modifications)');
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean);
const forbidden=tracked.filter(file=>/\.(exe|gra|ftr|u8|mid|wav|ogg|mp3|flac|png|gif|bmp|jpg|jpeg|webp|zip|bin|7z|rar)$/i.test(file));
assert.deepStrictEqual(forbidden,[],'P61 original commercial files/media must not be tracked');
for(const required of ['PROJECT_STATUS.md','src/core/assets/collection.ts',
  'src/core/assets/mk2TombComponentsP60.ts','scripts/verify-p56-checkpoint.cjs',
  'scripts/verify-p57-cross-game-gallery.cjs','scripts/verify-mk2-p58-palette-evidence.cjs',
  'scripts/verify-mk2-p60-tomb.cjs'])
 assert(tracked.includes(required),'P61 missing tracked required source: '+required);
const source={branch,commit:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),
 trackedFiles:tracked.length,noncommercialTrackedFiles:true,cleanTrackedCheckout:true,
 untrackedFiles:git(['ls-files','--others','--exclude-standard','-z']).split('\0').filter(Boolean).length};
fs.mkdirSync(work,{recursive:true});
const workResolved=fs.realpathSync(work);
assert(!contains(root,workResolved)&&originals.every(dir=>!contains(dir,workResolved)),
 'P61 resolved private work dir unsafe');
const report={format:'mkdos_p61_fifth_pass_original_three_game_checkpoint_v1',
 status:'RUNNING',startedAt:new Date().toISOString(),source,
 originalGameDirectories:games,commercialAssetsCommitted:false,
 mainPromoted:false,originalFilesModified:false,
 browserEvidence:{p57SampledGalleryScreenshotsUserObserved:true,
  p59OriginalMK2BrowserExportPreviouslyVerified:true,
  p60UserUploadedZIPIndependentlyInspected:true,
  p61NewInteractiveBrowserReplay:false},
 steps:[],p56:null,p57:null,p58:null,p59Independent:null,p60:null};
function save(){
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const temporary=output+'.tmp';fs.writeFileSync(temporary,JSON.stringify(report,null,2)+'\n');fs.renameSync(temporary,output);
}
function run(label,command,args){
 process.stderr.write('P61: '+label+'\n');
 const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:10800000,
  maxBuffer:16*1024*1024,windowsHide:true});
 if(r.error||r.status!==0)throw Error('P61 '+label+' FAILED: '+[r.error?.message,r.stderr?.trim(),r.stdout?.trim()].filter(Boolean).join('\n'));
 return r.stdout.trim();
}
function verified(label,command,args,assertions){
 const stdout=run(label,command,args);
 let data;try{data=JSON.parse(stdout);}catch{throw Error('P61 '+label+' output not valid JSON PASS');}
 assert.equal(data.status,'PASS',label+' status must be PASS');
 assertions(data);
 report.steps.push({label,status:'PASS',date:new Date().toISOString()});
 save();return data;
}
const n=process.execPath,mk1=games.mk1,mk2=games.mk2,mk3=games.mk3;
save();
try{
 const p56=verified('P56 full legacy three-game+P51 cumulative gate',n,
 ['scripts/verify-p56-checkpoint.cjs','--mk1',mk1,'--mk2',mk2,'--mk3',mk3,
 '--report',path.join(workResolved,'p56-report.json'),
 '--work',path.join(workResolved,'p56-original-artifacts')],x=>{
  assert.equal(x.stepsPassed,6);assert.deepStrictEqual(x.census,{mk1:2656,mk2:5369,mk3:9186});
 });
 const full=JSON.parse(fs.readFileSync(path.join(workResolved,'p56-report.json'),'utf8'));
 assert.equal(full.status,'PASS');assert.equal(full.p51?.status,'PASS');
 assert.deepStrictEqual(full.p51.census,{mk1:2656,mk2:5369,mk3:9186});
 assert.equal(full.p51.completeCurrentGameGates,27);
 assert.equal(full.p51.independentChecks,10712883);
 assert.equal(full.p51.falsifiedExportsRejected,54);
 report.p56={stepsPassed:6,census:p56.census,fullP51:full.p51,originalReport:'p56-report.json'};save();
 const p57=verified('P57 original three-game source thumbnails',n,
 ['scripts/verify-p57-cross-game-gallery.cjs',mk1,mk2,mk3,path.join(workResolved,'p57-report.json')],x=>{
  assert.equal(x.summaries.mk1.assets,2656);
  assert.equal(x.summaries.mk1.sourceBackedThumbnails,24);
  assert.equal(x.summaries.mk1.headerCount,15);
  assert.equal(x.summaries.mk2.assets,5369);
  assert.equal(x.summaries.mk2.sourceBackedThumbnails,10);
  assert.equal(x.summaries.mk3.assets,9186);
  assert.equal(x.summaries.mk3.sourceBackedThumbnails,416);
  assert.equal(x.summaries.mk3.arcadeStageNamesAssigned,false);
  assert.equal(x.syntheticArtworkAdded,false);
  assert.equal(x.nativePaletteOrSceneClaimsAdded,false);
 });
 report.p57=p57.summaries;save();
 const p58=verified('P58 original MK2 palette and screenshot-floor evidence',n,
 ['scripts/verify-mk2-p58-palette-evidence.cjs',mk2,path.join(workResolved,'p58-report.json')],x=>{
  assert.equal(x.mk2Assets,5369);assert.equal(x.sourceVerifiedForestIndexColorPairs,5);
  assert.equal(x.originalScreenshotWitnessedFloorStrips,2);assert.equal(x.originalSourceHashesVerified,4);
  assert.equal(x.allOriginalIndexPlanesPreserved,true);
  assert.equal(x.nativeDACPaletteOwnershipAsserted,false);
  assert.equal(x.completeStageCompositionsAsserted,false);
 });
 report.p58={mk2Assets:p58.mk2Assets,forestPairs:5,floorStrips:2};save();
 const p59=verified('P59 independent original MK2 decoder vs exported architecture/sky',n,
 ['scripts/verify-mk2-p61-tomb-independent.cjs',mk2,
  path.join(workResolved,'p59-original-samples.zip'),path.join(workResolved,'p59-independent.json')],x=>{
  assert.equal(x.mk2Assets,5369);assert.equal(x.architectureIndependentSamples,2650);
  assert.equal(x.skyIndependentSamples,823);assert.equal(x.originalSourceDecoderCompared,true);
  assert.equal(x.originalScreenshotProvided,false);assert.equal(x.nativeCameraOrPaletteOwnershipVerified,false);
  assert.match(x.p59ArchiveSha256,/^[0-9a-f]{64}$/);
 });
 report.p59Independent={architecture:2650,sky:823,p59ArchiveSha256:p59.p59ArchiveSha256,
  note:'Original GRA descriptor decoder compared; screenshot file not separately provided in this run'};save();
 const p60=verified('P60 original Tomb independent components P59/P15 parity',n,
 ['scripts/verify-mk2-p60-tomb.cjs',mk2,path.join(workResolved,'p60-report.json')],x=>{
  assert.equal(x.mk2Assets,5369);assert.equal(x.independentlyPackagedComponents,3);
  assert.equal(x.p59OpaqueSourceSamples,3473);assert.equal(x.originalPackedFloorPixels,15360);
  assert.equal(x.p59ArchitectureSkyFilesByteIdentical,true);assert.equal(x.p15FloorIndexedMasksByteIdentical,true);
  assert.equal(x.p15FloorRgbaPixelIdentical,true);assert.equal(x.originalSharedCameraClaimed,false);
  assert.equal(x.fullStageCompositionClaimed,false);assert.equal(x.nativeDACOwnershipClaimed,false);
  assert.equal(x.originalAssetRepresentationsChanged,false);
  assert.equal(x.actualBrowserExportVerified,false);
 });
 report.p60={mk2Assets:5369,componentCount:3,sampledArchitectureAndSky:3473,
  originalFloorPixels:15360,originalMediaPreserved:true};save();
 const controls=[
  ['P57 image provenance refusals','scripts/test-p57-cross-game-thumbnails.cjs','mk3FalsePaletteOrIdentityExcluded'],
  ['P58 original palette refusals','scripts/test-p58-mk2-palette-evidence.cjs','negativeControlsRejected'],
  ['P60 independent-component refusals','scripts/test-p60-tomb-components.cjs','falsifiedInputsRejected'],
 ];
 for(const [label,script,key]of controls){
  verified(label,n,[script],x=>{
   if(key==='negativeControlsRejected'||key==='falsifiedInputsRejected')assert.equal(x[key],15);
   else assert.equal(x[key],true);
  });
 }
 const text=run('P59 source-only falsified registration controls',n,['scripts/test-p59-tomb.cjs']);
 assert.match(text,/PASS P59 sample coordinates, transparency, overlap, source and runtime qualification controls/);
 report.steps.push({label:'P59 source-only falsified registration controls',status:'PASS',date:new Date().toISOString()});save();
 assert.equal(report.steps.length,9);
 report.status='PASS';
}catch(error){
 report.status='FAIL';
 report.failure=error instanceof Error?error.stack||error.message:String(error);
 process.exitCode=1;
}
report.finishedAt=new Date().toISOString();save();
console.log(JSON.stringify({pass:'P61',status:report.status,
 sourceCommit:report.source.commit,sourceTree:report.source.tree,
 stepsPassed:report.steps.length,census:report.p56?.census,
 p57Thumbnails:report.p57&&{mk1:report.p57.mk1.sourceBackedThumbnails,
 mk2:report.p57.mk2.sourceBackedThumbnails,mk3:report.p57.mk3.sourceBackedThumbnails},
 p58ForestPairs:report.p58?.forestPairs,p60IndependentComponents:report.p60?.componentCount,
 originalThreeGameRegressionVerified:report.status==='PASS',
 userLocalBrowserReplayed:false,privateReport:output,privateWork:workResolved,
 error:report.failure},null,2));
