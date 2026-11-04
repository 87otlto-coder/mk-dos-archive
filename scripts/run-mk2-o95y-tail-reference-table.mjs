#!/usr/bin/env node
/** O95Y — seven exact EOF-tail packed references in an 8-slot overlay table.
 * Do not assign a table consumer, raster grammar, palette, or gameplay stage identity. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixDir,outDir=repo]=process.argv.slice(2);
if(!fixDir) throw Error('usage: node scripts/run-mk2-o95y-tail-reference-table.mjs <MK2-directory> [out-dir]');
const fixture=path.resolve(fixDir), read=p=>fs.readFileSync(p), sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const chk=(pred,reason)=>{if(!pred)throw Error('O95Y '+reason)};
const exe=read(path.join(fixture,'mk2.exe'));
const exeSha='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';chk(sha(exe)===exeSha,'EXE SHA');
const wb=read(path.join(repo,'mk2_partial_gra_exact_decode_span_gap_map_o95w_2026-10-08.json'));
const xb=read(path.join(repo,'mk2_partial_gra_aligned_uncovered_suffix_o95x_2026-10-08.json'));
const w=JSON.parse(wb),x=JSON.parse(xb);chk(x.members.length===6&&w.resources.length===15,'O95W/X inputs');
const poolStart=exe.indexOf(Buffer.from('PLAYSTA.GRA\0'));
chk(poolStart===0xa0ef1,'canonical pool start');
const names=[],poolEndName='RM.DRV';let q=poolStart;
while(q<exe.length&&names.length<200){const e=exe.indexOf(0,q);chk(e>=q,'pool termination');const s=exe.subarray(q,e).toString('ascii');names.push(s);q=e+1;if(s===poolEndName)break;}
chk(names.at(-1)===poolEndName&&names.length>34,'pool parse');
const start=0xcfbac,count=8;const rows=[];
for(let i=0;i<count;i++){
 const at=start+4*i,ref=exe.readUInt32LE(at),id=ref>>>24,off=ref&0xffffff;
 if(ref===0){rows.push({index:i,entryPhysical:at,packedReferenceHex:'0x00000000',kind:'ZERO_WORD_UNINTERPRETED'});continue;}
 const name=names[id],fullPath=path.join(fixture,name.toLowerCase());chk(name?.endsWith('.GRA')&&fs.existsSync(fullPath),'pool ref '+i);
 const buf=read(fullPath);chk(off>0&&off<buf.length,'suffix bound '+name);
 const tail=buf.subarray(off);const exactOcc=[];const needle=Buffer.alloc(4);needle.writeUInt32LE(ref);
 let found=exe.indexOf(needle);while(found>=0){exactOcc.push(found);found=exe.indexOf(needle,found+1);}
 chk(exactOcc.length===1&&exactOcc[0]===at,'unique exact DWORD occurrence '+name);
 rows.push({index:i,entryPhysical:at,packedReferenceHex:'0x'+ref.toString(16).toUpperCase().padStart(8,'0'),kind:'PACKED_RESOURCE_SUFFIX_REFERENCE',resourceId:id,resource:name,resourceFileSha256:sha(buf),graOffset:off,resourceSize:buf.length,bytesToEOF:tail.length,suffixSha256:sha(tail),exactDwordOccurrencesInExe:exactOcc,divisibleBy1024:tail.length%1024===0,divisibleBy7168:tail.length%7168===0});
}
chk(rows.filter(r=>r.kind==='PACKED_RESOURCE_SUFFIX_REFERENCE').length===7,'seven nonzero');chk(rows[5].kind==='ZERO_WORD_UNINTERPRETED','hole position');
const six=rows.filter(r=>r.kind==='PACKED_RESOURCE_SUFFIX_REFERENCE'&&r.resource!=='BATTLE.GRA');
const expected=['TOMB.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'];chk(six.map(r=>r.resource).join(',')===expected.join(','),'six canonical resource names');
for(const a of six){const prior=x.members.find(s=>s.resource===a.resource);chk(prior&&a.graOffset===prior.start&&a.resourceSize===prior.endExclusive&&a.suffixSha256===prior.tailSha256,'O95X offset join '+a.resource);}
const battle=rows.find(r=>r.resource==='BATTLE.GRA');chk(battle?.graOffset===59436&&battle.bytesToEOF===35840,'seventh BATTLE reference');
chk(!w.resources.some(r=>r.resourceName==='BATTLE.GRA'),'BATTLE outside partial O69 resource subset');
chk(rows.every(r=>r.kind==='ZERO_WORD_UNINTERPRETED'||r.divisibleBy7168),'seven 7168 byte multipliers');
const after=exe.readUInt32LE(start+count*4);chk(after===0,'following zero word');
const report={format:'mk2_overlay_packed_suffix_reference_table_o95y_v1',status:'SUCCESS',fixtureExeSha256:exeSha,prerequisites:{o95wSha256:sha(wb),o95xSha256:sha(xb)},resourcePool:{markerPhysical:poolStart,entryCount:names.length,terminator:poolEndName},table:{startPhysical:start,endExclusive:start+count*4,slotCount:count,followingDwordZero:after===0,interpretation:'CONTIGUOUS_PACKED_RESOURCE_REFERENCE_CANDIDATE',runtimeTableConsumerQualified:false,slots:rows},counts:{nonzeroSlots:7,zeroSlots:1,o95xExactSuffixMatches:6,newZeroCandidateResourceExactTailReference:1,allNonzeroUniqueDwordOccurrences:7,allNonzeroDivisibleBy7168:7,nonzeroTotalReferencedEOFBytes:rows.reduce((s,r)=>s+(r.bytesToEOF??0),0)},boundary:{packedHighByteLow24FormatFromO69:true,physicalOverlayBytesAuthenticated:true,physicalAdjacencyNotProofOfRuntimeTableConsumer:true,referenceNotProofOfRasterGrammar:true,referenceNotProofOfRuntimeStageSelection:true,battleNoO69DescriptorRemainsUnqualified:true,paletteAndPlacementUnresolved:true,mk2ResearchClosed:false},next:'Qualify a runtime consumer and geometry of the eight-slot record before promoting background raster/stage reconstruction.'};
fs.mkdirSync(outDir,{recursive:true});const fname=path.join(outDir,'mk2_overlay_packed_suffix_reference_table_o95y_2026-10-08.json');fs.writeFileSync(fname,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',output:fname,counts:report.counts,slotResources:rows.map(r=>r.resource??'ZERO')}));
