/** O129 source-qualified *fixed* control-stream roots; dynamic streams remain unknown. */
const H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const O2=0xa0c54;
const streams=[{start:0x13cec,count:10,end:0x13d3c},{start:0x1410c,count:4,end:0x1412c},{start:0x15d60,count:10,end:0x15db0}] as const;
function insist(ok:boolean,what:string):asserts ok{if(!ok)throw new Error('O129 control-stream source: '+what);}
function signature(e:Uint8Array,p:number,h:string){
 const got=Array.from(e.subarray(p,p+h.length/2),n=>n.toString(16).padStart(2,'0')).join('');insist(got===h,'opcode '+p.toString(16));
}
export interface O129FixedStream {
 object2Start:number;terminatorObject2:number;
 readonly pointerPairs:ReadonlyArray<readonly [number,number]>;
 containsMinusOne:false;
}
export interface O129StreamEvidence{
 evidence:'ORIGINAL_EXE_STATIC_FIXED_LISTS_ONLY';
 readonly fixedStreams:readonly O129FixedStream[];
 directTypedStreamPointerReferences:9;
 readonly dynamicPointerLoadPhysical:0x81f55;
 readonly minusOneRendererCaller:0x93585;
 liveStreamPointerObserved:false;
 allDynamicStreamsEnumerated:false;
}
export async function readMK2FixedControlStreamsO129(exe:Uint8Array):Promise<O129StreamEvidence>{
 insist(exe.length===861133,'original size');
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer));
 const hash=Array.from(digest,n=>n.toString(16).padStart(2,'0')).join('');insist(hash===H,'canonical original MK2.EXE');
 signature(exe,0x93500,'8b15f65c07008915985a0700');
 signature(exe,0x93557,'74517931407410');
 signature(exe,0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700');
 signature(exe,0x93585,'e88eab0000ebbb');
 signature(exe,0x81f55,'8b1883c004891df65c0700');
 signature(exe,0x9e118,'f705d4620500010000007473');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const fixedStreams=streams.map(s=>{
  const pointerPairs:[number,number][]=[];
  for(let p=s.start;p<s.end;p+=8){
   const t=dv.getUint32(O2+p,true),value=dv.getUint32(O2+p+4,true);
   insist(t>0&&t<0x90000&&value>0,'source token/pointer at '+p.toString(16));
   pointerPairs.push([t,value]);
  }
  insist(pointerPairs.length===s.count&&dv.getUint32(O2+s.end,true)===0,'bounded terminator');
  return {object2Start:s.start,terminatorObject2:s.end,pointerPairs,containsMinusOne:false as const};
 });
 return {evidence:'ORIGINAL_EXE_STATIC_FIXED_LISTS_ONLY',fixedStreams,
  directTypedStreamPointerReferences:9,dynamicPointerLoadPhysical:0x81f55,minusOneRendererCaller:0x93585,
  liveStreamPointerObserved:false,allDynamicStreamsEnumerated:false};
}
