#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const [fixtureArg, o63Arg, outDirArg] = process.argv.slice(2);
if (!fixtureArg || !o63Arg) { console.error('Usage: node scripts/run-browser-audio-export-bundle.mjs <mk1-install-dir> <o63.json> [out-dir]'); process.exit(2); }
const fixtureDir = path.resolve(fixtureArg), o63Path = path.resolve(o63Arg), outDir = path.resolve(outDirArg ?? '.'); fs.mkdirSync(outDir, { recursive: true });
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk1-o64-')), emit = path.join(tmp, 'emit'), types = path.join(tmp, 'types'); fs.mkdirSync(emit,{recursive:true}); fs.mkdirSync(types,{recursive:true});
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,'declare const process: any;\n');
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/games/mk1/research/audioMusicResourceGraphCensus.ts','src/games/mk1/research/browserAudioExportBundle.ts','src/games/mk1/research/browserAudioExportBundleValidation.ts','src/games/mk1/research/audioAssetsWorkspace.ts'],{cwd:root,stdio:'inherit'});
const bundleApi=require(path.join(emit,'games/mk1/research/browserAudioExportBundle.js')), validationApi=require(path.join(emit,'games/mk1/research/browserAudioExportBundleValidation.js')), workspaceApi=require(path.join(emit,'games/mk1/research/audioAssetsWorkspace.js'));
function listFilesRecursive(base,rel=''){const out=[];for(const ent of fs.readdirSync(path.join(base,rel),{withFileTypes:true})){const cr=rel?`${rel}/${ent.name}`:ent.name;if(ent.isDirectory())out.push(...listFilesRecursive(base,cr));else if(ent.isFile()){const st=fs.statSync(path.join(base,cr)),dot=ent.name.lastIndexOf('.');out.push({path:cr.replace(/\\/g,'/'),name:ent.name,extension:dot>0?ent.name.slice(dot+1).toUpperCase():'',size:st.size});}}return out;}
const source={directoryName:path.basename(fixtureDir),isSynthetic:false,async listRecursive(){return listFilesRecursive(fixtureDir);},async readSlice(relPath,offset,length){const fp=path.join(fixtureDir,relPath),size=fs.statSync(fp).size;if(offset>=size)return new Uint8Array(0);const n=Math.min(length,size-offset),b=Buffer.alloc(n),fd=fs.openSync(fp,'r');try{fs.readSync(fd,b,0,n,offset);}finally{fs.closeSync(fd);}return new Uint8Array(b.buffer,b.byteOffset,b.byteLength).slice();}};
const o63=JSON.parse(fs.readFileSync(o63Path,'utf8'));
const bundle=await bundleApi.executeBrowserAudioExportBundle(source,o63); const validation=await validationApi.executeBrowserAudioExportBundleValidation(source,bundle,o63); const workspace=await workspaceApi.executeAudioAssetsWorkspace(bundle,validation,o63);
const zipPath=path.join(outDir,bundle.report.bundle.downloadFileName),bundleReport=path.join(outDir,'o64_browser_audio_export_bundle.json'),validationReport=path.join(outDir,'o64_browser_audio_export_bundle_validation.json'),workspaceReport=path.join(outDir,'o64_audio_assets_workspace.json');
fs.writeFileSync(zipPath,bundle.zipBytes);fs.writeFileSync(bundleReport,JSON.stringify(bundleApi.createMK1BrowserAudioExportBundleExport(bundle),null,2));fs.writeFileSync(validationReport,JSON.stringify(validationApi.createMK1BrowserAudioExportBundleValidationExport(validation),null,2));fs.writeFileSync(workspaceReport,JSON.stringify(workspaceApi.createMK1AudioAssetsWorkspaceExport(workspace),null,2));
console.log(JSON.stringify({bundle:{status:bundle.report.status,verdict:bundle.report.decision.verdict,summary:bundle.report.summary,zip:bundle.report.bundle},validation:{status:validation.status,verdict:validation.decision.verdict,summary:validation.summary},workspace:{status:workspace.report.status,verdict:workspace.report.decision.verdict,summary:workspace.report.summary},outputs:{zipPath,bundleReport,validationReport,workspaceReport}},null,2));
