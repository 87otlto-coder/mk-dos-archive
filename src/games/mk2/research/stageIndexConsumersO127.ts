/** O127 authenticated, *static* stage-index inputs and indexed renderer adjustment.
 * All fields describe original MK2.EXE source. None is a live observed state.
 */
const CANONICAL_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJ2=0xa0c54;
const ADJUST_TABLE=0x2ef54;
const SITES:[number,number][]=[
 [0x771dc,7],[0x779fe,6],[0x77d81,5],[0x84ee4,30],[0x85fa4,13]
];
const CALLERS=[0x74d4d,0x758cc,0x771e6,0x77a08,0x77d8b,0x84d32,0x84eee,0x85fae,0x94965];
function ensure(c:boolean,msg:string):asserts c{if(!c)throw new Error('O127 stage-index: '+msg);}
function is(exe:Uint8Array,at:number,hex:string){
 const actual=Array.from(exe.subarray(at,at+hex.length/2),x=>x.toString(16).padStart(2,'0')).join('');
 ensure(actual===hex,`machine code 0x${at.toString(16)}`);
}
export interface O127StageIndexSource {
 qualification:'STATIC_DISPATCHER_INDEX_AND_RENDER_ADJUSTMENT_NOT_LIVE_CAMERA';
 directCallers:readonly number[];
 adjacentConstantCallers:readonly {callPhysical:number;writtenIndex:number}[];
 renderAdjustments:readonly number[];
 tombSourceIndex:1;portalSourceIndex:7;
 tombRawAdjustment:number;portalRawAdjustment:number;
 runtimeIndexObserved:false;runtimeCameraObserved:false;screenMeaningEstablished:false;
}
export async function readMK2StageIndexConsumersO127(exe:Uint8Array):Promise<O127StageIndexSource>{
 ensure(exe.length===861133,'original MK2.EXE size required');
 const sha=await crypto.subtle.digest('SHA-256',exe.slice().buffer);
 const hash=Array.from(new Uint8Array(sha),x=>x.toString(16).padStart(2,'0')).join('');
 ensure(hash===CANONICAL_SHA,'original MK2.EXE fingerprint required');
 is(exe,0x82321,'a1805a0700a37f740700');
 is(exe,0x8232c,'c1e002');is(exe,0x82353,'8b00a3805a0700');
 is(exe,0x9e118,'f705d4620500010000007473');
 is(exe,0x9e165,'a17f74070003348554ef0200');
 is(exe,0x9e13a,'81e6ffff0000');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const callers:number[]=[];
 for(let p=0x61c54;p<OBJ2-4;p++){
  if(exe[p]!==0xe8)continue;
  if(p+5+dv.getInt32(p+1,true)===0x82321)callers.push(p);
 }
 ensure(JSON.stringify(callers)===JSON.stringify(CALLERS),'direct-call set diverged');
 const fixed:{callPhysical:number;writtenIndex:number}[]=[];
 for(const [at,index] of SITES){
  is(exe,at,'c705805a0700');
  ensure(dv.getUint32(at+6,true)===index,'immediate index '+at.toString(16));
  const call=at+10;ensure(callers.includes(call),'constant has no adjacent direct call');
  fixed.push({callPhysical:call,writtenIndex:index});
 }
 const renderAdjustments=Array.from({length:31},(_,i)=>dv.getUint32(OBJ2+ADJUST_TABLE+4*i,true));
 return {qualification:'STATIC_DISPATCHER_INDEX_AND_RENDER_ADJUSTMENT_NOT_LIVE_CAMERA',
  directCallers:callers,adjacentConstantCallers:fixed,renderAdjustments,
  tombSourceIndex:1,portalSourceIndex:7,tombRawAdjustment:renderAdjustments[1],portalRawAdjustment:renderAdjustments[7],
  runtimeIndexObserved:false,runtimeCameraObserved:false,screenMeaningEstablished:false};
}
