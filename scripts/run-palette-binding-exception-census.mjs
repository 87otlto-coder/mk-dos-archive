#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [installRootArg,o18Arg,o22Arg,o23Arg,o24Arg,outArg]=process.argv.slice(2);
if(!o24Arg){console.error('Usage: node scripts/run-palette-binding-exception-census.mjs <MK1-dir> <o18.json> <o22.json> <o23.json> <o24.json> [out.json]');process.exit(2);}
const installRoot=path.resolve(installRootArg),outPath=path.resolve(outArg??'mk1_palette_binding_exception_census_direct.json');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o25-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/paletteBindingExceptionCensus.ts'],{cwd:root,stdio:'inherit'});
const api=require(path.join(emit,'games/mk1/research/paletteBindingExceptionCensus.js'));
function walk(dir,rel='',out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const r=rel?`${rel}/${ent.name}`:ent.name,p=path.join(dir,ent.name);if(ent.isDirectory())walk(p,r,out);else if(ent.isFile())out.push({path:r,name:ent.name,extension:ent.name.includes('.')?ent.name.split('.').pop().toUpperCase():'',size:fs.statSync(p).size});}return out;}const files=walk(installRoot),cache=new Map();const source={directoryName:installRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!cache.has(p))cache.set(p,fs.readFileSync(path.join(installRoot,p)));const b=cache.get(p);return new Uint8Array(b.subarray(o,o+l));}};
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const report=await api.executePaletteBindingExceptionCensus(source,read(o18Arg),read(o22Arg),read(o23Arg),read(o24Arg));fs.writeFileSync(outPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,verdict:report.decision.verdict,summary:report.summary,resources:report.resourceSummary.map(r=>({resource:r.resourcePath,count:r.crossResourceDescriptorCount,qualified:r.qualifiedDescriptorCount,unresolved:r.unresolvedDescriptorCount})),outPath},null,2));
