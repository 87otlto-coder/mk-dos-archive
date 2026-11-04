// Direct smoke against an authentic MK1 installation.
// Usage: node scripts/run-heart-rip-animation-canvas-editor.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), fixture=process.argv[2], destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-heart-rip-animation-canvas-editor.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-heart-rip-o8-'));
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
 export * from './src/games/mk1/research/heartRipAnimationCanvasEditor';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href), files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}} await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),rt=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),own=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:rt}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:rt}),morph=await api.executeShangMorphSelectionQualification(source,{ownershipReport:own,opponentAccessReport:access}),anim=await api.executeAnimationStreamGroundTruth(source,{shangMorphReport:morph}),multi=await api.executeMultiPartFrameLosslessIr(source,{animationReport:anim}),o7=await api.executeMultiPartCompositionCanvasEditorModel(source,multi),model=await api.executeHeartRipAnimationCanvasEditorModel(source,multi,o7),modelArtifact=api.createMK1HeartRipAnimationCanvasEditorExport(model);
 assert.equal(model.status,'SUCCESS'); assert.equal(model.occurrences.length,8); assert.equal(new Set(model.occurrences.map(o=>o.frameRecordKey)).size,7); assert.equal(model.descriptors.length,9); assert.equal(model.noEditRoundTrip.exact,true); assert.equal(model.aliasing.kheart5aSharedBetweenPrimaryAndBeatLoop,true);
 const h1=model.descriptors.find(d=>d.symbol==='KHEART1'),h3b=model.descriptors.find(d=>d.symbol==='KHEART3B'),h5a=model.descriptors.find(d=>d.symbol==='KHEART5A');
 assert.equal(h5a.usageCount,2); assert.deepEqual(h5a.usage.map(u=>u.previewKey),['PRIMARY:4','BEAT_LOOP:2']);
 const edit=await api.executeHeartRipAnimationCanvasEdit(source,model,{authoringMode:'NUMERIC',note:'O8 direct smoke: single-use, multi-part and shared-alias descriptors',changes:[{symbol:'KHEART1',x:h1.x+2,y:h1.y},{symbol:'KHEART3B',x:h3b.x,y:h3b.y-3},{symbol:'KHEART5A',x:h5a.x+4,y:h5a.y+1}]});
 assert.equal(edit.report.status,'STATIC_VALIDATION_PASSED_RUNTIME_PENDING'); assert.equal(edit.report.evidence.changedDescriptorCount,3); assert.equal(edit.report.evidence.unexpectedByteChanges,0); assert.equal(edit.report.evidence.wholeExecutableDiffExactlyExpected,true); assert.equal(edit.report.evidence.semanticReparseMatches,true); assert.equal(edit.report.evidence.reverseRestoresOriginal,true);
 const shared=edit.report.changes.find(c=>c.symbol==='KHEART5A'); assert.deepEqual(shared.affectedPreviewKeys,['PRIMARY:4','BEAT_LOOP:2']);
 await mkdir(outputRoot,{recursive:true}); await writeFile(join(outputRoot,'mk1_heart_rip_animation_canvas_editor_model_direct.json'),JSON.stringify(modelArtifact,null,2)); await writeFile(join(outputRoot,'mk1_heart_rip_animation_canvas_edit_direct.json'),JSON.stringify(edit.report,null,2)); await writeFile(join(outputRoot,'MK1-1E3O8-SMOKE-EDITED.EXE'),edit.editedExe);
 console.log(JSON.stringify({status:model.status,verdict:model.decision.verdict,occurrences:model.occurrences.length,uniqueFrameRecords:new Set(model.occurrences.map(o=>o.frameRecordKey)).size,descriptors:model.descriptors.length,kheart5aUsages:h5a.usage.map(u=>u.previewKey),noEditExact:model.noEditRoundTrip.exact,changedDescriptors:edit.report.evidence.changedDescriptorCount,changedFields:edit.report.evidence.changedFieldCount,changedBytes:edit.report.evidence.changedByteCount,unexpected:edit.report.evidence.unexpectedByteChanges,semanticReparse:edit.report.evidence.semanticReparseMatches,reversal:edit.report.evidence.reverseRestoresOriginal,editedSha256:edit.report.evidence.editedSha256,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
