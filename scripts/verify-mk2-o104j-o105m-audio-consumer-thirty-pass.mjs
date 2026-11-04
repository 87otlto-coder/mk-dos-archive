#!/usr/bin/env node
/** Independent O104J–O105M sound-resource and executable verifier. No producer import or report-derived expected facts. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exeArg,install,reportDir,only]=process.argv.slice(2);if(!reportDir)throw Error('Usage: node verify... <exe> <install> <reports> [pass]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const exe=fs.readFileSync(exeArg);
let checks=0;function eq(a,b,n){checks++;assert.deepStrictEqual(a,b,n)}function ok(x,n){checks++;assert.ok(x,n)}
eq(sha(exe),'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','original MK2 executable');
const exts=['mid','lap','gvs','sbl','awe'];const selectors=[1,2,4,8,16];const drivers=['gmi.bin','lap.bin','grv.bin','sbl.bin','awe.bin'];
const stems=fs.readdirSync(path.join(install,'sound')).filter(x=>/\.mid$/i.test(x)).map(x=>x.replace(/\.mid$/i,'')).sort();eq(stems.length,33,'source-native song families');
const f=new Map();for(const stem of stems)for(const ext of exts){const bytes=fs.readFileSync(path.join(install,'sound',stem+'.'+ext));let footer=bytes.readUInt16LE(1);let count=bytes[footer+4]-1;const offsets=[];for(let at=footer+7;at<bytes.length;at+=2)offsets.push(bytes.readUInt16LE(at));eq(bytes[0],1,'header byte');eq(bytes.length,footer+7+2*count,'lossless trailer size');eq(offsets.length,count,'offset count');eq(bytes[footer+2],0x60,'footer marker');for(let j=0;j<offsets.length;j++){let at=offsets[j];ok(at>=3&&at< footer-1,'record location');ok(bytes[at-1]===0x91||bytes[at-1]===0x98,'record marker');eq(bytes[at],0,'record zero');ok(bytes[at+1]>=0x80&&bytes[at+1]<=0x89,'record id');if(j)ok(at>offsets[j-1],'strictly rising');}f.set(stem+'.'+ext,{stem,ext,bytes,footer,offsets});}
eq(f.size,165,'all source-native audio resources');
const cases=[{mov:0x8153c,cmp:0x81541,branch:0x81548,suffix:'.MID'}, {mov:0x8154a,cmp:0x8154f,branch:0x81556,suffix:'.LAP'}, {mov:0x81558,cmp:0x8155d,branch:0x81564,suffix:'.GVS'}, {mov:0x81566,cmp:0x8156b,branch:0x81572,suffix:'.SBL'}, {mov:0x81574,cmp:0x81579,branch:0x81580,suffix:'.AWE'}];
eq(exe.subarray(0x81528,0x8152f).toString('hex'),'8b34858c430100','native indexed title table load');eq(exe.subarray(0x8152f,0x81534).toString('hex'),'bf5e370100','filename buffer pointer');eq(exe.subarray(0x81534,0x8153c).toString('hex'),'ac3c007403aaebf8','filename stem copy loop');eq(exe.subarray(0x81582,0x8158b).toString('hex'),'c3abb800000000aac3','extension append, zero byte, return');
for(let idx=0;idx<5;idx++){
 const c=cases[idx];eq(exe[c.mov],0xb8,'mov EAX immediate');eq(Buffer.from(exe.subarray(c.mov+1,c.mov+5)).toString(),c.suffix,'literal extension');eq(exe.subarray(c.cmp,c.cmp+6).toString('hex'),'833d38010300','compare global 0x30138');eq(exe[c.cmp+6],selectors[idx],'literal hardware selector');eq(exe[c.branch],0x74,'short JE selector match');eq(c.branch+2+((exe[c.branch+1]<<24)>>24),0x81583,'branch to append');
}
const ids=[...'JKLMNOPQRSTUVWXYZ'].map(c=>'O104'+c).concat([...'ABCDEFGHIJKLM'].map(c=>'O105'+c));eq(ids.length,30,'pass cardinality');
const topics=['loader_suffix_branch','marker_to_offset_correlation','cross_hardware_binary_identity','candidate_command_arity','offset_partition_profiles','hardware_driver_inventory'];
function reconstruct(stem,ext,topic){let item=f.get(stem+'.'+ext);let b=item.bytes,L=item.footer,offs=item.offsets,body=b.subarray(3,L);
 switch(topic){
 case 'loader_suffix_branch':return {stem,len:b.length,hash:sha(b),baseNameLength:stem.length,selectedExtension:ext,headerByte:b[0]};
 case 'marker_to_offset_correlation':{
  let markers=[],isOffset=new Set(offs);for(let i=3;i<L;i++){if(b[i]===0x91||b[i]===0x98)markers.push({at:i,hex:b[i],referenced:isOffset.has(i+1),zeroAfter:i+1<L&&b[i+1]===0,idAfter:i+2<L?b[i+2]:null,nextBytes:b.subarray(i,Math.min(i+4,L)).toString('hex')});}
  return {stem,offsetCount:offs.length,terminatorMarker:b[L-1],markers,otherMarkers:markers.filter(m=>!m.referenced)};
 }
 case 'cross_hardware_binary_identity':{let peers=exts.filter(t=>t!==ext);return {stem,sha256:sha(b),length:b.length,samePayloadAs:peers.filter(x=>b.equals(f.get(stem+'.'+x).bytes)).sort(),sameIntro32As:peers.filter(x=>{let q=f.get(stem+'.'+x);return b.subarray(3,Math.min(L,35)).equals(q.bytes.subarray(3,Math.min(q.footer,35))) }).sort()};}
 case 'candidate_command_arity':{let opcodeStats=[];for(const opcode of [0x90,0x99,0x91,0x98]){let locations=[];for(let i=3;i<L;i++)if(b[i]===opcode)locations.push(i);let qualifies=locations.filter(i=>i+2<L&&b[i+1]<128&&b[i+2]<128);let good=new Set(qualifies);opcodeStats.push({opcode,occurrences:locations.length,twoFollowingLow7:qualifies.length,nonLow7Positions:locations.filter(i=>!good.has(i)).slice(0,15)});}let highBitByteCount=0;for(const c of body)if(c>=128)highBitByteCount++;return {stem,bytes:body.length,highBitByteCount,opcodeStats};}
 case 'offset_partition_profiles':{let bounds=[3,...offs.map(x=>x-1),L],spans=[];for(let i=1;i<bounds.length;i++){let a=bounds[i-1],z=bounds[i],piece=b.subarray(a,z);ok(z>=a,'partition bounds');spans.push({start:a,end:z,size:piece.length,sha256:sha(piece),byte90:piece.filter(x=>x===0x90).length,byte99:piece.filter(x=>x===0x99).length,byte91:piece.filter(x=>x===0x91).length,byte98:piece.filter(x=>x===0x98).length});}eq(sha(Buffer.concat(spans.map(p=>b.subarray(p.start,p.end)))),sha(body),'full body partition');return {stem,bodySha256:sha(body),bounds,spans,endsBeforeTrailerMarker:b[L-1]===0x91||b[L-1]===0x98};}
 case 'hardware_driver_inventory':{let driver=drivers[exts.indexOf(ext)];let bd=fs.readFileSync(path.join(install,driver));return {stem,variantSha256:sha(b),driverNameCandidateOnly:driver,driverSha256:sha(bd),driverByteLength:bd.length,driverPrefix16:bd.subarray(0,16).toString('hex')};}
 default:throw Error(topic);
 }
}
let verified=0;let markerExceptions=[];let exactDuplicated=[];
for(let j=0;j<ids.length;j++){
 let pass=ids[j];if(only&&pass!==only)continue;let ext=exts[j%5];let topic=topics[Math.floor(j/5)];let file=path.join(reportDir,`mk2_${pass.toLowerCase()}_audio_${topic}_${ext}_2026-10-09.json`);let r=JSON.parse(fs.readFileSync(file,'utf8'));
 eq(r.format,'mk2_o104j_o105m_audio_consumer_report_v1','format');eq(r.passId,pass,'pass');eq(r.topic,topic,'study');eq(r.extension,ext,'ext');eq(r.selectorValue,selectors[j%5],'bit');eq(r.exeSha256,sha(exe),'exe');eq(r.fileCount,33,'file population');eq(r.noEventGrammarClaim,true,'conservative event boundary');eq(r.noRuntimeDriverBindingClaim,true,'conservative driver boundary');eq(r.noTimingClaim,true,'no temporal units');
 let expected=stems.map(stem=>reconstruct(stem,ext,topic));eq(r.files,expected,'all source-native byte evidence for study');
 if(topic==='loader_suffix_branch'){let c=cases[j%5];eq(r.loaderCase,{movImmediateOffset:c.mov,compareOffset:c.cmp,branchOffset:c.branch,suffixHex:Buffer.from(c.suffix).toString('hex'),selectorGlobal:'0x30138',earlyReturnAt:'0x81582',filenameBuffer:'0x1375e',sourceTableRuntimeAddress:'0x1438c'},'exact executable branch witnesses');}
 if(topic==='hardware_driver_inventory')eq(r.driverBindingClassification,'HYPOTHESIS_FROM_FILENAME_ONLY','driver caution');
 if(topic==='marker_to_offset_correlation')markerExceptions.push(...r.files.flatMap(q=>q.otherMarkers.map(o=>({name:q.stem+'.'+ext,...o}))));
 if(topic==='cross_hardware_binary_identity')exactDuplicated.push(...r.files.filter(q=>q.samePayloadAs.length>0));
 verified++;console.log(pass,'PASS',topic,ext);
}
eq(verified,only?1:30,'all requested independent studies');
// Supplemental independent rejection rules, not claims written into the 30 source-side reports.
if(!only){
 let exceptions=[...markerExceptions].filter(x=>x.at !== f.get(x.name).footer-1).sort((a,b)=>a.name.localeCompare(b.name));let exsig=exceptions.map(x=>x.name+'@'+x.at+':'+x.nextBytes.slice(0,4));
 eq(exsig.length,6,'extra marker occurrences: pit2 five plus animb.lap');ok(exsig.filter(x=>x.startsWith('pit2.')).length===5,'pit2 each hardware variant');ok(exsig.some(x=>x.startsWith('animb.lap')),'animb.lap exception');
 let payloadMap=new Map();for(const rec of f.values()){let h=sha(rec.bytes);if(!payloadMap.has(h))payloadMap.set(h,[]);payloadMap.get(h).push(rec.stem+'.'+rec.ext);}eq(payloadMap.size,155,'independent identical-payload census');eq([...payloadMap.values()].filter(a=>a.length>1).length,9,'exact duplicate groups');eq([...payloadMap.values()].filter(a=>a.length>1).reduce((n,a)=>n+a.length,0),19,'files participating in duplicates');
 let title=['title.mid','title.gvs','title.awe'].map(n=>sha(f.get(n).bytes));ok(new Set(title).size===1,'title exact triple');
 eq(sha(fs.readFileSync(path.join(install,'gmi.bin'))),sha(fs.readFileSync(path.join(install,'scc.bin'))),'byte-identical named driver files');
}
console.log(JSON.stringify({status:'PASS',verifiedPasses:verified,independentChecks:checks,failures:0,exceptionOccurrences:markerExceptions.length,version:'o104j-o105m-2026-10-09'}));
