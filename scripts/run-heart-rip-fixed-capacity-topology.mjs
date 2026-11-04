// Direct O12 fixed-capacity topology smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-fixed-capacity-topology.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-fixed-capacity-topology.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o12-'));
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
 export * from './src/games/mk1/research/heartRipFixedCapacityTopologyEditor';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),o8=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),o9=await api.executeHeartRipRelocationCensus(source,o8),o10=await api.executeReshapeMultiFullCapacitySemantics(source,o9,o8),o11=await api.executeHeartRipFourthPartTopologyWrite(source,o10,o8),o12=await api.executeHeartRipFixedCapacityTopologyEditorModel(source,o8,o10,o11.report);
 assert.equal(o12.status,'SUCCESS');assert.equal(o12.validation.allChecksPassed,true);assert.equal(o12.target.allocationByteLength,16);assert.equal(o12.availableDescriptors.length,9);assert.equal(o12.authoring.duplicatesAllowed,false);
 const fixtures=[
  ['KHEART1'],
  ['KHEART3C','KHEART5A'],
  ['KHEART5C','KHEART3A','KHEART2'],
  ['KHEART1','KHEART3B','KHEART5A','KHEART5C'],
 ];
 const results=[];
 for(const parts of fixtures){const r=await api.executeHeartRipFixedCapacityTopologyEdit(source,o12,{parts,note:'O12 direct smoke'});assert.equal(r.report.status,'STATIC_VALIDATION_PASSED');assert.equal(r.report.evidence.unexpectedByteChanges,0);assert.equal(r.report.evidence.wholeExecutableDiffExactlyExpected,true);assert.equal(r.report.evidence.semanticReparseMatches,true);assert.equal(r.report.evidence.followingRecordPreserved,true);assert.equal(r.report.evidence.reverseRestoresOriginal,true);assert.deepEqual(r.report.evidence.reparsedParts,parts);results.push(r);}
 const rejects=[];
 for(const parts of [[],['KHEART1','KHEART1'],['KHEART1','KHEART2','KHEART3A','KHEART3B','KHEART3C'],['NOPE'],['KHEART3A','KHEART3B','KHEART3C']]){try{await api.executeHeartRipFixedCapacityTopologyEdit(source,o12,{parts});rejects.push(false);}catch{rejects.push(true);}}
 assert.ok(rejects.every(Boolean));
 const artifact=api.createMK1HeartRipFixedCapacityTopologyEditorExport(o12),sample=results.at(-1),bundle=api.buildHeartRipFixedCapacityTopologyBundle(sample);
 await mkdir(outputRoot,{recursive:true});await writeFile(join(outputRoot,'mk1_heart_rip_fixed_capacity_topology_editor_model_direct.json'),JSON.stringify(artifact,null,2));await writeFile(join(outputRoot,'mk1_heart_rip_fixed_capacity_topology_edit_sample.json'),JSON.stringify(sample.report,null,2));await writeFile(join(outputRoot,'mk1-1E3O12-heart-rip-fixed-capacity-topology-sample.zip'),bundle);
 console.log(JSON.stringify({status:o12.status,verdict:o12.decision.verdict,descriptors:o12.availableDescriptors.length,fixturePartCounts:results.map(r=>r.report.topology.afterPartCount),sampleChangedBytes:sample.report.evidence.changedByteCount,rejectionsPassed:rejects.filter(Boolean).length,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
