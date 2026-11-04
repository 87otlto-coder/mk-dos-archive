#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [o17Path,o18Path,o19Path,o20Path,o21Path,outArg]=process.argv.slice(2);
if(!o21Path){console.error('Usage: node scripts/run-character-animation-export-manifest.mjs <o17.json> <o18.json> <o19.json> <o20.json> <o21.json> [out.json]');process.exit(2);}
const outPath=path.resolve(outArg??`mk1_character_animation_export_manifest_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o22-')),emit=path.join(tmp,'emit');fs.mkdirSync(emit,{recursive:true});
const projectRoot=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--outDir',emit,shim,'src/games/mk1/research/characterAnimationExportManifest.ts'],{cwd:projectRoot,stdio:'inherit'});
const api=require(path.join(emit,'games/mk1/research/characterAnimationExportManifest.js'));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=api.executeCharacterAnimationExportManifest(read(o17Path),read(o18Path),read(o19Path),read(o20Path),read(o21Path));
fs.writeFileSync(outPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({outPath,status:report.status,verdict:report.decision.verdict,summary:report.summary},null,2));
