// Direct read-only smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-relocation-census.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), fixture=process.argv[2], destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-relocation-census.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o9-'));
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
 export * from './src/games/mk1/research/heartRipRelocationCensus';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href), files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}} await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),o8=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),o9=await api.executeHeartRipRelocationCensus(source,o8),artifact=api.createMK1HeartRipRelocationCensusExport(o9);
 assert.equal(o9.status,'SUCCESS'); assert.equal(o9.validation.allChecksPassed,true); assert.equal(o9.target.currentPartCount,3); assert.equal(o9.target.maximumLinkedObjectsAlreadyAllocated,4); assert.equal(o9.target.proposedFourPartRecordByteLength,20); assert.equal(o9.target.bytesAvailableInPlace,0); assert.equal(o9.target.inPlaceGrowthPossible,false); assert.equal(o9.targetInboundSummary.qualifiedSemanticInboundCount,1); assert.equal(o9.targetInboundSummary.allQualifiedSemanticInboundCellsFoundInRawScan,true); assert.equal(o9.storageReconnaissance.safeCandidateCount,0); assert.equal(o9.decision.relocationWriterEstablished,false);
 await mkdir(outputRoot,{recursive:true}); await writeFile(join(outputRoot,'mk1_heart_rip_relocation_census_direct.json'),JSON.stringify(artifact,null,2));
 console.log(JSON.stringify({status:o9.status,verdict:o9.decision.verdict,currentParts:o9.target.currentPartCount,maxLinkedObjects:o9.target.maximumLinkedObjectsAlreadyAllocated,currentBytes:o9.target.currentRecordByteLength,grownBytes:o9.target.proposedFourPartRecordByteLength,inPlaceSlack:o9.target.bytesAvailableInPlace,qualifiedInbound:o9.targetInboundSummary.qualifiedSemanticInboundCount,rawMatches:o9.targetInboundSummary.rawWholeExeOccurrenceCount,unexplainedRaw:o9.targetInboundSummary.unexplainedRawOccurrenceCount,zeroRunCandidates:o9.storageReconnaissance.runtimeAddressableObject2ZeroRunCandidateCount,safeCandidates:o9.storageReconnaissance.safeCandidateCount,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
