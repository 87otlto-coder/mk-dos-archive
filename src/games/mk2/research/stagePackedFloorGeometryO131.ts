/** O131 original EXE row-geometry analysis, NOT a runtime state capture. */
import type {O130StageEvidence} from './stageDynamicStreamsO130';
export interface O131StageRowGeometry {readonly stageIndex:number;readonly resourceName:string;readonly resourceID:number;readonly commandObject2:number;readonly packedSourceDWORD:number;readonly packedSuffixStart:number;readonly sourceRuntimePointerObject2:number;readonly rawDestinationY:number;readonly requestedRows:number;readonly illustratedZeroScrollVisibleRows:number;readonly liveValuesObserved:false;}
const O2=0xa0c54;
const EXPECTED={1:[28,63776],2:[34,59436],3:[30,56268],4:[27,198116],5:[26,126336],7:[25,56916],8:[31,90488]} as const;
const ok=(value:boolean,message:string):void=>{if(!value)throw Error('O131 renderer argument evidence: '+message);};
function pin(exe:Uint8Array,p:number,hex:string){const actual=Array.from(exe.subarray(p,p+hex.length/2),v=>v.toString(16).padStart(2,'0')).join('');ok(actual===hex,'opcode 0x'+p.toString(16));}
/** verticalScrollFixed is the signed 32-bit value of Object-2 global 0x75A68, hypothetical. */
export function illustrateMK2StageRowGeometryO131(rawY:number,requestedRows:number,verticalScrollFixed=0,cameraWord=288){
 ok([rawY,requestedRows,verticalScrollFixed,cameraWord].every(Number.isInteger),'integer arguments required');
 ok(rawY>=0&&rawY<65536&&requestedRows>=0&&requestedRows<65536,'raw command scalar bounds');
 ok(cameraWord>=0&&cameraWord<=65535,'runtime camera word bounds');
 ok(verticalScrollFixed>=-2147483648&&verticalScrollFixed<=2147483647,'signed fixed-point adjustment bounds');
 const scrollPixels=verticalScrollFixed>>16;
 const dest=(rawY-scrollPixels)>>>0;
 const effective=dest>=200?0:Math.min(requestedRows,200-dest);
 const step=Math.trunc((288-cameraWord)*65536/112);
 const shifts:number[]=[];let acc=0;
 for(let r=0;r<effective;r++) {shifts.push(acc>>16);acc=(acc+step)|0;}
 return {startY:dest<200?dest:null,visibleRows:effective,step16_16:step,perRowSourceCorrection:shifts,liveValuesObserved:false as const};
}
export function readMK2StageRowGeometryO131(exe:Uint8Array,source:O130StageEvidence):readonly O131StageRowGeometry[]{
 ok(exe.byteLength===861133&&source.evidence==='ORIGINAL_EXE_STATIC_STAGE_LINKS_NOT_LIVE'&&!source.liveValuesObserved,'original EXE identity must be authenticated first by O130');
 for(const [p,h] of [[0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700'],
   [0x9e118,'f705d4620500010000007473'],[0x9e138,'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fb'],
   [0x9e15b,'a1685a0700c1f8102bf8'],[0x9e165,'a17f74070003348554ef0200'],
   [0x9e171,'8bc781ffc8000000731c03c13dc80000007207b9c80000002bcf'],
   [0x659c6,'67e3738bdec1eb188d2cdd00000000c1e3048b9c2b34f4020081e6ffffff0003f3'],
   [0x65a0f,'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5']] as const)pin(exe,p,h);
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);const u=(p:number)=>dv.getUint32(p,true);
 const result:O131StageRowGeometry[]=[];
 for(const [indexString,pair] of Object.entries(EXPECTED)){
  const index=Number(indexString),[rid,suffix]=pair,record=source.stages[index],cmd=record?.drawCommands[0];
  ok(!!record&&record.index===index&&record.resourceID===rid&&record.drawCommands.length===1,'authenticated control stream '+index);
  const packed=u(O2+0x2ef54+index*4),pointer=cmd.sourcePointer;
  ok((packed>>>24)===rid&&(packed&0xffffff)===suffix,'original packed stage resource join '+index);
  ok(pointer>exe.length-O2&&(pointer===0x8432a||pointer===0x84312),'runtime pointer outside file-backed original data');
  ok(u(O2+0x2f434+rid*24)===0,'resource map initial offset');
  const y=cmd.rawParameter2,n=cmd.rawParameter3;
  ok(y>0&&y<200&&n>0&&n<=200&&y+n>200,'expected original guarded floor clip');
  result.push({stageIndex:index,resourceName:record.resourceName,resourceID:rid,commandObject2:cmd.at,packedSourceDWORD:packed,
   packedSuffixStart:suffix,sourceRuntimePointerObject2:pointer,rawDestinationY:y,requestedRows:n,
   illustratedZeroScrollVisibleRows:illustrateMK2StageRowGeometryO131(y,n).visibleRows,liveValuesObserved:false});
 }
 return result;
}
