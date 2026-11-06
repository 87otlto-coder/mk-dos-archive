#!/usr/bin/env node
/** P18 original-fixture O136/O177 and O220/O221 frame sequence export parity. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2StageVisualAssetsP2P4}=require('../src/core/assets/mk2StageVisualIntegrationP2P4.ts');
const {buildMK2PitBridgeActorsP10}=require('../src/core/assets/mk2PitBridgeActorsP10.ts');
const {buildMK2OrderedSequenceBundlesP18}=require('../src/core/assets/mk2OrderedSequenceBundlesP18.ts');
const {selectedZip,assetBytes}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: node verify-mk2-p18-ordered-sequences.cjs <original MK2 dir> [out.json]');
const entries=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+f.name:f.name,full=path.join(dir,f.name);
 if(f.isDirectory())walk(full,name);else if(f.isFile())entries.push({path:name,name:f.name,extension:path.extname(name).slice(1).toUpperCase(),size:fs.statSync(full).size});}}
walk(root);const source={directoryName:'Canonical original MK2',isSynthetic:false,
 async listRecursive(){return entries;},async readSlice(p,at,n){const fd=fs.openSync(path.join(root,p),'r');try{const buf=Buffer.alloc(n);const got=fs.readSync(fd,buf,0,n,at);return new Uint8Array(buf.subarray(0,got));}finally{fs.closeSync(fd);}}};
const hex=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
const eq=(a,b,msg)=>{assert.deepStrictEqual(a,b,msg);checks++};
(async()=>{
 const stages=await buildMK2StageVisualAssetsP2P4(source),pit=await buildMK2PitBridgeActorsP10(source);
 eq(stages.status.P2.status,'VERIFIED','original O136 stages present');
 eq(pit.status.status,'VERIFIED','original O220/O221 Pit bridge present');
 const stageFrames=stages.assets.filter(a=>a.id.startsWith('mk2-stage-effect:'));
 const bridgeFrames=pit.assets.filter(a=>a.id.startsWith('mk2-pit-bridge:'));
 eq(stageFrames.length,43,'O136 frame count');eq(bridgeFrames.length,14,'O221 frame count');
 const sourceMap=new Map([...stageFrames,...bridgeFrames].map(a=>[a.id,a]));
 const output=buildMK2OrderedSequenceBundlesP18(stages.assets,pit.assets);
 eq(output.status.status,'VERIFIED','all source lists verified');eq(output.status.count,8,'eight contact sheets');
 eq(output.status.sourceFrames,57,'57 original source frames linked');
 eq(output.assets.length,8,'8 exportable previews');eq(output.packages.length,8,'8 independently usable ZIP packages');
 eq(new Set(output.assets.map(a=>a.id)).size,8,'no IDs collide');
 let totalPixels=0,totalFrames=0;
 for(let track=0;track<8;track++){
  const sheet=output.assets[track],pkg=output.packages[track];
  const frameIDs=sheet.metadata.sourceOrderAssetIds,zip=parseAnimationStoreZip(pkg.bytes);
  eq(sheet.metadata.sourceFrameTimingKnown,false,'native frame time unknown');
  eq(sheet.metadata.livePlaybackKnown,false,'runtime activation unknown');
  eq(sheet.metadata.completeStageComposition,false,'not a full scene');
  eq(sheet.metadata.sourcePreviewPaletteIsRuntimeVerified,false,'no live palette attribution');
  eq(sheet.metadata.contactSheetIsDiagnostic,true,'sheet is normalized diagnostic');
  eq(sheet.metadata.paletteKnownMask.every(v=>v===0),true,'full native colour mask unknown');
  eq(frameIDs.length,track<2?8:track===2||track===3||track===5||track>=6?7:6,'original ordered length');
  const manifest=JSON.parse(new TextDecoder().decode(zip.get('sequence.json').bytes));
  eq(manifest.format,'mkdos_p18_original_ordered_animation_bundle_v1','versioned source sequence manifest');
  eq(manifest.sourceFrameCount,frameIDs.length,'manifest frame count');
  eq(manifest.sourceListObject2,sheet.metadata.sourceListObject2,'source list identity');
  eq(manifest.frameTimingVerified,false,'no inferred FPS');
  eq(manifest.nativeFrameDurationMilliseconds,null,'no fabricated ms');
  eq(manifest.activationVerified,false,'runtime unknown');
  eq(manifest.runtimeDacSelectionVerified,false,'native DAC unknown');
  eq(manifest.sourceLoopBack,manifest.originalControl==='ONE_MARKER_BACK_REFERENCE','loop token meaning');
  eq([...zip.keys()].filter(x=>x.startsWith('assets/')).length,frameIDs.length,'all source PNGs exported');
  eq([...zip.keys()].filter(x=>x.startsWith('indexed/')).length,frameIDs.length*2,'all index/opacity planes exported');
  const stride=sheet.metadata.contactSheetCellWidth,cellHeight=sheet.metadata.contactSheetCellHeight;
  eq(sheet.width,stride*frameIDs.length,'sheet width');eq(sheet.height,cellHeight,'sheet height');
  const png=decodeAnimationBundlePng(assetBytes(sheet));
  eq(png.width,sheet.width,'sheet PNG width');eq(png.height,sheet.height,'sheet PNG height');
  eq(hex(png.rgba),hex(sheet.rgba),'contact-sheet PNG RGBA exact readback');
  const sheetSidecars=parseAnimationStoreZip(selectedZip([sheet]));
  eq(sheetSidecars.get('indexed/00000_indices.bin').bytes.length,sheet.width*sheet.height,'contact index plane');
  eq(sheetSidecars.get('indexed/00000_mask.bin').bytes.length,sheet.width*sheet.height,'contact opacity plane');
  eq(sheetSidecars.get('indexed/00000_paletteKnownMask.bin').bytes.every(x=>x===0),true,'sheet original DAC unknown');
  for(let j=0;j<frameIDs.length;j++){
   const f=sourceMap.get(frameIDs[j]);eq(Boolean(f),true,'original source frame linked');
   const record=manifest.frames[j];eq(record.assetId,f.id,'manifest source ID order');
   eq(record.sourceOrder,j,'manifest source ordinal');
   eq(record.originalGraOffset,f.source.offset,'original physical source offset');
   eq(record.originalEncodedBytes,f.source.length,'original encoded length');
   const image=zip.get(record.previewPngFile),index=zip.get(record.sourceIndicesFile),mask=zip.get(record.sourceMaskFile);
   eq(Boolean(image&&index&&mask),true,'source preview+index+mask present');
   eq(hex(image.bytes),hex(assetBytes(f)),'source export PNG parity');
   eq(hex(index.bytes),hex(f.metadata.indices),'source index bytes preserved');
   eq(hex(mask.bytes),hex(f.metadata.mask),'source paint mask bytes preserved');
   for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){
    const s=y*f.width+x,d=y*sheet.width+j*stride+x;
    eq(sheet.metadata.indices[d],f.metadata.indices[s],'original contact index');
    eq(sheet.metadata.mask[d],f.metadata.mask[s],'original contact alpha');
    for(let c=0;c<4;c++)eq(sheet.rgba[d*4+c],f.rgba[s*4+c],'source-color preview exact');
    totalPixels++;
   }
   totalFrames++;
  }
 }
 const broken=[
  [stages.assets.filter(a=>a.id!=='mk2-stage-effect:tomb_flying_a:00'),pit.assets,'missing effect frame'],
  [stages.assets.concat(stages.assets.find(a=>a.id==='mk2-stage-effect:tomb_flying_a:00')),pit.assets,'duplicate effect frame'],
  [stages.assets.map(a=>a.id==='mk2-stage-effect:tomb_flying_a:00'?{...a,metadata:{...a.metadata,sourcePointerObject2:0}}:a),pit.assets,'tampered original pointer'],
  [stages.assets.map(a=>a.id==='mk2-stage-effect:tomb_flying_a:02'?{...a,metadata:{...a.metadata,sourceFrameOrdinal:3}}:a),pit.assets,'reordered source ordinal'],
  [stages.assets.map(a=>a.id==='mk2-stage-effect:portal_electric:00'?{...a,metadata:{...a.metadata,controlType:'ONE_MARKER_BACK_REFERENCE'}}:a),pit.assets,'invented loop'],
  [stages.assets,pit.assets.filter(a=>a.id!=='mk2-pit-bridge:flame:6'),'missing bridge frame'],
  [stages.assets,pit.assets.map(a=>a.id==='mk2-pit-bridge:green:0'?{...a,metadata:{...a.metadata,nativeFrameDurationVerified:true}}:a),'invented native timing'],
  [stages.assets.map(a=>a.id==='mk2-stage-effect:tomb_flying_a:01'?{...a,metadata:{...a.metadata,mask:new Uint8Array(1)}}:a),pit.assets,'corrupt source mask'],
  [[],[],'empty source'],
 ];
 for(const [s,p,label] of broken){const result=buildMK2OrderedSequenceBundlesP18(s,p);eq(result.status.status,'UNAVAILABLE',label+' rejected');eq(result.assets.length,0,label+' no partial assets');eq(result.packages.length,0,label+' no partial packages');}
 const report={pass:'P18',status:'PASS',checks,tracks:8,orderedSourceFrames:totalFrames,comparedIndexedPixels:totalPixels,
  screenshotRgbClaim:false,nativeFrameTimingKnown:false,worldPlacementKnown:false,
  currentFullP16P17P18SourceScanned:false,canonicalOriginalFixtureUsed:true};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
