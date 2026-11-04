#!/usr/bin/env node
/** O103F--O104I independent Node reparse, no use of producer, its module, or prior report values. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exeName,install,dir,only]=process.argv.slice(2);
if(!dir)throw Error('Usage: node verify... <mk2.exe> <install-dir> <report-dir> [pass]');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(a,b,msg){checks++;assert.deepStrictEqual(a,b,msg)}
function truth(c,msg){checks++;assert.ok(c,msg)}
const targetSHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';eq(digest(fs.readFileSync(exeName)),targetSHA,'authentic MK2 executable');
const extensions=['mid','awe','gvs','lap','sbl'];const folder=path.join(install,'sound');const stems=fs.readdirSync(folder).filter(f=>/\.mid$/i.test(f)).map(f=>f.replace(/\.mid$/i,'')).sort();eq(stems.length,33,'all 33 music families');
const inventory=new Map();
for(const stem of stems)for(const extension of extensions){
 const name=`${stem}.${extension}`;const bytes=fs.readFileSync(path.join(folder,name));const start=bytes.readUInt16LE(1),slots=bytes[start+4]-1;
 truth(start>4&&start+7<=bytes.length,'nontrivial audio buffer');eq(bytes[0],1,'music header leading byte');eq(bytes.readUInt16LE(start),start+2,'footer-length echo');eq(bytes[start+2],96,'footer marker 0x60');eq(bytes.readUInt16LE(start+5),3,'footer constant 3');eq(bytes.length,start+7+2*slots,'trailer and offset count exactly consume EOF');
 const offsets=[];for(let p=start+7;p<bytes.length;p+=2)offsets.push(bytes.readUInt16LE(p));eq(offsets.length,slots,'offset slots');
 for(let i=0;i<offsets.length;i++){const at=offsets[i];truth(at>=3&&at+1<start,'internal offsets');if(i)truth(at>offsets[i-1],'strictly increasing offset');truth(bytes[at-1]===145||bytes[at-1]===152,'preceding record marker');eq(bytes[at],0,'zero at offset');truth(bytes[at+1]>=128&&bytes[at+1]<=137,'bounded record identifier');}
 truth(bytes[start-1]===145||bytes[start-1]===152,'ending record marker');
 inventory.set(name,{name,stem,extension,bytes,start,offsets});
}
eq(inventory.size,165,'five variants per song');
const get=(stem,extension)=>inventory.get(`${stem}.${extension}`);
const cnt=things=>Object.fromEntries([...new Set(things)].sort((a,b)=>a-b).map(x=>[String(x),things.filter(y=>y===x).length]));
const kinds=['header','footer','offsets','segments','variation'];const passIds=[...'FGHIJKLMNOPQRSTUVWXYZ'].map(x=>'O103'+x).concat([...'ABCDEFGHI'].map(x=>'O104'+x));eq(passIds.length,30,'all 30 pass identifiers');
function perFile(m,kind){const {name,stem,extension,bytes,start,offsets}=m;
 if(kind==='header')return {name,byteLength:bytes.length,sha256:digest(bytes),firstByte:bytes[0],headerWord:bytes.readUInt16LE(1),headerFourthByte:bytes[3],dataStart:3,metadataStart:start,bodySha256:digest(bytes.subarray(3,start))};
 if(kind==='footer')return {name,metadataStart:start,footerWord:bytes.readUInt16LE(start),markerByte:bytes[start+2],sharedParameterByte:bytes[start+3],countByte:bytes[start+4],constantWord:bytes.readUInt16LE(start+5),offsetCount:offsets.length,metadataSha256:digest(bytes.subarray(start)),tailByteCount:bytes.length-start};
 if(kind==='offsets')return {name,offsetCount:offsets.length,offsets:offsets.map(at=>({offset:at,markerBefore:bytes[at-1],zeroAt:bytes[at],identifierAfter:bytes[at+1]})),identifiersDistinct:new Set(offsets.map(at=>bytes[at+1])).size===offsets.length,allSorted:true,allWithinData:true};
 if(kind==='segments'){
  const bounds=[0,3,...offsets.map(at=>at-1),start,bytes.length];const parts=[];
  for(let i=1;i<bounds.length;i++){const a=bounds[i-1],b=bounds[i];truth(b>=a,'nonnegative partition');parts.push({start:a,end:b,bytes:b-a,sha256:digest(bytes.subarray(a,b))});}
  const reconstruct=Buffer.concat(parts.map(p=>bytes.subarray(p.start,p.end)));eq(digest(reconstruct),digest(bytes),'exact binary reconstruction');return {name,parts,partCount:parts.length,wholeSha256:digest(bytes),bodyCoveredExactly:true,lossless:true};
 }
 if(kind==='variation'){const siblings=extensions.map(e=>get(stem,e));return {name,stem,extension,sameParameterAllFive:new Set(siblings.map(m=>m.bytes[m.start+3])).size===1,familyParameterByte:bytes[start+3],peerLengths:Object.fromEntries(siblings.map(m=>[m.extension,m.bytes.length])),peerOffsetCounts:Object.fromEntries(siblings.map(m=>[m.extension,m.offsets.length])),peerWholeHashes:Object.fromEntries(siblings.map(m=>[m.extension,digest(m.bytes)]))};}
 throw Error('unknown kind '+kind);
}
function globalStudy(type){const all=[...inventory.values()];
 if(type==='family'){const values=stems.map(stem=>({stem,parameterBytes:extensions.map(e=>{const m=get(stem,e);return m.bytes[m.start+3]}),offsetCounts:extensions.map(e=>get(stem,e).offsets.length)}));return {families:values,constantFamilies:values.filter(v=>new Set(v.parameterBytes).size===1).length,parameterValueHistogram:cnt(stems.map(stem=>{const m=get(stem,'mid');return m.bytes[m.start+3]}))};}
 if(type==='duplicates'){let duplicates=all.filter(m=>new Set(m.offsets.map(p=>m.bytes[p+1])).size!==m.offsets.length).map(m=>({name:m.name,identifiers:m.offsets.map(p=>m.bytes[p+1]),offsets:m.offsets})).sort((x,y)=>x.name.localeCompare(y.name));return {duplicateIdentifierFiles:duplicates,count:duplicates.length,neverClaimAllUnique:true};}
 if(type==='census'){const allOffsets=all.flatMap(m=>m.offsets);return {fileCount:all.length,familyCount:stems.length,totalOffsets:allOffsets.length,prevMarkerCounts:cnt(all.flatMap(m=>m.offsets.map(p=>m.bytes[p-1]))),identifierCounts:cnt(all.flatMap(m=>m.offsets.map(p=>m.bytes[p+1]))),offsetCountHistogram:cnt(all.map(m=>m.offsets.length)),endMarkerCounts:cnt(all.map(m=>m.bytes[m.start-1])),allOffsetsInternal:all.every(m=>m.offsets.every(p=>p>=3&&p<m.start-1))};}
 if(type==='empties'){const x=all.filter(m=>m.offsets.length===0).map(m=>({name:m.name,length:m.bytes.length,metadataStart:m.start,offsetCount:0,footer:m.bytes.subarray(m.start).toString('hex')})).sort((a,b)=>a.name.localeCompare(b.name));return {files:x,count:x.length};}
 if(type==='closure')return {files:165,familyCount:33,extensions,totalOffsetCount:931,trailerLengthFormula:'fileSize=headerWord+7+2*offsetCount',sourceExeSha256:targetSHA,indexedGraphicsExactFullUnaffected:110,musicEventGrammarUnproven:true,playbackTempoUnproven:true,runtimeConsumerUnproven:true,newGraphicsPromotions:0};
 throw Error(type);
}
let verified=0;
for(let j=0;j<passIds.length;j++){
 const id=passIds[j];if(only&&only!==id)continue;
 const extension=j<25?extensions[Math.floor(j/5)]:null;
 const kind=j<25?kinds[j%5]:['family','duplicates','census','empties','closure'][j-25];
 const label=j<25?`audio-${extension}-${kind}-native-boundaries`:`audio-cross-format-${kind}`;
 const pathname=path.join(dir,`mk2_${id.toLowerCase()}_${label}_2026-10-09.json`);
 const report=JSON.parse(fs.readFileSync(pathname,'utf8'));
 eq(report.format,'mk2_o103f_o104i_native_music_structure_v1','report format');eq(report.passId,id,'pass id');eq(report.topic,label,'topic');eq(report.exeSha256,targetSHA,'exe identity');eq(report.classification,'EXACT_BYTE_STRUCTURAL_AUDIO_NOT_PLAYBACK','classification');
 eq(report.hypotheses,{decodedMusicalEvents:false,knownTimingUnits:false,correctAudioPlayback:false,newExactFullGraphics:false},'claim restrictions');
 if(extension){eq(report.evidence.extension,extension,'extension');eq(report.evidence.kind,kind,'hypothesis');eq(report.evidence.fileCount,33,'file count');let expected=stems.map(stem=>perFile(get(stem,extension),kind));eq(report.evidence.files,expected,'source-native report contents');}
 else eq(report.evidence,globalStudy(kind),'cross-variant source replay');
 verified++;console.log(id,'PASS');
}
eq(verified,only?1:30,'all requested checks');console.log(JSON.stringify({status:'PASS',passes:verified,independentChecks:checks,failures:0,musicFiles:inventory.size,offsets:[...inventory.values()].reduce((a,m)=>a+m.offsets.length,0)}));
