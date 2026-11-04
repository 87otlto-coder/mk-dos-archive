// Direct O14 full heart-rip fixed-layout composition smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-full-fixed-layout-composition.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-full-fixed-layout-composition.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o14-'));
try{
 const entry=`
 export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
 export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
 export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
 export * from './src/games/mk1/research/paletteSetupTransferSemantics';
 export * from './src/games/mk1/research/paletteRoundTrip';
 export * from './src/games/mk1/research/fighterPaletteOwnership';
 export * from './src/games/mk1/research/opponentAccessHarness';
 export * from './src/games/mk1/research/shangMorphSelection';
 export * from './src/games/mk1/research/animationStreamGroundTruth';
 export * from './src/games/mk1/research/multiPartFrameLosslessIr';
 export * from './src/games/mk1/research/multiPartCompositionCanvasEditor';
 export * from './src/games/mk1/research/heartRipAnimationCanvasEditor';
 export * from './src/games/mk1/research/heartRipRelocationCensus';
 export * from './src/games/mk1/research/reshapeMultiFullCapacitySemantics';
 export * from './src/games/mk1/research/heartRipFourthPartTopologyWriter';
 export * from './src/games/mk1/research/heartRipFixedCapacityTopologyEditor';
 export * from './src/games/mk1/research/heartRipAtomicCompositionEditor';
 export * from './src/games/mk1/research/heartRipFullFixedLayoutCompositionEditor';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),o8=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),o9=await api.executeHeartRipRelocationCensus(source,o8),o10=await api.executeReshapeMultiFullCapacitySemantics(source,o9,o8),o11=await api.executeHeartRipFourthPartTopologyWrite(source,o10,o8),o12=await api.executeHeartRipFixedCapacityTopologyEditorModel(source,o8,o10,o11.report),o13=await api.executeHeartRipAtomicCompositionEditorModel(source,o8,o12),o14=await api.executeHeartRipFullFixedLayoutCompositionEditorModel(source,o8,o13);
 assert.equal(o14.status,'SUCCESS');assert.equal(o14.validation.allChecksPassed,true);assert.equal(o14.frames.length,7);assert.equal(o14.frames.filter(f=>f.allocationByteLength===8).length,6);assert.equal(o14.frames.find(f=>f.frameKey==='heart_2').maxParts,4);
 const request={frames:[
   {frameKey:'heart_0',parts:['KHEART2']},
   {frameKey:'heart_1',parts:['KHEART2']},
   {frameKey:'heart_2',parts:['KHEART3C','KHEART1']},
   {frameKey:'heart_3',parts:['KHEART4']},
   {frameKey:'heart_4',parts:['KHEART5A']},
   {frameKey:'heart_5',parts:['KHEART5B']},
   {frameKey:'heart_6',parts:['KHEART5C']},
 ],placements:[{symbol:'KHEART2',x:8,y:-9}],note:'O14 direct smoke'};
 const result=await api.executeHeartRipFullFixedLayoutCompositionEdit(source,o14,request);
 assert.equal(result.report.status,'STATIC_VALIDATION_PASSED');assert.equal(result.report.evidence.unexpectedByteChanges,0);assert.equal(result.report.evidence.wholeExecutableDiffExactlyExpected,true);assert.equal(result.report.evidence.compositionReparseMatches,true);assert.equal(result.report.evidence.placementReparseMatches,true);assert.equal(result.report.evidence.reverseRestoresOriginal,true);
 assert.deepEqual(result.report.evidence.reparsedFrames.find(f=>f.frameKey==='heart_0').parts,['KHEART2']);assert.deepEqual(result.report.evidence.reparsedFrames.find(f=>f.frameKey==='heart_2').parts,['KHEART3C','KHEART1']);
 const k2=result.report.aliasingAfter.find(a=>a.symbol==='KHEART2');assert.deepEqual(k2.frameKeys,['heart_0','heart_1']);assert.deepEqual(k2.previewKeys,['PRIMARY:0','PRIMARY:1']);assert.equal(k2.sharedAcrossFrameRecords,true);
 const rejects=[];
 const baseline=o14.frames.map(f=>({frameKey:f.frameKey,parts:[...f.baselineParts]}));
 for(const bad of [
   {frames:baseline.slice(0,6),placements:[]},
   {frames:baseline.map(f=>f.frameKey==='heart_0'?{...f,parts:['KHEART1','KHEART2']}:f),placements:[]},
   {frames:baseline.map(f=>f.frameKey==='heart_2'?{...f,parts:['KHEART1','KHEART1']}:f),placements:[]},
   {frames:baseline,placements:[{symbol:'KHEART1',x:40000,y:-14}]},
   {frames:baseline,placements:[]},
 ]){try{await api.executeHeartRipFullFixedLayoutCompositionEdit(source,o14,bad);rejects.push(false);}catch{rejects.push(true);}}
 assert.ok(rejects.every(Boolean));
 const modelArtifact=api.createMK1HeartRipFullFixedLayoutCompositionEditorExport(o14),bundle=api.buildHeartRipFullFixedLayoutCompositionBundle(result);
 await mkdir(outputRoot,{recursive:true});await writeFile(join(outputRoot,'mk1_heart_rip_full_fixed_layout_composition_editor_model_direct.json'),JSON.stringify(modelArtifact,null,2));await writeFile(join(outputRoot,'mk1_heart_rip_full_fixed_layout_composition_edit_sample.json'),JSON.stringify(result.report,null,2));await writeFile(join(outputRoot,'mk1-1E3O14-heart-rip-full-fixed-layout-composition-sample.zip'),bundle);
 console.log(JSON.stringify({status:o14.status,verdict:o14.decision.verdict,changedFrames:result.report.frames.filter(f=>f.changed).map(f=>f.frameKey),placementAliases:result.report.placements.map(p=>({symbol:p.symbol,after:p.affectedPreviewKeysAfter})),changedBytes:result.report.evidence.changedByteCount,rejectionsPassed:rejects.filter(Boolean).length,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
