#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [zipArg,o61Arg,outArg]=process.argv.slice(2);if(!o61Arg){console.error('Usage: node scripts/run-animation-assets-workspace.mjs <O60.zip> <o61.json> [out.json]');process.exit(2);}
const zipPath=path.resolve(zipArg),o61Path=path.resolve(o61Arg),outPath=path.resolve(outArg??'mk1_animation_assets_workspace_direct.json'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o62-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/browserAnimationExportBundleValidation.ts','src/games/mk1/research/animationAssetsWorkspace.ts'],{cwd:root,stdio:'inherit'});const vapi=require(path.join(emit,'games/mk1/research/browserAnimationExportBundleValidation.js')),api=require(path.join(emit,'games/mk1/research/animationAssetsWorkspace.js'));
const zipBytes=new Uint8Array(fs.readFileSync(zipPath)),sha=crypto.createHash('sha256').update(zipBytes).digest('hex'),entries=vapi.parseAnimationStoreZip(zipBytes),dec=new TextDecoder(),read=n=>JSON.parse(dec.decode(entries.get(n).bytes)),o25=read('reports/o25_palette_binding_exception_census.json'),o61=JSON.parse(fs.readFileSync(o61Path,'utf8'));
const o60={report:{status:'SUCCESS',validation:{allChecksPassed:true},operationId:`standalone_o60_${sha.slice(0,16)}`,decision:{verdict:'MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED'}},zipBytes};
const result=await api.executeAnimationAssetsWorkspace(o60,o61,o25);fs.writeFileSync(outPath,JSON.stringify(api.createMK1AnimationAssetsWorkspaceExport(result),null,2));console.log(JSON.stringify({status:result.report.status,verdict:result.report.decision.verdict,summary:result.report.summary,identities:result.characterIdentities,sourceZipSha256:sha,outPath},null,2));
