// Direct O19 read-only character -> ANITAB selector validation.
// Usage: node scripts/run-character-animation-table-selector.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-character-animation-table-selector.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-o19-'));
try{
 const entry=`export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth'; export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph'; export * from './src/games/mk1/research/kanoPaletteSelectionSemantics'; export * from './src/games/mk1/research/paletteSetupTransferSemantics'; export * from './src/games/mk1/research/paletteRoundTrip'; export * from './src/games/mk1/research/fighterPaletteOwnership'; export * from './src/games/mk1/research/opponentAccessHarness'; export * from './src/games/mk1/research/fighterAnimationTableComparison'; export * from './src/games/mk1/research/characterAnimationTableSelector';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.includes('.')?item.name.split('.').pop().toUpperCase():'',size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const gt=await api.executeWatcomDataImagePaletteGroundTruth(source),graph=await api.executeKanoPaletteSelectionReferenceGraph(source,{groundTruthReport:gt}),sem=await api.executeKanoPaletteSelectionSemantics(source,{referenceGraphReport:graph}),transfer=await api.executePaletteSetupTransferSemantics(source,{selectionSemanticsReport:sem}),round=await api.executePaletteRoundTrip(source,{groundTruthReport:gt,transferReport:transfer}),ownership=await api.executeFighterPaletteOwnershipQualification(source,{referenceGraphReport:graph,selectionSemanticsReport:sem,roundTripReport:round}),access=await api.executeOpponentAccessHarnessQualification(source,{selectionSemanticsReport:sem,roundTripReport:round}),o17=await api.executeFighterAnimationTableComparison(source),report=await api.executeCharacterAnimationTableSelector(source,o17,ownership,access);
 assert.equal(report.status,'SUCCESS');assert.equal(report.validation.allChecksPassed,true);assert.equal(report.summary.uniqueAnitabCount,8);assert.equal(report.selectorTable.entries.length,9);assert.deepEqual(report.selectorTable.entries.map(e=>e.anitabSymbol),['VANDAN_ANITAB','KANO_ANITAB','RAIDEN_ANITAB','KANG_ANITAB','NINJA_ANITAB','NINJA_ANITAB','LIZ_ANITAB','GORO_ANITAB','EMP_ANITAB']);
 await mkdir(outputRoot,{recursive:true});await writeFile(join(outputRoot,'mk1_character_animation_table_selector.json'),JSON.stringify(api.createMK1CharacterAnimationTableSelectorExport(report),null,2));console.log(JSON.stringify({status:report.status,verdict:report.decision.verdict,getCharAni:report.getCharAni,entries:report.selectorTable.entries},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
