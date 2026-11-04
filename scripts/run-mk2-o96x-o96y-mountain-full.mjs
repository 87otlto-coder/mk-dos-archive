#!/usr/bin/env node
/** O96X/O96Y: conditional Mountain setup palette slot join and complete 64-image GRA decode. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fx,out=root]=process.argv.slice(2); if(!fx) throw Error('usage: runner <mk2-fixture-dir> [output-directory]');
const exe=fs.readFileSync(path.join(fx,'mk2.exe')),gra=fs.readFileSync(path.join(fx,'mountain.gra'));
const SHA=x=>crypto.createHash('sha256').update(x).digest('hex');const CK=(x,m)=>{if(!x)throw Error('O96X/Y '+m)};
const exeHash='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'; const graHash='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6';
CK(SHA(exe)===exeHash&&SHA(gra)===graHash,'canonical fixture hashes');
const P=o=>0xa0c54+o;const U=p=>exe.readUInt32LE(p),W=p=>exe.readUInt16LE(p),S=p=>exe.readInt16LE(p);
const priorT=fs.readFileSync(path.join(root,'mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json'));
const priorW=fs.readFileSync(path.join(root,'mk2_mountain_palette_allocator_setup_o96w_2026-10-09.json'));
const t=JSON.parse(priorT),ww=JSON.parse(priorW);
CK(t.status==='SUCCESS'&&t.records.length===15&&ww.status==='SUCCESS','parent evidence');
CK(exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0')[37]==='MOUNTAIN.GRA','resource pool ID 37');
const le=0x28f0c,fxr=le+U(le+0x6c),fxt=le+U(le+0x68);const fixups=new Map();let relocationCount=0;
for(let page=0;page<U(le+0x14);page++) {let at=fxr+U(fxt+page*4),end=fxr+U(fxt+(page+1)*4);
  while(at<end){const kind=exe[at]&15,flags=exe[at+1],rel=S(at+2);at+=4;CK((flags&3)===0,'LE flags');const obj=(flags&64)?W(at):exe[at];at+=(flags&64)?2:1;
    let target=null;if(kind!==2){target=(flags&16)?U(at):W(at);at+=(flags&16)?4:2;}if(flags&4)at+=(flags&32)?4:2;
    fixups.set(0x61c54+page*4096+rel,{kind,flags,obj,target});relocationCount++;CK(at<=end,'LE fixup boundary');
  }CK(at===end,'LE page boundary');
}CK(relocationCount===27004,'fixup count');
const typed=(o,obj,dst)=>{const f=fixups.get(P(o)); CK(f?.kind===7&&f.flags===16&&f.obj===obj&&f.target===dst&&U(P(o))===dst,'typed LE relocation '+o.toString(16));};
const setups=[{offset:0x1c31e,count:39},{offset:0x1c330,count:10}];const records=[];const order=[];const paletteOffset=0x1c5bc,descriptorOffset=0x1c344;
for(const setup of setups){const s=setup.offset;let list=U(P(s+6)),desc=U(P(s+10)),pal=U(P(s+14));CK(W(P(s+4))===setup.count,'setup count');
  CK(desc===descriptorOffset&&pal===paletteOffset,'common descriptor/palette array');typed(s+6,2,list);typed(s+10,2,desc);typed(s+14,2,pal);
  for(let i=0;i<setup.count;i++){const entry=list+i*8,first=W(P(entry)),second=S(P(entry+2)),third=S(P(entry+4)),fourth=W(P(entry+6));
    const slot=(first&15)|((fourth&0xf000)>>>8),offsetFromAux=(fourth&0x0fff)*4,target=desc+offsetFromAux;
    CK(first===0x4042&&slot===2&&offsetFromAux%8===0&&target>=desc&&target<desc+49*8,'bounded setup entry '+i);
    order.push({setupOffset:s,entryOffset:entry,position:i,controlWordsHex:[first,W(P(entry+2)),W(P(entry+4)),fourth].map(v=>v.toString(16).padStart(4,'0')),signedField2:second,signedField4:third,derivedPaletteSlot:slot,derivedDescriptorOffset:target,descriptorOrdinal:(target-desc)/8});
  }
  records.push({setupOffset:s,entryCount:setup.count,controlListOffset:list,descriptorBaseOffset:desc,paletteArrayOffset:pal,paletteSlot:2,sourceReferenceOffset:s+14});
}
CK(order.length===49&&new Set(order.map(r=>r.descriptorOrdinal)).size===49,'49 unique selected descriptors');
for(let slot=0;slot<8;slot++)typed(paletteOffset+slot*4,1,0x2b52a);
CK(W(0x8d17e)===207,'palette count 207');
const colors=Array.from({length:207},(_,i)=>W(0x8d17e+2+i*2)); CK(colors.every(v=>v<=0x7fff),'15bit palette range');
const consumerOffsets=[[0x81caa,'8b7e06'],[0x81cde,'c1e014'],[0x81ce1,'c1e812'],[0x81ce4,'03460a'],[0x81daf,'0fb70cdf'],[0x81dbd,'668b54d706'],[0x81dc4,'83e00f'],[0x81dc7,'81e200f00000'],[0x81dcd,'c1ea08'],[0x81dd0,'0bd0'],[0x81dd2,'c1e202'],[0x81dd5,'03560e'],[0x81dd8,'8b02'],[0x81dda,'e85a96ffff'],[0x81ddf,'66894530'],[0x81df9,'8b4b04'],[0x81dfc,'8b03']];
for(const [pos,hex] of consumerOffsets)CK(exe.subarray(pos,pos+hex.length/2).toString('hex')===hex,'authenticated machine bytes at '+pos.toString(16));
function decode(start,w,h){CK(w>0&&h>0&&w*h<1000000,'dimensions');const px=Buffer.alloc(w*h),mask=Buffer.alloc(w*h);let at=start,skip=0,rle=0,literal=0,opaque=0,min=256,max=-1;
 for(let y=0;y<h;y++){let x=0;while(x<w){CK(at+4<=gra.length,'command EOF');const v=gra.readUInt32LE(at);at+=4;let n;
  if(v&1){n=v>>>1;CK(n>0&&n+x<=w,'skip');skip++;x+=n;continue;}
  if(v&2){n=v>>>10;const k=(v>>>2)&255;CK(n>0&&n+x<=w,'RLE count');px.fill(k,y*w+x,y*w+x+n);mask.fill(1,y*w+x,y*w+x+n);opaque+=n;min=Math.min(min,k);max=Math.max(max,k);rle++;x+=n;continue;}
  n=v>>>2;CK(n>0&&n<=64&&n+x<=w&&at+n<=gra.length,'literal');const literalData=gra.subarray(at,at+n);literalData.copy(px,y*w+x);mask.fill(1,y*w+x,y*w+x+n);for(let k of literalData){min=Math.min(min,k);max=Math.max(max,k);}opaque+=n;at+=(n+3)&~3;literal++;x+=n;
 }}return {endExclusive:at,encodedBytes:at-start,opaquePixels:opaque,transparentPixels:w*h-opaque,indexMin:min,indexMax:max,pixelSha256:SHA(px),maskSha256:SHA(mask),commands:{skip,rle,literal}};
}
const sprites=[];
for(let i=0;i<64;i++){const isPrefix=i<49;const off=isPrefix?descriptorOffset+8*i:0x1c4cc+16*(i-49),phys=P(off),w=W(phys),h=W(phys+2),packed=U(phys+(isPrefix?4:8)),start=packed&0xffffff,fileId=packed>>>24;
 CK(fileId===37&&start<gra.length,'packed reference');if(!isPrefix)CK(U(phys+4)===0&&U(phys+12)===0x2b52a,'suffix extended descriptor');
 const d=decode(start,w,h);sprites.push({ordinal:i,family:isPrefix?'PREFIX_NO_XY_8':'SUFFIX_EXTENDED_16',descriptorOffset:off,descriptorBytes:isPrefix?8:16,width:w,height:h,packedReference:packed,graStart:start, ...d});
 if(i>0)CK(sprites[i-1].endExclusive===start,'continuous GRA stream boundary '+i);
 if(!isPrefix){const old=t.records[i-49];CK(old.descriptorOffset===off&&old.graOffset===start&&old.endExclusive===d.endExclusive&&old.pixelSha256===d.pixelSha256,'O96T exact suffix '+i);}
}
CK(sprites[0].graStart===0&&sprites[48].endExclusive===0x29314&&sprites[63].endExclusive===gra.length,'entire Mountain bytes');
CK(Math.max(...sprites.map(r=>r.indexMax))===206,'prefix index domain');CK(sprites.every(r=>r.indexMax<colors.length),'all graphics color-index bounded');
const unionSHA=new Set(sprites.map(x=>x.pixelSha256));CK(unionSHA.size===64,'all 64 decoded image buffers distinct');
const summedCommands={skip:0,rle:0,literal:0};for(const sprite of sprites)for(const name of Object.keys(summedCommands))summedCommands[name]+=sprite.commands[name];
const x={format:'mk2_o96x_mountain_setup_palette_slot_49_control_entries_v1',status:'SUCCESS',fixtureExeSha256:exeHash,mountainGraSha256:graHash,o96wSha256:SHA(priorW),relocations:relocationCount,setupRecords:records,controlEntries:order,consumerMachine:consumerOffsets.map(([physical,hex])=>({physical,hex})),palette:{pointerSlot:2,recordObject1Offset:0x2b52a,count:207,all49SlotsResolveToSameRecord:true},hypotheses:{all49ControlEntriesBoundedToDescriptors:'SUPPORTED_CONDITIONAL_ON_SETUP_SELECTION',all49Use207ColorRecordAtPaletteSlot2:'SUPPORTED_CONDITIONAL_ON_SETUP_SELECTION_AND_OBJECT_CREATION',realGameSelectsTheseSetups:'UNPROVEN',rgbSceneActuallyRendered:'UNPROVEN'}};
const y={format:'mk2_o96y_mountain_exact_full_64_indexed_sprite_corpus_v1',status:'SUCCESS',fixture:{exeSha256:exeHash,mountainGraSha256:graHash,size:gra.length},o96xSha256:null,o96tSha256:SHA(priorT),description:'49 prefix no-xy 8-byte records and 15 O96T extended 16-byte records, exact full MOUNTAIN.GRA',prefix:{start:0,endExclusive:0x29314,descriptorBase:descriptorOffset,descriptorStride:8,images:49},suffix:{start:0x29314,endExclusive:gra.length,descriptorBase:0x1c4cc,descriptorStride:16,images:15},paletteIndexCompatibility:{paletteEntryCount:207,indexMax:206,allIndicesInRange:true,actualRuntimeHandleOwnershipProven:false},summary:{decodedImages:64,uniquePixelSha256:unionSHA.size,decodedPixels:sprites.reduce((a,v)=>a+v.width*v.height,0),opaquePixels:sprites.reduce((a,v)=>a+v.opaquePixels,0),transparentPixels:sprites.reduce((a,v)=>a+v.transparentPixels,0),encodedBytes:sprites.reduce((a,v)=>a+v.encodedBytes,0),commands:summedCommands,allResourceBytesCoveredExactly:true},sprites,hypotheses:{exactFullMountainIndexedGRAReconstruction:'SUPPORTED',prefix49SelectionMechanism:'SUPPORTED_CONDITIONAL',completeCorrectColorRenderedScene:'UNPROVEN',completeStageLayout:'UNPROVEN'}};
fs.mkdirSync(out,{recursive:true});const xfn='mk2_mountain_setup_palette_49_entries_o96x_2026-10-09.json',yfn='mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json';const xb=Buffer.from(JSON.stringify(x,null,2)+'\n');y.o96xSha256=SHA(xb);fs.writeFileSync(path.join(out,xfn),xb);fs.writeFileSync(path.join(out,yfn),JSON.stringify(y,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',passes:['O96X','O96Y'],relocations:relocationCount,setupEntries:49,all49Distinct:true,paletteSlot:2,fullSpriteCount:64,encodedCoverage:y.summary.encodedBytes,graBytes:gra.length,decodedPixels:y.summary.decodedPixels,opaquePixels:y.summary.opaquePixels,transparentPixels:y.summary.transparentPixels,indexMax:206,results:[xfn,yfn]}));
