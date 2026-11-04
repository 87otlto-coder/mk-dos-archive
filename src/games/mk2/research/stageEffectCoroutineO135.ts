/** O135: source-verified scheduler and original stage-specific object-state code.
 * NOT an animation renderer. No sprite track, frame duration or runtime execution proven.
 */
import type {O122Stage} from './stageIndexedPlacementsO122';
const DIGEST='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
function ok(test:boolean,message:string):asserts test{if(!test)throw Error('O135: '+message);}
function match(a:Uint8Array,at:number,hex:string){
 const h=hex.match(/../g)??[];
 ok(h.every((c,i)=>a[at+i]===parseInt(c,16)),`instruction bytes at 0x${at.toString(16)}`);
}
export async function readMK2StageEffectCoroutinesO135(exe:Uint8Array,stage:O122Stage){
 ok(stage==='tomb'||stage==='portal','unsupported stage');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer)),
  x=>x.toString(16).padStart(2,'0')).join('');ok(hash===DIGEST,'original MK2.EXE required');
 match(exe,0x67242,'66c740060100');match(exe,0x6710f,'5a6689460689561c');
 match(exe,0x67158,'66ff4e067ff4');match(exe,0x67182,'8b7e18ff661c');
 const base={stage,schedulerRegistrationPhysical:0x67222,yieldPhysical:0x6710f,
  sourceDelaysAreNotFramesOrSeconds:true,animationFrameOrderKnown:false,
  animationFrameRateKnown:false,renderedObjectBindingKnown:false,
  observedInFight:false,fullNativeSpritesStillExportable:true};
 if(stage==='tomb'){
  match(exe,0x82d65,'b806000000');match(exe,0x82dc7,'b806000000');
  match(exe,0x82d87,'83f830');match(exe,0x82de3,'83fb6c');
  match(exe,0x82d51,'c705785a070014780100');match(exe,0x82db3,'c705785a0700ec770100');
  return {...base,functionEntryPoints:[0x82d33,0x82d9a],sixCountYieldSites:[0x82d65,0x82dc7],
   comparisonThresholds:[48,108],sourcePointerObjects:[0x17814,0x177ec],
   positionOutputField:undefined,boundedUpdate:undefined};
 }
 match(exe,0x82830,'c7057c5a070000300000');
 match(exe,0x82849,'81057c5a070000030000');
 match(exe,0x82879,'812d7c5a070000030000');
 match(exe,0x82853,'528b157c5a07008957145a');
 match(exe,0x82883,'528b157c5a07008957145a');
 match(exe,0x8285e,'813d7c5a070000600000');
 match(exe,0x8288e,'813d7c5a070000a0ffff');
 const valuesUp:number[]=[];const valuesDown:number[]=[];
 for(let x=0x3000;x<0x6000;)valuesUp.push(x+=0x300);
 for(let x=0x6000;x> -0x6000;)valuesDown.push(x-=0x300);
 return {...base,functionEntryPoints:[0x8280c,0x828ff,0x8291f],sixCountYieldSites:[],
  comparisonThresholds:[],sourcePointerObjects:[0x164d8,0x16674,0x164f8],
  positionOutputField:0x14,boundedUpdate:{initial:0x3000,step:0x300,
   positiveLimit:0x6000,negativeLimit:-0x6000,ascendingStepCount:valuesUp.length,
   descendingStepCount:valuesDown.length,sourceArithmeticIsNotPlayback: true}};
}
