#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [installRootArg,o2PathArg,outJsonArg,outDirArg]=process.argv.slice(2);
if(!o2PathArg){console.error('Usage: node scripts/run-verified-palette-bound-export-fixtures.mjs <MK1-directory> <o2.json> [out.json] [png-dir]');process.exit(2);}
const installRoot=path.resolve(installRootArg),o2Path=path.resolve(o2PathArg),outJson=path.resolve(outJsonArg??`mk1_verified_palette_bound_export_fixtures_${new Date().toISOString().replace(/[:.]/g,'-')}.json`),pngDir=path.resolve(outDirArg??'mk1_verified_palette_bound_pngs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o23-')),emit=path.join(tmp,'emit'),typeRoots=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(typeRoots,{recursive:true});
const projectRoot=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--typeRoots',typeRoots,'--outDir',emit,shim,'src/games/mk1/research/verifiedPaletteBoundExportFixtures.ts','src/games/mk1/research/raydenLightningPlacementFixture.ts'],{cwd:projectRoot,stdio:'inherit'});
const fixtureApi=require(path.join(emit,'games/mk1/research/verifiedPaletteBoundExportFixtures.js'));const rayApi=require(path.join(emit,'games/mk1/research/raydenLightningPlacementFixture.js'));
function walk(dir,rel='',out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const r=rel?`${rel}/${ent.name}`:ent.name,p=path.join(dir,ent.name);if(ent.isDirectory())walk(p,r,out);else if(ent.isFile())out.push({path:r,name:ent.name,extension:ent.name.includes('.')?ent.name.split('.').pop().toUpperCase():'',size:fs.statSync(p).size});}return out;}
const files=walk(installRoot),cache=new Map();const source={directoryName:installRoot,isSynthetic:false,async listRecursive(){return files;},async readSlice(p,o,l){if(!cache.has(p))cache.set(p,fs.readFileSync(path.join(installRoot,p)));const b=cache.get(p);return new Uint8Array(b.subarray(o,o+l));}};
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type,'ascii'),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function png(width,height,rgba){const sig=Buffer.from([137,80,78,71,13,10,26,10]),ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++){const ro=y*(width*4+1);rows[ro]=0;Buffer.from(rgba.buffer,rgba.byteOffset+y*width*4,width*4).copy(rows,ro+1);}return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
const o2=JSON.parse(fs.readFileSync(o2Path,'utf8'));const o4=await rayApi.executeRaydenLightningPlacementFixture(source,o2);const result=await fixtureApi.executeVerifiedPaletteBoundExportFixtures(source,o2,o4.report);fs.writeFileSync(outJson,JSON.stringify(result.report,null,2));fs.mkdirSync(pngDir,{recursive:true});
for(const [key,payload] of result.previewPayloads){const out=path.join(pngDir,...key.split('/'))+'.png';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,png(payload.width,payload.height,payload.rgba));}
console.log(JSON.stringify({outJson,pngDir,status:result.report.status,verdict:result.report.decision.verdict,summary:result.report.summary},null,2));
