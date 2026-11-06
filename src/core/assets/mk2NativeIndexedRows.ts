/** Native row command decoder, independently qualified on CAVE (P22) and ARMORY (P23).
 * Callers must authenticate their own resource/descriptor provenance and extents.
 * This function supplies indexed planes only; it establishes no palette or scene.
 */
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('MK2 native indexed rows: '+reason);}
export function decodeMK2NativeIndexedRows(gra:Uint8Array,start:number,width:number,height:number){
 need(width>0&&width<=640&&height>0&&height<=480,'native geometry out of bounds');
 const view=new DataView(gra.buffer,gra.byteOffset,gra.byteLength),indices=new Uint8Array(width*height),mask=new Uint8Array(indices.length);
 let pos=start;
 for(let y=0;y<height;y++)for(let x=0;x<width;){
  need(pos+4<=gra.length,'truncated command');const command=view.getUint32(pos,true);pos+=4;
  let count:number;const cell=y*width+x;
  if(command&1)count=command>>>1;
  else if(command&2){count=command>>>10;need(count>0&&count<=width-x,'RLE crosses row');
   indices.fill((command>>>2)&255,cell,cell+count);mask.fill(1,cell,cell+count);
  }else{count=command>>>2;const padded=(count+3)&~3;
   need(count>0&&count<=64&&count<=width-x&&pos+padded<=gra.length,'invalid literal');
   indices.set(gra.subarray(pos,pos+count),cell);mask.fill(1,cell,cell+count);pos+=padded;
  }
  need(count>0&&count<=width-x,'command crosses row');x+=count;
 }
 const rgba=new Uint8Array(indices.length*4);
 for(let i=0;i<indices.length;i++){const v=indices[i],p=i*4;rgba[p]=v;rgba[p+1]=v;rgba[p+2]=v;rgba[p+3]=mask[i]*255;}
 return {end:pos,indices,mask,rgba};
}
