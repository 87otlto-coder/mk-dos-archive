#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [preDirArg,o59OutArg]=process.argv.slice(2);
if(!preDirArg){console.error('Usage: node scripts/run-animation-export-capability-coverage-manifest.mjs <prereq-dir> [o59.json]');process.exit(2);}
const preDir=path.resolve(preDirArg),o59Out=path.resolve(o59OutArg??'mk1_animation_export_capability_coverage_manifest_direct.json');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o59-only-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/animationExportCapabilityCoverageManifest.ts'],{cwd:root,stdio:'inherit'});
const api=require(path.join(emit,'games/mk1/research/animationExportCapabilityCoverageManifest.js'));
const read=name=>JSON.parse(fs.readFileSync(path.join(preDir,name),'utf8'));
const result=api.executeAnimationExportCapabilityCoverageManifest(read('o18.json'),read('o22.json'),read('o23.json'),read('o24.json'),read('o25.json'),read('o26.json'));
fs.writeFileSync(o59Out,JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,verdict:result.decision.verdict,summary:result.summary,o59Out},null,2));
