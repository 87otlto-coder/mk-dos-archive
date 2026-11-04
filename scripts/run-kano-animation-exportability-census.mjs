// Direct O16 read-only Kano animation exportability census against an authentic MK1 installation.
// Usage: node scripts/run-kano-animation-exportability-census.mjs /path/to/mk1 /path/to/o14_model.json /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],o14Path=process.argv[3],destination=process.argv[4];
if(!fixture||!o14Path||!destination)throw new Error('Usage: node scripts/run-kano-animation-exportability-census.mjs MK1_DIRECTORY O14_MODEL_JSON OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-kano-o16-'));
try{
 const entry=`export * from './src/games/mk1/research/kanoAnimationExportabilityCensus';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.split('.').pop().toUpperCase(),size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const o14=JSON.parse(await readFile(resolve(o14Path),'utf8'));
 const report=await api.executeKanoAnimationExportabilityCensus(source,o14);
 assert.equal(report.status,'SUCCESS');assert.equal(report.validation.allChecksPassed,true);assert.equal(report.summary.tableCellCount,101);assert.equal(report.summary.unresolvedCellCount,0);assert.equal(report.summary.uniqueFrameTargetCount,168);assert.equal(report.summary.uniqueDescriptorCount,163);assert.equal(report.decision.heartRipIndex67MatchesVerifiedFixture,true);assert.equal(report.decision.kanoAnimationUniverseFullyEnumerated,false);
 await mkdir(outputRoot,{recursive:true});
 await writeFile(join(outputRoot,'mk1_kano_animation_exportability_census_direct.json'),JSON.stringify(api.createMK1KanoAnimationExportabilityCensusExport(report),null,2));
 console.log(JSON.stringify({status:report.status,verdict:report.decision.verdict,summary:report.summary,resources:report.resourceSummary,multiPartCandidates:report.multiPartCandidates,output:outputRoot},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
