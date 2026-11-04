/** O134: original stage-init function refs, not executable or animation playback. */
import type {O122Stage} from './stageIndexedPlacementsO122.ts';
const HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJ1=0x61c54,OBJ2=0xa0c54;
const STAGE={tomb:{index:1,root:0x171f0,callback:0x82cd7,sites:[0x82ce7,0x82cfa]},
 portal:{index:7,root:0x16378,callback:0x8272a,sites:[0x82793,0x827bf,0x827d2,0x827e6]}} as const;
function assert(ok:boolean,m:string):asserts ok{if(!ok)throw Error('O134 behavior sources: '+m);}
export async function readMK2StageBehaviorCallbacksO134(exe:Uint8Array,stage:O122Stage){
 assert(stage==='tomb'||stage==='portal','stage outside authenticated set');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer)),
  v=>v.toString(16).padStart(2,'0')).join('');
 assert(digest===HASH,'canonical MK2.EXE required');
 const spec=STAGE[stage],v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const callback=v.getUint32(OBJ2+spec.root+16,true);
 assert(OBJ1+callback===spec.callback,'initializer callback pointer changed');
 const registrations=spec.sites.map(site=>{
  assert(exe[site-5]===0xbb&&exe[site-4]===6&&exe[site]===0xba&&exe[site+5]===0xe8,
   'source registration instruction changed');
  const disp=v.getInt32(site+6,true);
  assert(site+10+disp===0x67222,'unexpected source call target');
  const functionOffset=v.getUint32(site+1,true);
  return {scope:site===0x827e6?'nested_helper':'init_callback',moveFunctionPointerPhysical:site,
   registrationCallPhysical:site+5,registerRoutinePhysical:0x67222,argumentEBX:6,
   registeredFunctionObject1:functionOffset,registeredFunctionPhysical:OBJ1+functionOffset};
 });
 return {stage,stageIndex:spec.index,callbackObject1:callback,callbackPhysical:OBJ1+callback,
  registrations,animationFrameSequenceKnown:false,animationFrameDurationKnown:false,
  registeredFunctionRuntimeExecutionObserved:false,uncroppedAssetsPreserved:true};
}
