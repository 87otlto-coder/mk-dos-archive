#!/usr/bin/env node
/** O96A — Authenticated loader-relative LE mapping + machine-code read and packed resource copy chain.
 * Does NOT claim gameplay stage names, final display dimensions, or palette ownership. */
import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),[fixDir,outDir=repo]=process.argv.slice(2);if(!fixDir)throw Error('Usage: run-mk2-o96a-tail-table-consumer.mjs <MK2-dir> [out]');
const buf=fs.readFileSync(path.join(path.resolve(fixDir),'mk2.exe'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),ck=(p,s)=>{if(!p)throw Error('O96A '+s)};
const canon='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';ck(sha(buf)===canon,'canonical MK2');
const U=p=>buf.readUInt32LE(p),H=p=>buf.readUInt16LE(p),SH=p=>buf.readInt16LE(p);const mz=0x26654,le=mz+U(mz+0x3c);ck(le===0x28f0c&&buf.toString('ascii',le,le+2)==='LE','embedded bound MZ/LE');
const pgSize=U(le+0x28),pgCount=U(le+0x14),dat=U(le+0x80),physicalData=mz+dat;
ck(pgSize===4096&&pgCount===113&&dat===0x3b600&&physicalData===0x61c54,'page mapping');
const ot=le+U(le+0x40),mp=le+U(le+0x48),ft=le+U(le+0x68),fr=le+U(le+0x6c);
const objects=Array.from({length:2},(_,i)=>({id:i+1,startPage:U(ot+i*24+12),pageCount:U(ot+i*24+16),virtualSize:U(ot+i*24)}));ck(objects[0].startPage===1&&objects[0].pageCount===63&&objects[1].startPage===64&&objects[1].pageCount===50,'objects');
const pageNumbers=Array.from({length:pgCount},(_,i)=>(buf[mp+i*4]<<16)|(buf[mp+i*4+1]<<8)|buf[mp+i*4+2]);ck(pageNumbers.every((x,i)=>x===i+1),'sequential map');
const physical=(obj,off)=>{const o=objects[obj-1],page=Math.floor(off/pgSize);ck(page<o.pageCount,'mapped object bounds');return physicalData+(pageNumbers[o.startPage+page-1]-1)*pgSize+(off%pgSize)};
ck(physical(2,0x2ef54)===0xcfba8&&physical(2,0x2ef58)===0xcfbac,'table base mapping');
const end=Array.from({length:pgCount+1},(_,i)=>U(ft+i*4));const look=new Map();let parsed=0;
for(let pg=0;pg<pgCount;pg++){const obj=objects.find(x=>x.startPage<=pg+1&&pg+1<x.startPage+x.pageCount);ck(obj,'owner');let p=fr+end[pg],stop=fr+end[pg+1];while(p<stop){const typ=buf[p++]&0xf,flags=buf[p++],src=SH(p);p+=2;ck(!(flags&3),'fixup flag scope');const destObj=flags&0x40?H(p):buf[p];p+=flags&0x40?2:1;let offset=0;if(typ!==2){offset=flags&0x10?U(p):H(p);p+=flags&0x10?4:2;}if(flags&4)p+=flags&0x20?4:2;look.set(`${obj.id}:${(pg+1-obj.startPage)*pgSize+src}`,{type:typ,obj:destObj,target:offset});parsed++;}ck(p===stop,'fixup page end');}
ck(parsed===27004,'fixup census');
const sourceCode=0x9e16d-physicalData,srcLoader=0x659db-physicalData;
ck(JSON.stringify(look.get(`1:${sourceCode}`))===JSON.stringify({type:7,obj:2,target:0x2ef54}),'indexed-table relocation');
ck(JSON.stringify(look.get(`1:${srcLoader}`))===JSON.stringify({type:7,obj:2,target:0x2f434}),'resource handle base relocation');
const branch=buf.subarray(0x9e118,0x9e198),renderer=buf.subarray(0x659c6,0x65a52);
ck(buf.subarray(0x9e165,0x9e171).equals(Buffer.from('a17f74070003348554ef0200','hex')),'object2 indexed DWORD consumer');
ck(buf.subarray(0x9e18b,0x9e197).equals(Buffer.from('b80100000055e83078fcff5d','hex')),'callback to packed-row consumer');
ck(0x9e191+5+buf.readInt32LE(0x9e192)===0x659c6,'call displacement');
ck(buf.subarray(0x659c9,0x659e7).equals(Buffer.from('8bdec1eb188d2cdd00000000c1e3048b9c2b34f4020081e6ffffff0003f3','hex')),'packed resource high/low bridge');
ck(buf.subarray(0x65a0b,0x65a1a).equals(Buffer.from('8bd98beeB950000000ad03c2abe2fa','hex')),'320 byte per-row loop');
ck(buf.subarray(0x65a2d,0x65a3a).equals(Buffer.from('81c5800300008bf52bf04b75d5','hex')),'896 byte source stride and row repeat');
const yi=JSON.parse(fs.readFileSync(path.join(repo,'mk2_overlay_packed_suffix_reference_table_o95y_2026-10-08.json')));
ck(yi.counts.nonzeroSlots===7,'O95Y prerequisite');const observed=Array.from({length:10},(_,i)=>({index:i,physical:0xcfba8+4*i,raw:U(0xcfba8+4*i)}));
for(const row of yi.table.slots){ck(observed[row.index+1].raw===Number.parseInt(row.packedReferenceHex,16),'shift O95Y row by one');}
ck(observed[0].raw===0&&observed[6].raw===0&&observed[9].raw===0,'observed zeros at 0,6,9');
const matchedRows=yi.table.slots.filter(s=>s.kind==='PACKED_RESOURCE_SUFFIX_REFERENCE').map(s=>{ck(s.bytesToEOF%896===0,'source stride divides tail');return {resource:s.resource,physicalEntry:s.entryPhysical,bytesToEOF:s.bytesToEOF,sourceStride896Units:s.bytesToEOF/896,unitsModulo8:(s.bytesToEOF/896)%8};});
const report={format:'mk2_bound_le_packed_suffix_consumer_o96a_v1',status:'SUCCESS',fixtureExeSha256:canon,source:{o95ySha256:sha(fs.readFileSync(path.join(repo,'mk2_overlay_packed_suffix_reference_table_o95y_2026-10-08.json')))},boundLE:{embeddedMzPhysical:mz,leHeaderPhysical:le,moduleRelativePageOffset:dat,physicalPageBase:physicalData,pageCount:pgCount,pageSize:pgSize,objects,fixupsReparsed:parsed,priorO67PostLeOverlayLabelSupersededByO72:true},indexedTable:{object2Offset:0x2ef54,physicalBase:0xcfba8,relocationSourceObject1Offset:sourceCode,relocationImmediatePhysical:0x9e16d,relocationTargetObject:2,observedIndexRange:observed.map(({index,physical,raw})=>({index,physical,rawHex:'0x'+raw.toString(16).toUpperCase().padStart(8,'0')})),runtimeIndexBoundProved:false},producer:{codePhysicalStart:0x9e118,codePhysicalEndExclusive:0x9e198,codeSha256:sha(branch),indexSourceGlobal:0x7747f,indexedReadPhysical:0x9e16a,additionTargetRegister:'ESI',consumerCallPhysical:0x9e191,consumerCallTargetPhysical:0x659c6,conditionalEntryGuard:true,conditionalCallBranches:true},packedCopy:{entryPhysical:0x659c6,codeEndExclusive:0x65a52,codeSha256:sha(renderer),resourceBaseTableObject2Offset:0x2f434,resourceBaseFixupPhysical:0x659db,handleStrideBytes:24,referencedEOFTailStridePartitions:matchedRows,highByteResourceIdExtraction:true,low24ResourceByteOffset:true,sourceDwordCountPerInnerLoop:80,sourceBytesPerInnerLoop:320,sourceRowBaseIncrementBytes:896,rowCountFromCallerRegisterNotGloballyBounded:true,outputColorsNotProven:true},classification:{selectedTableDWORDIsConsumedByRenderingPath:true,selectedPackedValueFlowsIntoResourceBasePlusOffset:true,actualRowCopyLoopAuthenticated:true,paletteOwnershipEstablished:false,screenGeometryEstablished:false,cameraOrGameplayStageNameEstablished:false,exactRuntimeTableIndexSetEstablished:false,noAutomaticPromotionOf14GRAOrOtherMK2Closures:true,mk2ResearchClosed:false},next:'Bound the index global 0x7747F and caller row/source parameters, then test source rows against the 896-byte stride. Keep stage name, palette and exact background display geometry unresolved.'};
fs.mkdirSync(outDir,{recursive:true});const p=path.join(outDir,'mk2_bound_le_packed_suffix_consumer_o96a_2026-10-08.json');fs.writeFileSync(p,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',fixups:parsed,tableObject2:'0x2EF54',consumer:'0x659C6',copyBytesPerRow:320,sourceStride:896,output:p}));
