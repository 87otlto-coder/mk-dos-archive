#!/usr/bin/env node
/** Independent O97E: six LE-source word arrangements, 14 real sprite streams, opaque ownership, and PNG candidate. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';
const [fx,root]=process.argv.slice(2);if(!root)throw Error('usage fixture source');const H=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
const ok=(b,m)=>{checks++;if(!b)throw Error('independent O97E '+m)};
const exe=fs.readFileSync(path.join(fx,'mk2.exe')),gra=fs.readFileSync(path.join(fx,'mountain.gra')),P=o=>o+0xa0c54;
const r=JSON.parse(fs.readFileSync(path.join(root,'mk2_mountain_conditional_portrait_tower_overlays_o97e_2026-10-09.json')));
const parent=fs.readFileSync(path.join(root,'mk2_mountain_tall_layer_atlas_and_setup_crop_o97c_o97d_2026-10-09.json'));
const uBuf=fs.readFileSync(path.join(root,'mk2_mountain_conditional_image_layouts_o96u_2026-10-09.json'));
const ref=JSON.parse(parent),u=JSON.parse(uBuf);
ok(r.status==='SUCCESS'&&r.format==='mk2_o97e_mountain_conditional_portrait_tower_overlay_hypothesis_v1','report format');
ok(r.fixtureExeSha256===H(exe)&&r.fixtureGraSha256===H(gra),'original bytes');
ok(r.parentO97cSha256===H(parent)&&r.parentO96uSha256===H(uBuf),'parents');
const w=328,h=896,load=k=>fs.readFileSync(path.join(root,ref.outputs[k].path));const base=load('atlasIndices'),bmask=load('atlasOpacity');
ok(base.length===w*h&&bmask.length===w*h,'original atlas bytes');
// Fresh source decoding: do NOT copy decoded pixels from the producer or preceding reports.
let portraits=[];
for(let id=0;id<14;id++){
 const desc=P(0x1c4cc+16*id),a=exe.readUInt16LE(desc),b=exe.readUInt16LE(desc+2),packed=exe.readUInt32LE(desc+8);ok(a===35&&b===41&&packed>>>24===37,'portrait descriptor '+id);
 let pos=packed&0xffffff,px=Buffer.alloc(35*41),opaque=Buffer.alloc(35*41);
 for(let y=0;y<41;y++){let x=0;while(x<35){ok(pos+4<=gra.length,'command within source');let word=gra.readUInt32LE(pos);pos+=4;let len,copy=null;
  if(word&1)len=word>>>1;else if(word&2){len=word>>>10;copy=Buffer.alloc(len,(word>>>2)&255)}else{len=word>>>2;ok(pos+len<=gra.length,'literal within source');copy=gra.subarray(pos,pos+len);pos+=(len+3)&~3;}
  ok(len>0&&len<=35-x,'width');if(copy){copy.copy(px,y*35+x);opaque.fill(1,y*35+x,y*35+x+len)}x+=len;
 }}ok(opaque.every(x=>x===1),'fully opaque selected portrait '+id);portraits.push(px);
}
const outputs=new Set(),alphaHashes=new Set();
for(let k=0;k<6;k++){
 const rv=r.variants[k],uv=u.variants[k],canvas=Buffer.from(base),alpha=Buffer.from(bmask),placed=Buffer.alloc(w*h),tokens=[];
 ok(rv.choice===k&&uv.choice===k&&uv.rows.length===14,'variant identity '+k);
 // Six record pointers and 14 parsed tokens from authentic file-backed Object-2 table.
 // Use verified O96R table as an explicit coordinate check in addition to raw record reads.
 const r96=JSON.parse(fs.readFileSync(path.join(root,'mk2_six_way_signed_word_stream_records_o96r_2026-10-09.json')));
 const original=r96.entries[k];ok(exe.readUInt32LE(P(original.entryOffset))===original.targetOffset,'real relocated selection pointer');
 ok(original.targetOffset===uv.streamOffset,'stream provenance');
 let added=0,overwritten=0;
 for(let j=0;j<14;j++){
  let tok=exe.readInt16LE(P(original.targetOffset)+j*2);ok(tok===uv.rows[j].token&&tok!==13&&tok>=0&&tok<15,'actual signed token '+k+':'+j);
  let descriptorPointer=exe.readUInt32LE(P(0x1c264+tok*4)),id=(descriptorPointer-0x1c4cc)/16;
  ok(Number.isInteger(id)&&id>=0&&id<14&&uv.rows[j].decodedImageOrdinal===id,'authentic descriptor table mapping '+k+':'+j);
  let x=uv.rows[j].lowWordObjectPlus1A,y=uv.rows[j].highWordObjectPlus1E;
  ok(x===197&&y===771-47*j&&y>=160&&y<=771,'raw 47-unit spacing '+k+':'+j);
  tokens.push(id);let pic=portraits[id];for(let yy=0;yy<41;yy++)for(let xx=0;xx<35;xx++){
    let at=(y+48+yy)*w+x+8+xx;ok(!placed[at],'no portrait rectangle overlap '+k+':'+j);placed[at]=1;
    if(alpha[at])overwritten++;else added++;canvas[at]=pic[yy*35+xx];alpha[at]=1;
  }
 }
 ok(exe.readInt16LE(P(original.targetOffset)+14*2)===13,'real terminator is token 13, not -1 '+k);
 ok(new Set(tokens).size===14&&tokens.every(id=>id>=0&&id<14),'exactly fourteen distinct portrait records '+k);
 ok(JSON.stringify(tokens)===JSON.stringify(rv.sourceImageTokens),'token arrangement parity '+k);
 ok(added===rv.addedOpaquePixels&&overwritten===rv.overwrittenOpaquePixels&&overwritten===0,'all portraits fill previous transparency '+k);
 ok(added+overwritten===rv.portraitPixels&&added===20090,'all 14*35*41 source pixels '+k);
 ok(alpha.reduce((p,n)=>p+n,0)===rv.finalOpaquePixels&&H(alpha)===rv.maskSha256,'full composite alpha '+k);
 const saved=fs.readFileSync(path.join(root,rv.indices.path));ok(saved.length===w*h&&saved.equals(canvas)&&H(saved)===rv.indexSha256&&H(saved)===rv.indices.sha256,'full composite source pixel parity '+k);
 let wasSeen=outputs.has(H(canvas));outputs.add(H(canvas));alphaHashes.add(H(alpha));ok(rv.uniqueAgainstPreviousVariants===!wasSeen, 'unique variant marker '+k);
 if(k===0){const png=fs.readFileSync(path.join(root,r.previewCandidateVariant0.path));ok(H(png)===r.previewCandidateVariant0.sha256,'preview hash');
  ok(png.subarray(0,8).toString('hex')==='89504e470d0a1a0a','PNG signature');let p=8,compressed=[],width,height,bitDepth,ctype;
  while(p<png.length){let n=png.readUInt32BE(p),t=png.toString('ascii',p+4,p+8);ok(p+n+12<=png.length,'PNG chunk range');if(t==='IHDR'){width=png.readUInt32BE(p+8);height=png.readUInt32BE(p+12);bitDepth=png[p+16];ctype=png[p+17];}if(t==='IDAT')compressed.push(png.subarray(p+8,p+8+n));p+=n+12;if(t==='IEND')break;}
  ok(width===w&&height===h&&bitDepth===8&&ctype===6,'PNG RGBA dimensions');let raw=zlib.inflateSync(Buffer.concat(compressed)),rgba=Buffer.alloc(w*h*4),rp=0;
  let paeth=(a,b,c)=>{let p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c};
  for(let yy=0;yy<h;yy++){let filter=raw[rp++];ok(filter>=0&&filter<=4,'PNG filter');for(let j=0;j<w*4;j++){let v=raw[rp++],left=j>=4?rgba[yy*w*4+j-4]:0,up=yy?rgba[(yy-1)*w*4+j]:0,cross=yy&&j>=4?rgba[(yy-1)*w*4+j-4]:0;if(filter===1)v+=left;if(filter===2)v+=up;if(filter===3)v+=Math.floor((left+up)/2);if(filter===4)v+=paeth(left,up,cross);rgba[yy*w*4+j]=v&255;}}
  ok(rp===raw.length,'PNG completely decoded');let pal=Array.from({length:207},(_,i)=>exe.readUInt16LE(0x8d180+i*2));
  for(let at=0;at<canvas.length;at++){ok(rgba[at*4+3]===alpha[at]*255,'PNG alpha pixel '+at);if(alpha[at]){let c=pal[canvas[at]],rgb=[((c>>9)&63)|1,((c>>4)&63)|1,((c<<1)&63)|1];for(let z=0;z<3;z++)ok(rgba[at*4+z]===Math.round(rgb[z]*255/63),'PNG palette candidate '+at+':'+z);}}
 }
}
ok(outputs.size===5&&r.uniqueComposites===5,'five distinct compositing variants');ok(alphaHashes.size===1,'variant-invariant geometry and opacity');
ok(r.hypotheses.portraitSpritesActuallyActiveWithTallSetupAtRuntime==='UNPROVEN'&&r.hypotheses.combinedCompositionMatchesAnObservedGameFrame==='UNPROVEN','no gameplay claim');
console.log(JSON.stringify({status:'PASS',checks,failures:0,variants:6,unique:outputs.size,portraitPixelsPerVariant:20090,allPixelPositionsReconstructed:true,candidatePngVerified:true}));
