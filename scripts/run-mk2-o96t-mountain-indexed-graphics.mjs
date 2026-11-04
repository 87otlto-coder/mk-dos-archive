#!/usr/bin/env node
/** O96T: consumer-connected MOUNTAIN.GRA indexed sprites, including adjacent unselected candidate. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixture,out=root]=process.argv.slice(2);if(!fixture)throw Error('usage: node runner <mk2-dir> [out-dir]');
const exe=fs.readFileSync(path.join(fixture,'mk2.exe')),gra=fs.readFileSync(path.join(fixture,'mountain.gra'));
const H=x=>crypto.createHash('sha256').update(x).digest('hex');const C=(ok,what)=>{if(!ok)throw Error('O96T FAIL: '+what)};
C(H(exe)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','MK2 executable fixture');
C(H(gra)==='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6','MOUNTAIN.GRA fixture');
const parentFile=fs.readFileSync(path.join(root,'mk2_static_word_stream_descriptor_consumer_join_o96s_2026-10-09.json'));
const parent=JSON.parse(parentFile); C(parent.status==='SUCCESS'&&parent.descriptorSlots.length===15,'O96S prerequisite');
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0');
C(pool[37]==='MOUNTAIN.GRA','actual resource pool join');
const physical=(off)=>0xa0c54+off;const u16=off=>exe.readUInt16LE(off),u32=off=>exe.readUInt32LE(off);
function decode(start,w,h){let pos=start,skip=0,rle=0,literal=0;const pixels=Buffer.alloc(w*h),mask=Buffer.alloc(w*h),indices=new Set();let opaque=0;
 for(let y=0;y<h;y++){let x=0;while(x<w){C(pos+4<=gra.length,'bounded command');const cmd=gra.readUInt32LE(pos);pos+=4;let count;
  if(cmd&1){count=cmd>>>1;C(count>0&&x+count<=w,'skip count');skip++;x+=count;}
  else if(cmd&2){count=cmd>>>10;const idx=(cmd>>>2)&255;C(count>0&&x+count<=w,'RLE count');for(let k=0;k<count;k++){pixels[y*w+x+k]=idx;mask[y*w+x+k]=1;}indices.add(idx);opaque+=count;rle++;x+=count;}
  else{count=cmd>>>2;C(count>0&&count<=64&&x+count<=w&&pos+count<=gra.length,'literal count');for(let k=0;k<count;k++){const idx=gra[pos+k];pixels[y*w+x+k]=idx;mask[y*w+x+k]=1;indices.add(idx);}opaque+=count;pos+=(count+3)&~3;literal++;x+=count;}
 }}return {encodedBytes:pos-start,endExclusive:pos,commands:{skip,rle,literal},opaquePixels:opaque,transparentPixels:w*h-opaque,colorIndexMin:Math.min(...indices),colorIndexMax:Math.max(...indices),colorIndexCount:indices.size,pixelSha256:H(pixels),maskSha256:H(mask)};
}
const streamStart=0x29314,streamEnd=gra.length;
let records=[];
for(let i=0;i<15;i++){
 const target=0x1c4cc+i*16,phys=physical(target);C(phys+16<=exe.length,'record within fixture');
 const width=u16(phys),height=u16(phys+2),state=u32(phys+4),packed=u32(phys+8),aux=u32(phys+12);
 const fileId=packed>>>24, offset=packed&0xffffff;
 C(width===35&&height===41&&state===0&&fileId===37&&aux===0x2b52a,'exact descriptor family '+i);
 C(offset<gra.length,'packed resource bounds');
 const d=decode(offset,width,height);C(d.opaquePixels===width*height&&d.commands.skip===0,'exact opaque image '+i);
 records.push({ordinal:i,descriptorOffset:target,descriptorPhysical:phys,descriptorSha256:H(exe.subarray(phys,phys+16)),width,height,rawStateDword:state,packedResourceReference:packed,resourceId:fileId,resourceName:'MOUNTAIN.GRA',graOffset:offset,auxiliaryDword:aux, ...d,tableSelected:i<14});
}
C(records[0].graOffset===streamStart && records.at(-1).endExclusive===streamEnd,'full bounded suffix');
for(let i=0;i<14;i++)C(records[i].endExclusive===records[i+1].graOffset,'gapless stream '+i);
for(let i=0;i<15;i++){const expect=parent.descriptorSlots[i].targetOffset; C(expect===records[Math.min(i,13)].descriptorOffset,'O96S slot target '+i);}
const seen=new Set(records.map(x=>x.pixelSha256));C(seen.size===15,'all 15 distinct pixel arrays');
const directSelected=records.slice(0,14);const indexMax=Math.max(...records.map(x=>x.colorIndexMax));C(indexMax>63,'63-color palette inadequate without transform');
const report={format:'mk2_o96t_mountain_selected_indexed_graphics_v1',status:'SUCCESS',fixture:{exeSha256:H(exe),mountainGraSha256:H(gra),resourceBytes:gra.length},parentReportSha256:H(parentFile),resourcePool:{ordinal:37,name:pool[37]},descriptorFamily:{fileImageBase:0xa0c54,startOffset:0x1c4cc,stride:16,recordCount:15,tableReachableDistinctRecords:14,tableSlotCount:15,slot14Aliases13:true,adjacentFifteenthRecordNotInO96STable:true,constantAuxiliaryDword:0x2b52a},suffix:{start:streamStart,endExclusive:streamEnd,encodedBytes:streamEnd-streamStart,streams:15,gapless:true},records,summary:{selectedRecords:14,additionalAdjacentUnselectedRecord:1,uniquePixelArrays:seen.size,decodedPixels:records.reduce((sum,r)=>sum+r.width*r.height,0),selectedDecodedPixels:directSelected.reduce((sum,r)=>sum+r.width*r.height,0),opaqueColorIndexMin:Math.min(...records.map(x=>x.colorIndexMin)),opaqueColorIndexMax:indexMax,allOpaque:true},hypotheses:[{id:'T1',claim:'All 14 selected object records reference losslessly decoded indexed sprites in MOUNTAIN.GRA',verdict:'SUPPORTED_BY_AUTHENTIC_RESOURCE_AND_CONSUMER'},{id:'T2',claim:'An adjacent 15th 35x41 sprite is present in MOUNTAIN.GRA and completes the exact tail',verdict:'SUPPORTED_STRUCTURALLY_NO_O96S_TABLE_SELECTION'},{id:'T3',claim:'The 15 streams establish correct RGB or palette ownership',verdict:'UNPROVEN'},{id:'T4',claim:'All direct source indices can be resolved with a 63-entry palette without other mapping',verdict:'REJECTED_INDEX_EXCEEDS_63'}],boundary:{existingO69PartialResourceStatusUnchanged:true,actualRuntimeObjectPopulationObserved:false,correctColorProven:false,stageCompositionComplete:false}};
fs.mkdirSync(out,{recursive:true});const dest=path.join(out,'mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json');fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:'O96T',status:'PASS',selected:14,additionalAdjacent:1,decodedPixels:report.summary.decodedPixels,indexMax,encodedSuffixBytes:report.suffix.encodedBytes,report:dest}));
