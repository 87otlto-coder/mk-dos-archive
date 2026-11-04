#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const [zipArg,outArg]=process.argv.slice(2); if(!zipArg){console.error('Usage: node scripts/run-browser-animation-export-bundle-validation.mjs <O60.zip> [out.json]');process.exit(2);}
const zipPath=path.resolve(zipArg),outPath=path.resolve(outArg??'mk1_browser_animation_export_bundle_validation_direct.json'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk1-o61-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,"declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/browserAnimationExportBundleValidation.ts'],{cwd:root,stdio:'inherit'});const api=require(path.join(emit,'games/mk1/research/browserAnimationExportBundleValidation.js'));
const zipBytes=new Uint8Array(fs.readFileSync(zipPath)),sha=crypto.createHash('sha256').update(zipBytes).digest('hex'),entries=api.parseAnimationStoreZip(zipBytes),dec=new TextDecoder(),read=n=>JSON.parse(dec.decode(entries.get(n).bytes));
const o18=read('reports/o18_animation_resource_decode_census.json'),o23=read('reports/o23_verified_palette_bound_effects.json'),o24=read('reports/o24_character_palette_context_variant_renderer.json'),o25=read('reports/o25_palette_binding_exception_census.json'),o59=read('reports/o59_animation_export_capability_coverage_manifest.json'),indexedBytes=entries.get('indexed/descriptor_pixels.bin').bytes;
const o60={report:{status:'SUCCESS',validation:{allChecksPassed:true},operationId:`standalone_o60_${sha.slice(0,16)}`,decision:{verdict:'MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED'},indexedPayload:{binaryByteLength:indexedBytes.length}},zipBytes};
const report=await api.executeBrowserAnimationExportBundleValidation(o60,o18,o23,o24,o25,o59);fs.writeFileSync(outPath,JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,verdict:report.decision.verdict,summary:report.summary,sourceZipSha256:sha,outPath},null,2));
