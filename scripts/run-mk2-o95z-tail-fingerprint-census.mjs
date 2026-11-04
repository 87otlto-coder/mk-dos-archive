#!/usr/bin/env node
/** O95Z — exact byte partitions and duplicate fingerprints for O95Y EOF suffixes.
 * Partition arithmetic is NOT evidence of tiles, scanlines or a runtime renderer. */
import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),[fixture,out=repo]=process.argv.slice(2);if(!fixture)throw Error('Usage: node scripts/run-mk2-o95z-tail-fingerprint-census.mjs <fixture> [out]');
const read=p=>fs.readFileSync(p),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),ck=(p,s)=>{if(!p)throw Error('O95Z '+s)};
const yb=read(path.join(repo,'mk2_overlay_packed_suffix_reference_table_o95y_2026-10-08.json')),y=JSON.parse(yb);ck(y.counts.nonzeroSlots===7,'O95Y proof');
const rows=y.table.slots.filter(z=>z.kind==='PACKED_RESOURCE_SUFFIX_REFERENCE');const granularities=[256,1024,7168];const result=[];
for(const d of rows){const b=read(path.join(path.resolve(fixture),d.resource.toLowerCase()));ck(sha(b)===d.resourceFileSha256,'resource hash '+d.resource);const tail=b.subarray(d.graOffset);ck(sha(tail)===d.suffixSha256&&tail.length%7168===0,'tail bound '+d.resource);
 const partitions=granularities.map(unit=>{ck(tail.length%unit===0,'exact division');const hashes=[];for(let p=0;p<tail.length;p+=unit)hashes.push(sha(tail.subarray(p,p+unit)));
 return {unitBytes:unit,blocks:hashes.length,uniqueBlockHashes:new Set(hashes).size,blockSha256:hashes};});
 const min=Math.min(...tail),max=Math.max(...tail),above63=tail.reduce((v,b)=>v+(b>63?1:0),0);
 result.push({resource:d.resource,entryPhysical:d.entryPhysical,graOffset:d.graOffset,byteLength:tail.length,tailSha256:d.suffixSha256,minimumByte:min,maximumByte:max,bytesAbove63:above63,partitions});
}
const summary=granularities.map(g=>{const all=result.flatMap(r=>r.partitions.find(p=>p.unitBytes===g).blockSha256);const seen=new Map();for(const hash of all)seen.set(hash,(seen.get(hash)??0)+1);return {unitBytes:g,blocks:all.length,distinctBlockHashes:seen.size,duplicateHashGroups:[...seen.values()].filter(v=>v>1).length,duplicateOccurrencesAboveUnique:all.length-seen.size};});
ck(result.length===7&&result.reduce((a,r)=>a+r.byteLength,0)===286720,'bytes');ck(summary[0].blocks===1120&&summary[0].distinctBlockHashes===1118,'256 fingerprint');ck(summary[1].blocks===280&&summary[1].distinctBlockHashes===280,'1024 fingerprint');ck(summary[2].blocks===40&&summary[2].distinctBlockHashes===40,'7168 fingerprint');
const report={format:'mk2_packed_eof_tail_fingerprint_census_o95z_v1',status:'SUCCESS',source:{o95ySha256:sha(yb),exeSha256:sha(read(path.join(path.resolve(fixture),'mk2.exe')))},partitionUnitCandidates:granularities,resources:result,summary,counts:{referencedResources:7,totalBytes:286720,exact7168Units:40,exact1024Units:280,unique1024Units:280,unique7168Units:40},boundary:{unitLengthArithmeticNotProvenRecordGrammar:true,hashUniquenessNotEvidenceOfRenderedTiles:true,noPaletteIdentityOrRGBBinding:true,noGeometryOrDisplayWidth:true,noGameStageNameAssignment:true,noRuntimeConsumersQualified:true,mk2ResearchClosed:false},next:'Follow executable consumption of table 0xCFBAC and establish payload geometry only from executed code/data flow.'};
fs.mkdirSync(out,{recursive:true});const p=path.join(out,'mk2_packed_eof_tail_fingerprint_census_o95z_2026-10-08.json');fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',output:p,counts:report.counts,summary}));
