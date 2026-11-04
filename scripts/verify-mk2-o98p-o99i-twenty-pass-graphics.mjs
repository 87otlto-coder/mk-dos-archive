#!/usr/bin/env node
/** Independent O98P–O99I verification, re-reads native MK2 EXE/GRA, reparses LE fixups,
 * re-decodes every command and mask in JavaScript, checks every report and false semantic claims.
 * No Python producer functions imported. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [exeArg,fixtureArg,o69Arg,outArg,onlyPass]=process.argv.slice(2);
if(!outArg)throw Error('usage: node verifier <mk2.exe> <fixture-dir> <fresh-O69.json> <reports-dir> [pass]');
const exe=fs.readFileSync(exeArg),o69=JSON.parse(fs.readFileSync(o69Arg,'utf8'));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;function must(ok,label){checks++;if(!ok)throw Error('O98P–O99I independent check failed: '+label);}
const U=(buf,off)=>buf.readUInt32LE(off),W=(buf,off)=>buf.readUInt16LE(off);
const exeSHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
must(digest(exe)===exeSHA,'canonical source');
// Independently traverse all LE fixup pages, not producer-side asset enumeration.
const le=0x28f0c, pages=U(exe,le+20),relocPageTable=le+U(exe,le+0x68),relocRecords=le+U(exe,le+0x6c);
let fixups=0, typed=0;
for(let page=0;page<pages;page++){
 let i=relocRecords+U(exe,relocPageTable+4*page),end=relocRecords+U(exe,relocPageTable+4*(page+1));
 while(i<end){const kind=exe[i]&15,flag=exe[i+1];i+=4;
  must((flag&3)===0,'LE relocation source legality');
  const width=(flag&64)?2:1,obj=width===2?W(exe,i):exe[i];i+=width;
  must(obj>0 && obj<20,'LE target object');
  if(kind!==2){i+=(flag&16)?4:2;}if(flag&4)i+=(flag&32)?4:2;
  fixups++;if(kind===7&&flag===16)typed++;
  must(i<=end,'LE fixup record bounds');
 }
 must(i===end,'LE fixup page end');
}
must(fixups===27004,'LE relocation count');must(typed>1000,'typed fixup sample');
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0'),byName=new Map(pool.map((v,i)=>[v,i]));
const prior=new Map((o69.partialOrAmbiguousResources||[]).map(r=>[r.resourceName,r]));
must(o69.coverage.qualifiedResourceListSha256==='9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c','O69 resource list source identity');
const specs=[
 ['O98P','control-cursor-context-discrimination',[]],['O98Q','story-full-8byte',[['STORY',104412,40]]],['O98R','images-full-8byte',[['IMAGES',190768,90]]],['O98S','dedpool-full-8byte',[['DEDPOOL',90152,25]]],['O98T','kontin-full-8byte',[['KONTIN',106196,32]]],['O98U','bio-full-8byte',[['BIO',129828,8]]],['O98V','t1hdrs-full-8byte',[['T1HDRS',109488,20]]],['O98W','t2hdrs-full-8byte',[['T2HDRS',109648,20]]],['O98X','endh-full-8byte',[['ENDH',129700,8]]],['O98Y','endv-full-8byte',[['ENDV',129764,8]]],['O98Z','copy-full-8byte',[['COPY',191668,8]]],
 ['O99A','logo-hybrid-full',[['LOGO',104136,10]]],['O99B','playsel-hybrid-full',[['PLAYSEL',129152,8]]],['O99C','stone-hybrid-full',[['STONE',129624,8]]],
 ['O99D','portal-mixed-tail',[['PORTAL',91484,13]]],['O99E','armory-mixed-tail',[['ARMORY',92508,18]]],['O99F','forest-mixed-tail',[['FOREST',93580,49]]],['O99G','tomb-mixed-tail',[['TOMB',95880,16]]],
 ['O99H','tower-arena-pit-title-vframe-mixed',[['TOWER',96640,4],['ARENA',99856,15],['PIT',101296,28],['TITLE',120592,8],['VFRAME',116764,10]]],
 ['O99I','battle-cave-fonts-playsta-boundaries',[['BATTLE',103296,40],['CAVE',98912,49],['FONTS',null,0],['PLAYSTA',null,0]]]];
must(specs.length===20,'exact twenty bounded reports');
function decode(bytes,off,w,h){
 must(Number.isInteger(off)&&off>=0&&off<bytes.length&&w>=1&&w<=640&&h>=1&&h<=480,'image bounds');
 let cur=off,opaque=0,min=256,max=-1,skips=0,runs=0,literals=0;
 const px=Buffer.alloc(w*h),mask=Buffer.alloc(w*h);
 for(let row=0;row<h;row++){
  let x=0;
  while(x<w){must(cur+4<=bytes.length,'stream command within GRA');const cmd=U(bytes,cur);cur+=4;
   if((cmd&1)!==0){const n=cmd>>>1;must(n>=1&&n<=w-x,'transparent skip');skips++;x+=n;continue;}
   if((cmd&2)!==0){const n=cmd>>>10,ink=(cmd>>>2)&255;must(n>=1&&n<=w-x,'opaque RLE');
    px.fill(ink,row*w+x,row*w+x+n);mask.fill(1,row*w+x,row*w+x+n);min=Math.min(min,ink);max=Math.max(max,ink);opaque+=n;runs++;x+=n;continue;}
   const n=cmd>>>2;must(n>=1&&n<=64&&n<=w-x&&cur+n<=bytes.length,'literal bounded');
   bytes.copy(px,row*w+x,cur,cur+n);mask.fill(1,row*w+x,row*w+x+n);
   for(let k=cur;k<cur+n;k++){min=Math.min(min,bytes[k]);max=Math.max(max,bytes[k]);}
   cur+=(n+3)&~3;opaque+=n;literals++;x+=n;
  }
 }
 return {endExclusive:cur,encodedBytes:cur-off,opaque,transparent:w*h-opaque,minIndex:max<0?null:min,maxIndex:max<0?null:max,commands:{skip:skips,rle:runs,literal:literals},pixelsSha256:digest(px),maskSha256:digest(mask)};
}
function fieldEquality(o,expected,label){must(JSON.stringify(o)===JSON.stringify(expected),label);}
let totalDesc=0,totalSuffix=0,allPromoted=[],full8count=0,hybridCount=0,processed=0;
for(const [pass,slug,groups] of specs){if(onlyPass && onlyPass!==pass)continue;
 const file=path.join(outArg,`mk2_${pass.toLowerCase()}_${slug}_2026-10-09.json`),rep=JSON.parse(fs.readFileSync(file,'utf8'));
 must(rep.pass===pass && rep.topic===slug && rep.format==='mk2_o98p_o99i_20pass_verified_8byte_graphics_v1'&&rep.status==='SOURCE_ANALYSIS','report identity '+pass);
 must(rep.fixtureExeSha256===exeSHA&&rep.sourceQualifiedResourceListHash===o69.coverage.qualifiedResourceListSha256,'report fixture and O69 origin');
 fieldEquality(rep.boundaries,{onlyStaticGraphicsAndCode:true,runtimeActivationVerified:false,paletteHandleOwnershipVerified:false,fullyRenderedSceneVerified:false,temporalUnitsVerified:false},pass+' strict semantic boundary');
 must(rep.hypothesisClassification==='SUPPORTED_STRUCTURAL','supported bounded class');
 must(rep.resourceEvidence.length===groups.length,'resource assignment');
 if(pass==='O98P'){
  must(rep.cursorEvidence!==null && rep.cursorEvidence.sites.length===3,'three cursor installers');
  const src=[[0x84c90,0x84c95],[0x9882d,0x98832],[0x98a4a,0x98a4f]];
  for(let k=0;k<3;k++){
   const [p,q]=src[k],f=rep.cursorEvidence.sites[k];must(f.loadOffset===p&&f.storeOffset===q,'installer address');
   must(exe[p]===0xb8&&U(exe,p+1)===0x15d60&&exe[q]===0xa3&&U(exe,q+1)===0x75cf6,'typed cursor opcode');
   must(f.loadHex===exe.subarray(p,p+5).toString('hex')&&f.storeHex===exe.subarray(q,q+5).toString('hex')&&f.localWindowSha256===digest(exe.subarray(p-5,q+10)),'exact cursor window');
  }
  fieldEquality([rep.cursorEvidence.sameCursorPointer,rep.cursorEvidence.distinctInstallers,rep.cursorEvidence.identicalSceneActivationEstablished,rep.cursorEvidence.differentCompanionGlobalWrites],[true,true,false,true],'no invented synchronized runtime activation');
 }else must(rep.cursorEvidence===null,'noncursor pass');
 for(let z=0;z<groups.length;z++){
  const [base,objStart,n]=groups[z],r=rep.resourceEvidence[z],fn=base+'.GRA',id=byName.get(fn),gra=fs.readFileSync(path.join(fixtureArg,fn.toLowerCase())),known=prior.get(fn);
  must(r.resource===fn&&r.resourceId===id&&r.resourceBytes===gra.length&&r.resourceSha256===digest(gra),'exact GRA provenance '+fn);
  must(r.tableObject2Start===objStart&&r.descriptorCount===n&&r.records.length===n,'file-backed 8-byte layout '+fn);
  const streams=[];
  for(let i=0;i<n;i++){
   const src=0xa0c54+objStart+8*i,f=r.records[i];must(src+8<=exe.length,'file-backed descriptor');
   must(f.object2Offset===objStart+8*i&&f.descriptorSha256===digest(exe.subarray(src,src+8)),'8-byte record hash');
   const w=W(exe,src),h=W(exe,src+2),packed=U(exe,src+4);must(w===f.width&&h===f.height&&packed===f.packedRef&&packed>>>24===id,'authenticated packed reference');
   const offset=packed&0xffffff;must(f.graStart===offset,'GRA start offset');
   const independently=decode(gra,offset,w,h);
   for(const [k,val] of Object.entries(independently))must(JSON.stringify(f[k])===JSON.stringify(val),'redecoding '+fn+' '+i+' '+k);
   streams.push({offset,end:independently.endExclusive,hash:independently.pixelsSha256});totalDesc++;
  }
  if(base==='BATTLE'){
   must(n===40,'duplicate prefix source descriptor size');
   for(let j=0;j<20;j++){must(streams[j].offset===streams[j+20].offset&&streams[j].hash===streams[j+20].hash,'duplicate BATTLE descriptor at '+j);}
   for(let k=0;k<19;k++)must(streams[k].end===streams[k+1].offset&&streams[k+20].end===streams[k+21].offset,'BATTLE paired prefix adjacency');
   must(streams[0].offset===0&&streams[19].end===59436&&gra.length-streams[19].end===35840,'BATTLE raw tail boundary');
  }else{
   for(let i=1;i<streams.length;i++)must(streams[i-1].end===streams[i].offset,'non-overlapping contiguous prefix '+fn);
  }
  const first=n?streams[0].offset:null,end=n?streams[n-1].end:0;
  must(r.firstStreamStart===first&&r.lastStreamEnd===end&&r.prefixDecodedBytes===(n?end-first:0),'endpoints '+fn);
  must(r.o69PriorAmbiguous===(known?known.ambiguousOffsetCount:null),'prior ambiguity '+fn);
  const oldSuffix=(known?known.streams:[]).filter(s=>s.graOffset>=end).sort((a,b)=>a.graOffset-b.graOffset);
  must(r.priorO69Suffix.length===oldSuffix.length,'O69 suffix stream count '+fn);
  for(let i=0;i<oldSuffix.length;i++){
   const src=oldSuffix[i],item=r.priorO69Suffix[i],p=src.descriptorPhysical;
   must(item.descriptorPhysical===p&&item.graStart===src.graOffset&&item.width===src.width&&item.height===src.height,'O69 suffix identity');
   must(W(exe,p)===src.width&&W(exe,p+2)===src.height&&U(exe,p+8)>>>24===id&&(U(exe,p+8)&0xffffff)===src.graOffset,'12byte source descriptor');
   const d=decode(gra,src.graOffset,src.width,src.height);must(d.endExclusive===src.encodedEndExclusive,'O69 decoder compatibility');
   for(const [key,val] of Object.entries(d))must(JSON.stringify(item[key])===JSON.stringify(val),'O69 suffix exact decode '+key);
   totalSuffix++;
  }
  const tiling=oldSuffix.length>0&&oldSuffix[0].graOffset===end&&oldSuffix.at(-1).encodedEndExclusive===gra.length&&oldSuffix.every((x,i)=>i===0||oldSuffix[i-1].encodedEndExclusive===x.graOffset);
  must(r.verifiedSuffixContiguousToEOF===tiling,'O69 suffix exact adjacency '+fn);
  const full=n>0&&first===0&&end===gra.length,hybrid=n>0&&first===0&&tiling&&base!=='VFRAME'&&known?.ambiguousOffsetCount===0;
  const clazz=full?'EXACT_FULL_INDEXED_8':hybrid?'EXACT_FULL_INDEXED_8_PLUS_O69':'PARTIAL_MIXED_OR_AMBIGUOUS';
  must(r.classification===clazz,'no unsupported exact-full promotion '+fn);
  must(r.extra.mixedPrefixOf120Bytes===(base==='CAVE'&&first===120),'CAVE first 120 byte boundary');
  must(r.extra.distinct8ByteDescriptorOwnershipUnresolved===(base==='VFRAME'),'VFRAME alternative image ownership held');
  if(base==='CAVE')must(end===gra.length&&first===120,'CAVE header-image split');
  if(base==='VFRAME')must(end===47384&&tiling&&r.classification==='PARTIAL_MIXED_OR_AMBIGUOUS','VFRAME alternate tiling not promoted');
  if(clazz.startsWith('EXACT_FULL')){allPromoted.push(fn);if(full)full8count++;else hybridCount++;}
 }
 processed++;console.log(JSON.stringify({pass,status:'PASS',resources:groups.length,checks}));
}
if(!onlyPass){must(processed===20,'all twenty processed');must(full8count===10&&hybridCount===5,'exact-full additions 10+5');must(new Set(allPromoted).size===15,'15 distinct resources');}
console.log(JSON.stringify({status:'PASS',passes:processed,checks,failures:0,relocations:fixups,authenticated8ByteDescriptors:totalDesc,verifiedO69SuffixStreams:totalSuffix,newExactFull:allPromoted,full8:full8count,hybrid:hybridCount}));
