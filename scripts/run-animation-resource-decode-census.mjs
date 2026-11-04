// Direct O18 read-only decode census against an authentic MK1 installation.
// Usage: node scripts/run-animation-resource-decode-census.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),fixture=process.argv[2],destination=process.argv[3];
if(!fixture||!destination)throw new Error('Usage: node scripts/run-animation-resource-decode-census.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot=resolve(fixture),outputRoot=resolve(destination),temp=await mkdtemp(join(tmpdir(),'mk1-o18-'));
try{
 const entry=`export * from './src/games/mk1/research/fighterAnimationTableComparison'; export * from './src/games/mk1/research/animationResourceDecodeCensus';`;
 await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'research.mjs'),logLevel:'warning'});
 const api=await import(pathToFileURL(join(temp,'research.mjs')).href),files=[];
 async function walk(relative=''){for(const item of await readdir(join(fixtureRoot,relative),{withFileTypes:true})){const p=relative?`${relative}/${item.name}`:item.name;if(item.isDirectory())await walk(p);else if(item.isFile())files.push({path:p,name:item.name,extension:item.name.includes('.')?item.name.split('.').pop().toUpperCase():'',size:(await stat(join(fixtureRoot,p))).size});}}await walk();
 const buffers=new Map(),source={directoryName:fixtureRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!buffers.has(p))buffers.set(p,await readFile(join(fixtureRoot,p)));const d=buffers.get(p);return new Uint8Array(d.subarray(o,o+l));}};
 const o17=await api.executeFighterAnimationTableComparison(source),report=await api.executeAnimationResourceDecodeCensus(source,o17);
 assert.equal(report.status,'SUCCESS');assert.equal(report.validation.allChecksPassed,true);assert.equal(report.summary.uniqueDescriptorCount,1102);assert.equal(report.summary.decodedDescriptorCount,1102);assert.equal(report.summary.kanoAnchorMatchesEstablishedChecksum,true);assert.equal(report.summary.allMultiPartPairsOpaqueBoundsOverlap,true);
 await mkdir(outputRoot,{recursive:true});await writeFile(join(outputRoot,'mk1_animation_resource_decode_census.json'),JSON.stringify(api.createMK1AnimationResourceDecodeCensusExport(report),null,2));console.log(JSON.stringify({status:report.status,verdict:report.decision.verdict,summary:report.summary,resources:report.resources.map(r=>({path:r.path,sha256:r.sha256,descriptorCount:r.descriptorCount}))},null,2));
}finally{await rm(temp,{recursive:true,force:true});}
