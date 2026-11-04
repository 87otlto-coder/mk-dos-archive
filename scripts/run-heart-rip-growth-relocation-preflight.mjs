// Direct O15 heart-rip true-growth relocation preflight smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-growth-relocation-preflight.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-growth-relocation-preflight.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o15-'));
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
 export * from './src/games/mk1/research/heartRipFullFixedLayoutCompositionEditor';
 export * from './src/games/mk1/research/heartRipGrowthRelocationPreflight';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),o8=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),o9=await api.executeHeartRipRelocationCensus(source,o8),o10=await api.executeReshapeMultiFullCapacitySemantics(source,o9,o8),o11=await api.executeHeartRipFourthPartTopologyWrite(source,o10,o8),o12=await api.executeHeartRipFixedCapacityTopologyEditorModel(source,o8,o10,o11.report),o13=await api.executeHeartRipAtomicCompositionEditorModel(source,o8,o12),o14=await api.executeHeartRipFullFixedLayoutCompositionEditorModel(source,o8,o13),o15=await api.executeHeartRipGrowthRelocationPreflight(source,o9,o14);
 assert.equal(o15.status,'SUCCESS');
 assert.equal(o15.validation.allChecksPassed,true);
 assert.equal(o15.target.frameKey,'heart_0');
 assert.equal(o15.target.proposedRecordByteLength,12);
 assert.equal(o15.target.bytesAvailableInPlace,0);
 assert.equal(o15.inboundRewriteSurface.directDwordInboundSurfaceClosed,true);
 assert.equal(o15.inboundRewriteSurface.semanticInboundCount,1);
 assert.equal(o15.inboundRewriteSurface.rawWholeExeOccurrenceCount,1);
 assert.equal(o15.inboundRewriteSurface.unexplainedRawOccurrenceCount,0);
 assert.ok(o15.storageReconnaissance.fileBackedObject2ZeroRunCandidateCount>0);
 assert.equal(o15.storageReconnaissance.moduleOwnedCandidateCount,o15.storageReconnaissance.fileBackedObject2ZeroRunCandidateCount);
 assert.equal(o15.storageReconnaissance.unassignedCandidateCount,0);
 assert.equal(o15.storageReconnaissance.sameTargetModuleCandidateCount,0);
 assert.equal(o15.storageReconnaissance.safeCandidateCount,0);
 assert.equal(o15.decision.safeAllocationSiteEstablished,false);
 await mkdir(outputRoot,{recursive:true});
 await writeFile(join(outputRoot,'mk1_heart_rip_growth_relocation_preflight_direct.json'),JSON.stringify(api.createMK1HeartRipGrowthRelocationPreflightExport(o15),null,2));
 console.log(JSON.stringify({status:o15.status,verdict:o15.decision.verdict,target:o15.target.frameKey,inbound:o15.inboundRewriteSurface,storage:{candidates:o15.storageReconnaissance.fileBackedObject2ZeroRunCandidateCount,moduleOwned:o15.storageReconnaissance.moduleOwnedCandidateCount,sameTargetModule:o15.storageReconnaissance.sameTargetModuleCandidateCount,unassigned:o15.storageReconnaissance.unassignedCandidateCount,safe:o15.storageReconnaissance.safeCandidateCount},output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
