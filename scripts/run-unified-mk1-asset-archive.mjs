#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const [stageZipArg, stageReportArg, stageValidationArg, animationZipArg, animationReportArg, animationValidationArg, audioZipArg, audioReportArg, audioValidationArg, outDirArg] = process.argv.slice(2);
if (!audioValidationArg) {
  console.error('Usage: node scripts/run-unified-mk1-asset-archive.mjs <stage.zip> <stage-report.json> <stage-validation.json> <animation.zip> <animation-report.json> <animation-validation.json> <audio.zip> <audio-report.json> <audio-validation.json> [out-dir]');
  process.exit(2);
}
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), outDir = path.resolve(outDirArg ?? '.'); fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk1-o65-o66-')), emit = path.join(tmp, 'emit'), types = path.join(tmp, 'types'); fs.mkdirSync(emit,{recursive:true}); fs.mkdirSync(types,{recursive:true});
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,'declare const process: any;\n');
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/crossDomainExportCapabilityProvenanceIndex.ts','src/games/mk1/research/unifiedMk1AssetArchive.ts','src/games/mk1/research/unifiedMk1AssetArchiveValidation.ts'],{cwd:root,stdio:'inherit'});
const o65Api=require(path.join(emit,'games/mk1/research/crossDomainExportCapabilityProvenanceIndex.js')), o66Api=require(path.join(emit,'games/mk1/research/unifiedMk1AssetArchive.js')), vApi=require(path.join(emit,'games/mk1/research/unifiedMk1AssetArchiveValidation.js'));
function readJson(p){return JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));} function readBytes(p){return new Uint8Array(fs.readFileSync(path.resolve(p)));}
const stage={report:readJson(stageReportArg),zipBytes:readBytes(stageZipArg)}, stageValidation=readJson(stageValidationArg);
const animation={report:readJson(animationReportArg),zipBytes:readBytes(animationZipArg)}, animationValidation=readJson(animationValidationArg);
const audio={report:readJson(audioReportArg),zipBytes:readBytes(audioZipArg)}, audioValidation=readJson(audioValidationArg);
const o65=await o65Api.executeCrossDomainExportCapabilityProvenanceIndex(stage,stageValidation,animation,animationValidation,audio,audioValidation);
const o66=await o66Api.executeUnifiedMk1AssetArchive(o65,stage,animation,audio);
const validation=await vApi.executeUnifiedMk1AssetArchiveValidation(o66,o65,stage,animation,audio);
const o65Path=path.join(outDir,'mk1_cross_domain_export_capability_provenance_index.json'),o66Path=path.join(outDir,'mk1_unified_browser_asset_archive.json'),validationPath=path.join(outDir,'mk1_unified_browser_asset_archive_validation.json'),zipPath=path.join(outDir,o66.report.bundle.downloadFileName);
fs.writeFileSync(o65Path,JSON.stringify(o65Api.createMK1CrossDomainExportCapabilityProvenanceIndexExport(o65),null,2));fs.writeFileSync(o66Path,JSON.stringify(o66Api.createMK1UnifiedAssetArchiveExport(o66),null,2));fs.writeFileSync(validationPath,JSON.stringify(vApi.createMK1UnifiedAssetArchiveValidationExport(validation),null,2));fs.writeFileSync(zipPath,Buffer.from(o66.zipBytes));
console.log(JSON.stringify({o65:{status:o65.status,verdict:o65.decision.verdict,summary:o65.summary},o66:{status:o66.report.status,verdict:o66.report.decision.verdict,bundle:o66.report.bundle},validation:{status:validation.status,verdict:validation.decision.verdict,summary:validation.summary},outputs:{o65Path,o66Path,validationPath,zipPath}},null,2));
