/** O125 source-authenticated conditional stage root tables. Not live mode or handle state.
 * Input must be the user's unmodified MK2.EXE, with exact canonical SHA-256.
 */
export const O125_QUALIFICATION='STATIC_CONDITIONAL_STAGE_ROOTS_NOT_OBSERVED_RUNTIME_SELECTION';
const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJ2=0xa0c54;
const BASES={mode_equals_2:0x15bec,mode_equals_1:0x15c68,mode_other:0x15ce4} as const;
export type O125Mode=keyof typeof BASES;
function ensure(x:boolean,message:string):asserts x{if(!x)throw new Error('O125 stage routing: '+message);}
export interface O125Routing {qualification:typeof O125_QUALIFICATION;tables:Record<O125Mode,(number|null)[]>;changingIndices:number[];stageRoots:{tomb:Record<O125Mode,number>;portal:Record<O125Mode,number>};runtimeModeObserved:false;runtimeStageIndexObserved:false;
 /** O126: precise original-code evidence; does not indicate any live selection. */
 sourceModeLifecycle:{defaultMode2ConditionalOnChecksumMismatch:true;temporaryMode3Writes:readonly [number,number];modeBackupAddress:number;mode1FallbackDifferentIndices:number[];runtimeModeKnown:false}}

export async function readMK2ConditionalStageRootTablesO125(exe:Uint8Array):Promise<O125Routing>{
 ensure(exe.length===861133,'wrong original game executable size');
 const b=await crypto.subtle.digest('SHA-256',exe.slice().buffer);
 ensure(Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('')===SHA,'not canonical MK2.EXE');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const signatures:[number,string][]=[
  [0x8232c,'c1e002baec5b0100'],[0x82334,'833d4c01030002'],[0x8233d,'ba685c0100'],[0x82342,'833d4c01030001'],[0x8234b,'bae45c0100'],
  [0x82350,'03c25a8b00a3805a0700'],
  [0x98ba8,'c1e002baec5b0100'],[0x98bb0,'833d4c01030002'],[0x98bb9,'ba685c0100'],[0x98bbe,'833d4c01030001'],[0x98bc7,'bae45c0100'],
  [0x98bcc,'03c25a8b00'],
 ];
 for(const [at,hex] of signatures){const found=Array.from(exe.subarray(at,at+hex.length/2),n=>n.toString(16).padStart(2,'0')).join('');ensure(found===hex,'instruction signature '+at.toString(16));}
 const lifecycleSignatures:[number,string][]=[
  [0x65188,'663b1d32020300743f'],[0x651ba,'c7054c01030002000000'],
  [0x9a9df,'a14c010300a30f030300'],[0x9aa54,'a10f030300a34c010300'],
  [0x9b284,'c7054c01030003000000'],[0x9b29d,'528b55008d6d0489154c0103005a'],
  [0x9b2de,'c7054c01030003000000'],[0x9b2f7,'528b55008d6d0489154c0103005a']
 ];
 for(const [at,hex] of lifecycleSignatures){const actual=Array.from(exe.subarray(at,at+hex.length/2),n=>n.toString(16).padStart(2,'0')).join('');ensure(actual===hex,'O126 mode lifecycle '+at.toString(16));}
 const tables={} as Record<O125Mode,(number|null)[]>;
 for(const mode of Object.keys(BASES) as O125Mode[]){
  const base=BASES[mode];const records:(number|null)[]=[];
  for(let i=0;i<31;i++){
   const n=dv.getUint32(OBJ2+base+4*i,true);
   ensure((i===10||i===11||i===21)?n===0:n!==0,`invalid null root at ${mode}:${i}`);
   records.push(n||null);
  }
  tables[mode]=records;
 }
 const changingIndices=Array.from({length:31},(_,i)=>i).filter(i=>new Set((Object.keys(BASES) as O125Mode[]).map(m=>tables[m][i])).size>1);
 ensure(JSON.stringify(changingIndices)==='[0,1,2,3,4,5,6,7]','mode-sensitive index census');
 ensure(tables.mode_equals_2[1]===0x171f0&&tables.mode_equals_1[1]===0x1726c&&tables.mode_other[1]===0x1726c,'Tomb root mapping');
 ensure(tables.mode_equals_2[7]===0x16378&&tables.mode_equals_1[7]===0x163d0&&tables.mode_other[7]===0x163d0,'Portal root mapping');
 const mode1FallbackDifferentIndices=Array.from({length:31},(_,i)=>i).filter(i=>tables.mode_equals_1[i]!==tables.mode_other[i]);
 ensure(JSON.stringify(mode1FallbackDifferentIndices)==='[0,4]','O126 mode1 vs fallback difference');
 const getStage=(idx:number)=>Object.fromEntries((Object.keys(BASES) as O125Mode[]).map(mode=>[mode,tables[mode][idx]!])) as Record<O125Mode,number>;
 return {qualification:O125_QUALIFICATION,tables,changingIndices,stageRoots:{tomb:getStage(1),portal:getStage(7)},runtimeModeObserved:false,runtimeStageIndexObserved:false,sourceModeLifecycle:{defaultMode2ConditionalOnChecksumMismatch:true,temporaryMode3Writes:[0x9b284,0x9b2de],modeBackupAddress:0x3030f,mode1FallbackDifferentIndices,runtimeModeKnown:false}};
}
