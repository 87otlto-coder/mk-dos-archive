/** O133: original-file-backed stage movement input candidates, NOT a motion playback engine.
 * All nine signed 16.16 words are preserved. Timing, transform selection,
 * animation order and real-time parallax remain unproven.
 */
import type {O122Stage} from './stageIndexedPlacementsO122.ts';
const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJECT2=0xa0c54;
const STAGES={tomb:{root:0x171f0,table:0x172dc},portal:{root:0x16378,table:0x1641c}};
const DISPATCH={mode_equals_2:0x15bec,mode_equals_1:0x15c68,mode_other:0x15ce4};
function requireO133(ok:boolean,message:string):asserts ok {if(!ok)throw Error('O133 motion source: '+message);}
function readU32(x:DataView,at:number){requireO133(at>=0&&at+4<=x.byteLength,'DWORD outside source');return x.getUint32(at,true);}
export async function readMK2StageMotionSourceO133(exe:Uint8Array,stage:O122Stage){
 requireO133(stage==='tomb'||stage==='portal','unauthenticated stage');
 const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer)),v=>v.toString(16).padStart(2,'0')).join('');
 requireO133(actual===EXE_SHA,'noncanonical original MK2.EXE');
 const spec=STAGES[stage];const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const data:Record<string,{rootObject2:number;inputObject2:number;rawWords:number[]}>={};
 for(const [mode,base] of Object.entries(DISPATCH)){
  const index=stage==='tomb'?1:7;
  const root=readU32(view,OBJECT2+base+4*index);
  const table=readU32(view,OBJECT2+root+0x14);
  requireO133(OBJECT2+table+36<=exe.length,'input table outside EXE');
  const rawWords=Array.from({length:9},(_,i)=>view.getInt32(OBJECT2+table+4*i,true));
  data[mode]={rootObject2:root,inputObject2:table,rawWords};
 }
 requireO133(data.mode_equals_2.rootObject2===spec.root&&data.mode_equals_2.inputObject2===spec.table,
  'stage root movement table changed');
 for(const row of Object.values(data)){
  requireO133(row.rawWords.every((w,i)=>w===data.mode_equals_2.rawWords[i]),'modes have different input values');
 }
 return {stage,stageIndex:stage==='tomb'?1:7,sourceTableObject2:spec.table,
  rawSigned16_16:data.mode_equals_2.rawWords,modeCandidates:data,
  sourceWordsAuthenticated:true,liveTransformRecovered:false,parallaxMultiplierRecovered:false,
  animationFrameSequenceRecovered:false,animationDurationRecovered:false,
  nativeSourceMustRemainUncropped:true,
  qualification:'STATIC_SOURCE_INPUT_WORDS_NOT_LIVE_PARALLAX_OR_ANIMATION' as const};
}
