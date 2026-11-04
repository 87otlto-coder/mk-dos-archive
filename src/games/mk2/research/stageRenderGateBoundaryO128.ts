/** O128 strict original-EXE-only renderer data-boundary correction to O127.
 * 10 examined source DWORDs != a proven legal runtime index range.
 */
const EXE_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJ1=0x61c54,OBJ2=0xa0c54,BASE=0x2ef54,END=0x2ef7c;
function insist(ok:boolean,msg:string):asserts ok{if(!ok)throw new Error('O128 renderer boundary: '+msg);}
function code(data:Uint8Array,at:number,hex:string){
 const value=Array.from(data.subarray(at,at+hex.length/2),x=>x.toString(16).padStart(2,'0')).join('');
 insist(value===hex,'original opcode '+at.toString(16));
}
export interface O128RendererBoundary {
 evidence:'ORIGINAL_EXE_STATIC_BOUNDED_SAMPLE_NOT_RUNTIME';
 firstTenDWORDs:readonly number[];
 nextRegionObject2:0x2ef7c;
 nextRegionHasIndependentLEPointer:true;
 nextRegionPointerFieldObject2:0x2f1cf;
 flagObject2:0x562d4;
 flagRequiredBitMask:1;
 directE8Caller:0x93585;
 tombResourceId:28;portalResourceId:25;
 legalIndexMaximumObserved:false;
 fullRendererArrayLengthEstablished:false;
 liveFlagObserved:false;liveStageIndexObserved:false;
}
export async function readMK2RendererBoundaryO128(exe:Uint8Array):Promise<O128RendererBoundary>{
 insist(exe.length===861133,'size');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer)),x=>x.toString(16).padStart(2,'0')).join('');
 insist(hash===EXE_HASH,'canonical MK2.EXE');
 code(exe,0x9e118,'f705d4620500010000007473');
 code(exe,0x9e165,'a17f74070003348554ef0200');
 code(exe,0x93585,'e88eab0000');
 code(exe,0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const values=Array.from({length:(END-BASE)/4},(_,i)=>dv.getUint32(OBJ2+BASE+i*4,true));
 insist(values.length===10&&values[0]===0&&values[6]===0&&values[9]===0,'ten raw values');
 insist(values[1]>>>24===28&&values[7]>>>24===25,'stage resource IDs');
 insist(dv.getUint32(OBJ2+0x2f1cf,true)===END,'next-region separately referenced pointer target');
 insist(dv.getUint32(OBJ2+END,true)===0x00a4b7b7,'following distinct data signature');
 const callers:number[]=[];
 for(let at=OBJ1;at<OBJ2-4;at++){
  if(exe[at]===0xe8&&at+5+dv.getInt32(at+1,true)===0x9e118)callers.push(at);
 }
 insist(callers.length===1&&callers[0]===0x93585,'unique direct caller');
 return {evidence:'ORIGINAL_EXE_STATIC_BOUNDED_SAMPLE_NOT_RUNTIME',firstTenDWORDs:values,
  nextRegionObject2:0x2ef7c,nextRegionHasIndependentLEPointer:true,nextRegionPointerFieldObject2:0x2f1cf,
  flagObject2:0x562d4,flagRequiredBitMask:1,directE8Caller:0x93585,
  tombResourceId:28,portalResourceId:25,legalIndexMaximumObserved:false,
  fullRendererArrayLengthEstablished:false,liveFlagObserved:false,liveStageIndexObserved:false};
}
