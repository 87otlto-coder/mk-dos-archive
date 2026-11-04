#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const [fixtureArg,outDirArg]=process.argv.slice(2);
if(!fixtureArg){console.error('Usage: node scripts/run-mk2-u8-digital-audio-reconnaissance.mjs <mk2-install-dir> [out-dir]');process.exit(2);}
const fixtureDir=path.resolve(fixtureArg),outDir=path.resolve(outDirArg??'.');fs.mkdirSync(outDir,{recursive:true});
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk2-o92-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,'declare const process: any;\n');
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk2/research/fixtureResourceExecutableTopology.ts','src/games/mk2/research/u8DigitalAudioReconnaissance.ts'],{cwd:root,stdio:'inherit'});
const o67api=require(path.join(emit,'games/mk2/research/fixtureResourceExecutableTopology.js')),o92api=require(path.join(emit,'games/mk2/research/u8DigitalAudioReconnaissance.js'));
function list(base,rel=''){const out=[];for(const ent of fs.readdirSync(path.join(base,rel),{withFileTypes:true})){const child=rel?`${rel}/${ent.name}`:ent.name;if(ent.isDirectory())out.push(...list(base,child));else if(ent.isFile()){const st=fs.statSync(path.join(base,child)),dot=ent.name.lastIndexOf('.');out.push({path:child.replace(/\\/g,'/'),name:ent.name,extension:dot>0?ent.name.slice(dot+1).toUpperCase():'',size:st.size});}}return out;}
const source={directoryName:path.basename(fixtureDir),isSynthetic:false,async listRecursive(){return list(fixtureDir)},async readSlice(rel,offset,length){const p=path.join(fixtureDir,rel),size=fs.statSync(p).size;if(offset>=size)return new Uint8Array(0);const n=Math.min(length,size-offset),buf=Buffer.alloc(n),fd=fs.openSync(p,'r');try{fs.readSync(fd,buf,0,n,offset);return new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength).slice();}finally{fs.closeSync(fd);}}};
const o67=await o67api.executeMK2FixtureResourceExecutableTopology(source);const o92=await o92api.executeMK2U8DigitalAudioReconnaissance(source,o67);const out=path.join(outDir,'mk2_u8_digital_audio_reconnaissance.json');fs.writeFileSync(out,JSON.stringify(o92api.createMK2U8DigitalAudioReconnaissanceExport(o92),null,2));console.log(JSON.stringify({status:o92.status,verdict:o92.decision.verdict,u8:o92.corpus.fileCount,endConventions:o92.corpus.endConventionCounts,exceptions:o92.corpus.exceptionalFiles.map(x=>x.path),wavAdapterAuthorized:o92.decision.wavAdapterAuthorized,out},null,2));
