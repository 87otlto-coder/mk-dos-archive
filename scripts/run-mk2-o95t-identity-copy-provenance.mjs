#!/usr/bin/env node
/** O95T -- bounded object identity +0x46 copy/source provenance.
 * This is NOT a numeric identity resolver or animation witness generator. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=process.argv[2];const out=process.argv[3]??repo;
if(!fixture)throw Error('Usage: node scripts/run-mk2-o95t-identity-copy-provenance.mjs <original-mk2-dir> [out-dir]');
const read=p=>fs.readFileSync(p),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const assert=(claim,truth)=>{if(!truth)throw Error('O95T '+claim)};
const exe=read(path.join(path.resolve(fixture),'mk2.exe'));
const canonical='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';assert('canonical EXE',sha(exe)===canonical);
const priorPath=path.join(repo,'mk2_animation_fixed_identity_provenance_expansion_o95f_2026-10-07.json'), priorBuf=read(priorPath),prior=JSON.parse(priorBuf);
const sites=prior.identityWriteCensus.sites.filter(s=>s.kind==='COPY_OR_DYNAMIC');assert('12 O95F sites',sites.length===12 && prior.identityWriteCensus.constantImmediateWrites===12 && prior.identityWriteCensus.qualifiedCodeWriteSites===24);
// Source instruction: a register reload from [+0x46], or global scalar reload from 0x75A78.
// More distant pointer-base provenance is validated at individually anchored preceding instruction sites.
const paths=[
 {site:0x67a11,load:0x67a0e,loadHex:'8b4f46',storeHex:'894b46',kind:'OBJECT_FIELD_COPY',source:'EDI_OBJECT',target:'EBX_OBJECT',baseLoad:0x67a08,baseHex:'8b1d7c5a0700',base:'EBX_FROM_0x75A7C'},
 {site:0x7b1aa,load:0x7b1a4,loadHex:'8b15785a0700',storeHex:'895746',kind:'GLOBAL_SCALAR_TO_IDENTITY',source:'GLOBAL_0x75A78',target:'EDI_OBJECT',baseLoad:0x7b19c,baseHex:'8915785a0700',base:'GLOBAL_WRITTEN_FROM_EBP_STACK_VALUE'},
 {site:0x7bca5,load:0x7bca2,loadHex:'8b5346',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EBX_OBJECT',target:'EDI_OBJECT',baseLoad:0x7bc9b,baseHex:'8b1d805a0700',base:'EBX_FROM_0x75A80'},
 {site:0x8399b,load:0x83998,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x83992,baseHex:'a17c5a0700',base:'EAX_FROM_0x75A7C'},
 {site:0x845ba,load:0x845b7,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x845b1,baseHex:'a1805a0700',base:'EAX_FROM_0x75A80'},
 {site:0x85c73,load:0x85c6d,loadHex:'8b15785a0700',storeHex:'895746',kind:'GLOBAL_SCALAR_TO_IDENTITY',source:'GLOBAL_0x75A78',target:'EDI_OBJECT',baseLoad:0x85c56,baseHex:'ba02000000',base:'OPAQUE_PRECEDING_HELPER_0x86ADF'},
 {site:0x95237,load:0x95234,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x9522e,baseHex:'a17c5a0700',base:'EAX_FROM_0x75A7C'},
 {site:0x95d57,load:0x95d54,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x95d4e,baseHex:'a17c5a0700',base:'EAX_FROM_0x75A7C'},
 {site:0x960a2,load:0x9609f,loadHex:'8b5746',storeHex:'895346',kind:'OBJECT_FIELD_COPY',source:'EDI_OBJECT',target:'EBX_OBJECT',baseLoad:0x9607f,baseHex:'8b3d805a0700',base:'EDI_FROM_0x75A80__EBX_FROM_0x75A7C'},
 {site:0x96228,load:0x96225,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x96221,baseHex:'8b4628',base:'EAX_FROM_ESI_PLUS_0x28'},
 {site:0x971a8,load:0x971a5,loadHex:'8b5046',storeHex:'895746',kind:'OBJECT_FIELD_COPY',source:'EAX_OBJECT',target:'EDI_OBJECT',baseLoad:0x9719f,baseHex:'a17c5a0700',base:'EAX_FROM_0x75A7C'},
 {site:0x97f2b,load:0x97f28,loadHex:'8b5746',storeHex:'895046',kind:'OBJECT_FIELD_COPY',source:'EDI_OBJECT',target:'EAX_OBJECT',baseLoad:0x97f22,baseHex:'a17c5a0700',base:'EAX_FROM_0x75A7C'},
];
assert('expected sites equal census',sites.every(s=>paths.some(p=>p.site===s.physical))&&paths.length===12);
const rows=paths.map(p=>{
 const byte=(off,hex)=>exe.subarray(off,off+hex.length/2).toString('hex')===hex;
 assert('source instruction '+p.site.toString(16),byte(p.load,p.loadHex));
 assert('destination identity writer '+p.site.toString(16),byte(p.site,p.storeHex));
 assert('base origin '+p.site.toString(16),byte(p.baseLoad,p.baseHex));
 assert('adjacent source to identity write',p.load+p.loadHex.length/2===p.site);
 assert('object1 O95F site',sites.find(s=>s.physical===p.site)?.object===1);
 const contextStart=Math.min(p.baseLoad,p.load),contextEnd=p.site+3;
 return {identityWriterPhysical:p.site,identityWriterHex:'0x'+p.site.toString(16).toUpperCase(),sourceInstructionPhysical:p.load,sourceInstructionHex:p.loadHex,writerInstructionHex:p.storeHex,pointerBaseInstructionPhysical:p.baseLoad,pointerBaseInstructionHex:p.baseHex,sourceKind:p.kind,source:p.source,target:p.target,pointerBaseProvenance:p.base,contextStart,contextEndExclusive:contextEnd,contextSha256:sha(exe.subarray(contextStart,contextEnd)),numericIdentityQualified:false,animationStreamQualified:false};
});
const srcCounts={objectFieldCopies:rows.filter(r=>r.sourceKind==='OBJECT_FIELD_COPY').length,sharedCursorGlobalToIdentity:rows.filter(r=>r.sourceKind==='GLOBAL_SCALAR_TO_IDENTITY').length};
assert('10 object + 2 cursor',srcCounts.objectFieldCopies===10&&srcCounts.sharedCursorGlobalToIdentity===2);
const ledger={format:'mk2_animation_identity_copy_provenance_o95t_v1',status:'SUCCESS',source:{exeSha256:canonical,o95fSha256:sha(priorBuf)},scope:{o95fAllIdentityWrites:24,o95fConstantWrites:12,o95fCopyOrDynamicWrites:12,qualifiedWriteSiteInstructionForm:'mov [reg+0x46],reg',allSitesProvenanceAudited:12},counts:srcCounts,sites:rows,boundary:{objectFieldCopyDoesNotProveNumericSlot:true,globalCursorUsedAsScalarCannotBeAssumedAnimationPointer:true,doesNotIncreaseFixedIdentityWitnesses:true,existingFixedIdentityWitnesses:7,existingTerminalQualifiedCalls:210,existingStrongConsumerQualifiedCalls:239,existingHeldCalls:14,doesNotResolveStreamGrammarTimingOrPalette:true,mk2ResearchClosed:false},next:'Investigate executable-proven numerical object-identity propagation across callsites if bounded; otherwise pivot to higher-impact MK2 export closure blockers'};
fs.mkdirSync(out,{recursive:true});const dest=path.join(out,'mk2_animation_identity_copy_provenance_o95t_2026-10-08.json');fs.writeFileSync(dest,JSON.stringify(ledger,null,2)+'\n');console.log(JSON.stringify({status:'PASS',...srcCounts,sites:rows.length,output:dest}));
