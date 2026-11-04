#!/usr/bin/env node
/** Independent O97C/D from authentic GRA bytes and EXE setup words; verifies lossless atlas, crop and PNG RGBA. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';
const [fixture,root]=process.argv.slice(2);if(!root)throw Error('usage fixture-root source-root');
const H=v=>crypto.createHash('sha256').update(v).digest('hex');let checks=0;
const ok=(v,what)=>{checks++;if(!v)throw Error('O97C/O97D verification failed: '+what)};
const exe=fs.readFileSync(path.join(fixture,'mk2.exe')),gra=fs.readFileSync(path.join(fixture,'mountain.gra'));const P=o=>0xa0c54+o;
const r=JSON.parse(fs.readFileSync(path.join(root,'mk2_mountain_tall_layer_atlas_and_setup_crop_o97c_o97d_2026-10-09.json')));
const qa=fs.readFileSync(path.join(root,'mk2_mountain_49_control_placement_grid_o97a_2026-10-09.json')),ya=fs.readFileSync(path.join(root,'mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json'));
const q=JSON.parse(qa),y=JSON.parse(ya);
ok(r.status==='SUCCESS'&&r.format==='mk2_o97c_o97d_mountain_tall_conditional_source_layer_v1','format');
ok(H(exe)===r.fixture.exeSha256&&H(gra)===r.fixture.graSha256,'authentic fixtures');
ok(H(qa)===r.parent.o97aSha256&&H(ya)===r.parent.o96ySha256,'parents');
let setups=[0x1c31e,0x1c330].map(o=>({offset:o,width:exe.readUInt16LE(P(o)),height:exe.readUInt16LE(P(o)+2),entries:exe.readUInt16LE(P(o)+4)}));
ok(JSON.stringify(setups)===JSON.stringify(r.o97d.setupRecords)&&setups[0].width===320&&setups[0].height===768&&setups[0].entries===39&&setups[1].width===320&&setups[1].height===200&&setups[1].entries===10,'file-backed setup header dimensions');
const data=[];for(let k=0;k<39;k++){
 const at=P(0x1c5dc+k*8),token=exe.readUInt16LE(at),sx=exe.readInt16LE(at+2),sy=exe.readInt16LE(at+4),select=exe.readUInt16LE(at+6);const ordinal=(select&0x0fff)/2,descriptor=0x1c344+ordinal*8;
 ok(token===0x4042 && ordinal>=0&&ordinal<49 && Number.isInteger(ordinal),'serialized control token '+k);
 const d=P(descriptor),width=exe.readUInt16LE(d),height=exe.readUInt16LE(d+2),packed=exe.readUInt32LE(d+4),src=packed&0xffffff;
 ok((packed>>>24)===37&&src<gra.length&&width>0&&height>0,'real sprite descriptor '+k);
 data.push({entryIndex:k,descriptorOrdinal:ordinal,x:sx,y:sy,width,height,src,descriptor});
 ok(r.o97c.sourceRecords[k].descriptorOrdinal===ordinal&&r.o97c.sourceRecords[k].x===sx&&r.o97c.sourceRecords[k].y===sy&&r.o97c.sourceRecords[k].width===width&&r.o97c.sourceRecords[k].height===height,'report sourced from exe '+k);
 ok(y.sprites[ordinal].descriptorOffset===descriptor&&y.sprites[ordinal].graStart===src,'prior sprite matches exe '+k);
}
ok(data.length===39&&new Set(data.map(x=>x.descriptorOrdinal)).size===39,'39 distinct sprite descriptors');
const x0=Math.min(...data.map(t=>t.x)),y0=Math.min(...data.map(t=>t.y)),x1=Math.max(...data.map(t=>t.x+t.width)),y1=Math.max(...data.map(t=>t.y+t.height)),w=x1-x0,h=y1-y0;
ok(x0===-8&&y0===-48&&x1===320&&y1===848&&w===328&&h===896,'derived bounding extent');
ok(r.o97c.atlasOrigin.x===x0&&r.o97c.atlasOrigin.y===y0&&r.o97c.atlasDimensions.width===w&&r.o97c.atlasDimensions.height===h,'bbox report');
const indices=Buffer.alloc(w*h),mask=Buffer.alloc(w*h),rect=Buffer.alloc(w*h),opaque=Buffer.alloc(w*h);let total=0;
for(let k=0;k<data.length;k++){
 const s=data[k],pbuf=Buffer.alloc(s.width*s.height),abuf=Buffer.alloc(s.width*s.height);let ip=s.src;
 for(let y=0;y<s.height;y++){
  let x=0;while(x<s.width){ok(ip+4<=gra.length,'command bounds');let cmd=gra.readUInt32LE(ip);ip+=4;let n=0,chunk=null;
   if(cmd&1){n=cmd>>>1;}else if(cmd&2){n=cmd>>>10;chunk=Buffer.alloc(n,(cmd>>>2)&255);}else{n=cmd>>>2;ok(ip+n<=gra.length,'literal in file');chunk=gra.subarray(ip,ip+n);ip+=(n+3)&~3;}
   ok(n>0&&n+x<=s.width,'run width');if(chunk){chunk.copy(pbuf,y*s.width+x);abuf.fill(1,y*s.width+x,y*s.width+x+n)}x+=n;
  }
 }
 ok(ip===y.sprites[s.descriptorOrdinal].endExclusive&&H(pbuf)===y.sprites[s.descriptorOrdinal].pixelSha256&&H(abuf)===y.sprites[s.descriptorOrdinal].maskSha256,'complete independent decoding '+k);
 const n=abuf.reduce((v,a)=>v+a,0);total+=n;ok(n===y.sprites[s.descriptorOrdinal].opaquePixels&&n===r.o97c.sourceRecords[k].opaqueSource,'source pixel counts '+k);
 for(let dy=0;dy<s.height;dy++){let dst=(s.y-y0+dy)*w+(s.x-x0),source=dy*s.width;for(let dx=0;dx<s.width;dx++){
  let off=dst+dx,j=source+dx;rect[off]++;if(abuf[j]){opaque[off]++;indices[off]=pbuf[j];mask[off]=1;}
 }}
}
const rc=rect.reduce((v,n)=>v+Number(n>0),0),rd=rect.reduce((v,n)=>v+Number(n>1),0),ao=mask.reduce((v,n)=>v+n,0),od=opaque.reduce((v,n)=>v+Number(n>1),0);
ok(total===r.o97c.sourceOpaquePixelInstances&&ao===r.o97c.finalOpaqueAtlasPixels,'pixel totals');
ok(rc===r.o97c.rectPositionsCovered&&rd===r.o97c.rectPositionsDoubleOwned&&od===r.o97c.opaquePositionsDoubleOwned,'overlap counts');
ok(ao+ r.o97c.opaqueAtlasTransparentPixels===w*h&&od===0,'no double-opaque overlays');
const croppedI=Buffer.alloc(320*768),croppedA=Buffer.alloc(320*768);let croppedCovered=0;
for(let yy=0;yy<768;yy++)for(let xx=0;xx<320;xx++){let src=(yy-y0)*w+(xx-x0),dst=yy*320+xx;croppedI[dst]=indices[src];croppedA[dst]=mask[src];croppedCovered+=Number(rect[src]>0);}
let outsideRect=0,outsideOpaque=0;for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++)if(xx<0||xx>=320||yy<0||yy>=768){let i=(yy-y0)*w+xx-x0;outsideRect+=Number(rect[i]>0);outsideOpaque+=Number(mask[i]>0);}
ok(r.o97d.cropOpaquePixels===croppedA.reduce((v,n)=>v+n,0)&&r.o97d.cropTransparentPixels===croppedA.length-r.o97d.cropOpaquePixels,'crop opacity counts');
ok(r.o97d.cropRectPositionsCovered===croppedCovered&&r.o97d.outsideDeclaredRectPositionsCovered===outsideRect&&r.o97d.outsideDeclaredOpaquePixels===outsideOpaque,'out-of-bounds source counts');
const load=k=>{let meta=r.outputs[k],b=fs.readFileSync(path.join(root,meta.path));ok(b.length===meta.bytes&&H(b)===meta.sha256,'output SHA '+k);return b};
for(let [name,arr] of [['atlasIndices',indices],['atlasOpacity',mask],['atlasRectangleOwners',rect],['atlasOpaqueOwners',opaque],['cropIndices',croppedI],['cropOpacity',croppedA]]){let b=load(name);ok(b.equals(arr),'exact pixel bytes '+name);}
let colors=Array.from({length:207},(_,i)=>exe.readUInt16LE(0x8d180+i*2));ok(exe.readUInt16LE(0x8d17e)===207,'authentic palette count');
function decodePng(png,width,height,pix,alpha,label){ok(png.subarray(0,8).toString('hex')==='89504e470d0a1a0a',label+' PNG');let p=8,parts=[],pw,ph,depth,ctype;
 while(p<png.length){let n=png.readUInt32BE(p),t=png.toString('ascii',p+4,p+8);ok(p+12+n<=png.length,label+' chunk');if(t==='IHDR'){pw=png.readUInt32BE(p+8);ph=png.readUInt32BE(p+12);depth=png[p+16];ctype=png[p+17];}if(t==='IDAT')parts.push(png.subarray(p+8,p+8+n));p+=n+12;if(t==='IEND')break;}
 ok(pw===width&&ph===height&&depth===8&&ctype===6,label+' RGBA dims');let raw=zlib.inflateSync(Buffer.concat(parts)),out=Buffer.alloc(width*height*4),stride=width*4;let rp=0;
 const paeth=(a,b,c)=>{let p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c};
 for(let row=0;row<height;row++){let filter=raw[rp++];ok(filter>=0&&filter<=4,label+' PNG filter');for(let j=0;j<stride;j++){let v=raw[rp++],a=j>=4?out[row*stride+j-4]:0,b=row?out[(row-1)*stride+j]:0,c=(row&&j>=4)?out[(row-1)*stride+j-4]:0;if(filter===1)v+=a;else if(filter===2)v+=b;else if(filter===3)v+=Math.floor((a+b)/2);else if(filter===4)v+=paeth(a,b,c);out[row*stride+j]=v&255;}}
 ok(rp===raw.length,label+' complete png scanlines');
 for(let i=0;i<pix.length;i++){ok(out[i*4+3]===alpha[i]*255,label+' alpha '+i);if(alpha[i]){let word=colors[pix[i]],rgb=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1];for(let c=0;c<3;c++)ok(out[i*4+c]===Math.round(rgb[c]*255/63),label+' candidate color '+i);}}
}
decodePng(load('atlasPreview'),w,h,indices,mask,'atlas');decodePng(load('cropPreview'),320,768,croppedI,croppedA,'crop');
ok(r.hypotheses.tallAtlasIsObservedStageFrame==='REJECTED'&&r.hypotheses.tenTileAnd39SpriteLayersSimultaneouslyActive==='UNPROVEN'&&r.hypotheses.drawOrderIsActualGameZOrder==='UNPROVEN','semantic guardrails');
console.log(JSON.stringify({status:'PASS',checks,failures:0,records:39,atlasPixels:w*h,atlasOpaque:ao,cropOpaque:r.o97d.cropOpaquePixels,rectangleDoubleOwned:rd,opaqueDoubleOwned:od,sourceOpaqueInstances:total,pngsVerified:2}));
