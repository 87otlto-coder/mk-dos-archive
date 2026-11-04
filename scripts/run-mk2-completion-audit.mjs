#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const [fixtureArg,outDirArg]=process.argv.slice(2);
if(!fixtureArg){console.error('Usage: node scripts/run-mk2-completion-audit.mjs <mk2-install-dir> [out-dir]');process.exit(2);}
const fixtureDir=path.resolve(fixtureArg),outDir=path.resolve(outDirArg??'.');fs.mkdirSync(outDir,{recursive:true});
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mk2-o95a-')),emit=path.join(tmp,'emit'),types=path.join(tmp,'types');fs.mkdirSync(emit,{recursive:true});fs.mkdirSync(types,{recursive:true});
const shim=path.join(tmp,'node-shim.d.ts');fs.writeFileSync(shim,'declare const process: any;\n');
const mods=['fixtureResourceExecutableTopology','indexedGraphicsDecodeFoundation','broadIndexedGraphicsCorpusCensus','paletteStorageSelectionReconnaissance','leFixupPointerProvenanceQualification','characterResourcePaletteSlotJoin'];
execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,'src/core/assets/model.ts','src/core/assets/mk2Music.ts',...mods.map(x=>`src/games/mk2/research/${x}.ts`)],{cwd:root,stdio:'inherit'});
const api=Object.fromEntries(mods.map(x=>[x,require(path.join(emit,`games/mk2/research/${x}.js`))]));
const music=require(path.join(emit,'core/assets/mk2Music.js'));
function list(base,rel=''){const out=[];for(const ent of fs.readdirSync(path.join(base,rel),{withFileTypes:true})){const child=rel?`${rel}/${ent.name}`:ent.name;if(ent.isDirectory())out.push(...list(base,child));else if(ent.isFile()){const st=fs.statSync(path.join(base,child)),dot=ent.name.lastIndexOf('.');out.push({path:child.replace(/\\/g,'/'),name:ent.name,extension:dot>0?ent.name.slice(dot+1).toUpperCase():'',size:st.size});}}return out;}
const source={directoryName:path.basename(fixtureDir),isSynthetic:false,async listRecursive(){return list(fixtureDir)},async readSlice(rel,offset,length){const p=path.join(fixtureDir,rel),size=fs.statSync(p).size;if(offset>=size)return new Uint8Array(0);const n=Math.min(length,size-offset),buf=Buffer.alloc(n),fd=fs.openSync(p,'r');try{fs.readSync(fd,buf,0,n,offset);return new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength).slice();}finally{fs.closeSync(fd);}}};
const o67=await api.fixtureResourceExecutableTopology.executeMK2FixtureResourceExecutableTopology(source);
const o68=await api.indexedGraphicsDecodeFoundation.executeMK2IndexedGraphicsDecodeFoundation(source,o67);
const o69=await api.broadIndexedGraphicsCorpusCensus.executeMK2BroadIndexedGraphicsCorpusCensus(source,o67,o68.report);
const o71=await api.paletteStorageSelectionReconnaissance.executeMK2PaletteStorageSelectionReconnaissance(source,o67,o68.report);
const o72=await api.leFixupPointerProvenanceQualification.executeMK2LEFixupPointerProvenanceQualification(source,o67,o68.report,o71);
const o73=await api.characterResourcePaletteSlotJoin.executeMK2CharacterResourcePaletteSlotJoin(source,o68.report,o69,o72);
const entries=(await source.listRecursive()).sort((a,b)=>a.path.localeCompare(b.path));
const ext={};for(const e of entries)ext[e.extension||'<NONE>']=(ext[e.extension||'<NONE>']??0)+1;
const musicSets=[];
for(const extension of ['MID','AWE','GVS','LAP','SBL']){let tracks=0,events=0;const failures=[];const files=entries.filter(e=>e.extension===extension&&e.path.toLowerCase().includes('sound/'));
 for(const e of files){try{const d=music.decodeMK2Music(await source.readSlice(e.path,0,e.size));tracks+=d.tracks.length;events+=d.events.length;}catch(err){failures.push({path:e.path,error:String(err?.message??err)});}}
 musicSets.push({extension,fileCount:files.length,structuralDecodePassed:files.length-failures.length,trackCount:tracks,eventCount:events,failures,independentOriginalCodeVerification:extension==='MID'?'33 songs / 212 tracks already verified against original GMI.BIN routines':'PENDING'});
}
const acceptedPalette=new Map([[0,['HH0.GRA','O76']],[1,['LK0.GRA','O77']],[2,['JC0.GRA','O74']],[3,['BA0.GRA','O79']],[4,['FN4.GRA','O81']],[5,['FN6.GRA','O83']],[8,['NJ7.GRA','O87']],[9,['NJ4.GRA','O89']],[16,['FN4.GRA','O85']]]);
const paletteSlots=o73.resourceFamilySlots.map(s=>({slot:s.slot,resourceFamily:s.resourceFamily,rootObject2OffsetHex:s.subtableObject2OffsetHex,witnessResource:s.descriptorResourceName,status:acceptedPalette.has(s.slot)?'QUALIFIED_BOUNDED_RGBA':'UNRESOLVED_FOR_CORRECT_COLOR',qualifiedResource:acceptedPalette.get(s.slot)?.[0]??null,evidencePass:acceptedPalette.get(s.slot)?.[1]??null}));
const mk2ResearchDir=path.join(root,'src/games/mk2/research');const researchFiles=fs.readdirSync(mk2ResearchDir).sort();
const animationModules=researchFiles.filter(n=>/animation/i.test(n));const stageModules=researchFiles.filter(n=>/(stage|background)/i.test(n));
let musicEmu=null;try{musicEmu=JSON.parse(fs.readFileSync(path.join(root,'evidence/mk2-music-emulation.json'),'utf8'));}catch{}
const partial=o69.partialOrAmbiguousResources.map(r=>r.resourceName),zero=[...o69.zeroCandidatePooledResources],outOfPool=[...o69.outOfPoolInstalledResources];
const report={
 format:'mk2_completion_audit_o95a_v1',timestamp:new Date().toISOString(),fixture:{directoryName:path.basename(fixtureDir),fileCount:entries.length,totalBytes:entries.reduce((n,e)=>n+e.size,0),extensions:ext,exeSha256:o67.provenance.exeSha256},
 freshReruns:{o67:o67.decision.verdict,o68:o68.report.decision.verdict,o69:o69.decision.verdict,o71:o71.decision.verdict,o72:o72.decision.verdict,o73:o73.decision.verdict},
 graphics:{installedGra:o69.coverage.installedRootGraCount,exactFull:o69.coverage.exactFullResourceCount,partialOrAmbiguous:o69.coverage.partialOrAmbiguousResourceCount,zeroCandidatePooled:o69.coverage.zeroCandidatePooledResourceCount,outOfPool:o69.coverage.outOfPoolInstalledResourceCount,exactStreams:o69.coverage.qualifiedUniqueStreamCount,partialOrAmbiguousResources:partial,zeroCandidatePooledResources:zero,outOfPoolResources:outOfPool,closure:'OPEN'},
 palettes:{selectorSlots:17,qualifiedSlots:paletteSlots.filter(x=>x.status==='QUALIFIED_BOUNDED_RGBA').length,unresolvedSlots:paletteSlots.filter(x=>x.status!=='QUALIFIED_BOUNDED_RGBA').length,slots:paletteSlots,closure:'OPEN'},
 animations:{identityTableSlots:o73.selectorIndexMechanism.slotCount,identityResourceFamilies:o73.resourceFamilySlots.map(x=>x.resourceFamily),implementedMk2AnimationResearchModules:animationModules,closure:'OPEN',reason:'No MK2 animation-grammar/stream/frame IR pass exists yet; O73 only establishes the 17-slot resource/animation-root skeleton and bounded descriptor witnesses.'},
 stages:{implementedMk2StageResearchModules:stageModules,closure:'OPEN',reason:'No MK2 stage/background placement, renderer-order, camera, palette-join, or dynamic-process reconstruction pass exists yet.'},
 digitalAudio:{u8Files:ext.U8??0,acceptedEvidence:'O94D authorizes bounded source-domain WAV for 312 U8 files; final mixed hardware output equivalence is not claimed.',closure:'FORMAT_QUALIFIED_FINAL_COVERAGE_AUDIT_PENDING'},
 music:{sets:musicSets,existingOriginalCodeEmulation:musicEmu?{songs:musicEmu.songs,tracksPassed:musicEmu.tracksPassed,failures:musicEmu.failures?.length??null,driverSha256:musicEmu.driverSha256}:null,closure:'OPEN',reason:'All five 33-file hardware sets parse structurally, but only the MID set has independent original-driver emulation verification. The sibling sets differ in track counts and bytes.'},
 supportAndUnknown:{binaryDrivers:entries.filter(e=>['BIN','DRV'].includes(e.extension)).map(e=>({path:e.path,size:e.size})),configuration:entries.filter(e=>['INI','BAT','TXT'].includes(e.extension)||e.extension==='').map(e=>({path:e.path,size:e.size})),closure:'OPEN'},
 sourceImplementation:{mk2ResearchModuleCount:researchFiles.length,animationModules,stageModules},
 blockerSummary:{paletteSlots:[6,7,10,11,12,13,14,15],graphicsWholeResourceClassificationCount:partial.length+zero.length+outOfPool.length,animationReconstructionMissing:true,stageReconstructionMissing:true,nonMidMusicIndependentVerificationPending:true,remainingUnknownResourceAuditPending:true},
 decision:{mk2ResearchClosed:false,nextPriority:'MK2 animation structural reconstruction from the authenticated 17-slot identity resource/animation table, then stage/background reconstruction; palette and music sibling verification remain explicit blockers.',verdict:'MK2_O95A_COMPLETION_AUDIT_OPEN_BLOCKERS_ENUMERATED'}
};
const out=path.join(outDir,'mk2_completion_audit_o95a.json');fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({verdict:report.decision.verdict,graphics:report.graphics,palettes:{qualified:report.palettes.qualifiedSlots,unresolved:report.palettes.unresolvedSlots},music:musicSets.map(x=>({extension:x.extension,files:x.fileCount,tracks:x.trackCount,failures:x.failures.length})),animationModules:animationModules.length,stageModules:stageModules.length,out},null,2));
