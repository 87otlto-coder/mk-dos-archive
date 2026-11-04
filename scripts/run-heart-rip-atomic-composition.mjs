// Direct O13 atomic topology + placement smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-atomic-composition.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-atomic-composition.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o13-'));
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
 export * from './src/games/mk1/research/heartRipAtomicCompositionEditor';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),o8=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),o9=await api.executeHeartRipRelocationCensus(source,o8),o10=await api.executeReshapeMultiFullCapacitySemantics(source,o9,o8),o11=await api.executeHeartRipFourthPartTopologyWrite(source,o10,o8),o12=await api.executeHeartRipFixedCapacityTopologyEditorModel(source,o8,o10,o11.report),o13=await api.executeHeartRipAtomicCompositionEditorModel(source,o8,o12);
 assert.equal(o13.status,'SUCCESS');assert.equal(o13.validation.allChecksPassed,true);assert.equal(o13.descriptors.length,9);assert.equal(o13.transaction.topologyAndPlacementAtomic,true);
 const request={parts:['KHEART3C','KHEART1'],placements:[{symbol:'KHEART1',x:-18,y:-12}],note:'O13 direct smoke'};
 const result=await api.executeHeartRipAtomicCompositionEdit(source,o13,request);
 assert.equal(result.report.status,'STATIC_VALIDATION_PASSED');assert.equal(result.report.evidence.unexpectedByteChanges,0);assert.equal(result.report.evidence.wholeExecutableDiffExactlyExpected,true);assert.equal(result.report.evidence.topologyReparseMatches,true);assert.equal(result.report.evidence.placementReparseMatches,true);assert.equal(result.report.evidence.followingRecordPreserved,true);assert.equal(result.report.evidence.reverseRestoresOriginal,true);assert.deepEqual(result.report.evidence.reparsedParts,request.parts);assert.deepEqual(result.report.placements[0].affectedPreviewKeys.sort(),['PRIMARY:0','PRIMARY:2']);assert.equal(result.report.placements[0].aliasSideEffectOutsideHeart2,true);
 const rejects=[];
 for(const request of [
   {parts:[],placements:[]},
   {parts:['KHEART1','KHEART1'],placements:[]},
   {parts:['KHEART1'],placements:[{symbol:'KHEART2',x:3,y:-10}]},
   {parts:['KHEART1'],placements:[{symbol:'KHEART1',x:40000,y:-14}]},
   {parts:['KHEART3A','KHEART3B','KHEART3C'],placements:[]},
 ]){try{await api.executeHeartRipAtomicCompositionEdit(source,o13,request);rejects.push(false);}catch{rejects.push(true);}}
 assert.ok(rejects.every(Boolean));
 const modelArtifact=api.createMK1HeartRipAtomicCompositionEditorExport(o13),bundle=api.buildHeartRipAtomicCompositionBundle(result);
 await mkdir(outputRoot,{recursive:true});await writeFile(join(outputRoot,'mk1_heart_rip_atomic_composition_editor_model_direct.json'),JSON.stringify(modelArtifact,null,2));await writeFile(join(outputRoot,'mk1_heart_rip_atomic_composition_edit_sample.json'),JSON.stringify(result.report,null,2));await writeFile(join(outputRoot,'mk1-1E3O13-heart-rip-atomic-composition-sample.zip'),bundle);
 console.log(JSON.stringify({status:o13.status,verdict:o13.decision.verdict,parts:result.report.topology.after,placements:result.report.placements.map(p=>({symbol:p.symbol,affected:p.affectedPreviewKeys})),changedBytes:result.report.evidence.changedByteCount,rejectionsPassed:rejects.filter(Boolean).length,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
