/** O130 bounded original-EXE stage-root -> control-stream evidence. Not live gameplay state. */
const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const O2=0xa0c54;
const TABLES=[0x15bec,0x15c68,0x15ce4] as const;
const EXPECT_DRAW=new Set([1,2,3,4,5,7,8]);
function ok(condition:boolean,message:string):asserts condition{if(!condition)throw new Error('O130 authenticated control streams: '+message);}
function sig(e:Uint8Array,p:number,hex:string){const actual=Array.from(e.subarray(p,p+hex.length/2),b=>b.toString(16).padStart(2,'0')).join('');ok(actual===hex,'original opcode '+p.toString(16));}
export interface O130DrawCommand {readonly at:number;readonly sourcePointer:number;readonly rawParameter2:number;readonly rawParameter3:number;}
export interface O130StageEntry {readonly index:number;readonly resourceID:number;readonly resourceName:string;readonly streamObject2:number;readonly rootsByMode:readonly number[];readonly pairCount:number;readonly otherNegativeCount:number;readonly drawCommands:readonly O130DrawCommand[];}
export interface O130StageEvidence {readonly evidence:'ORIGINAL_EXE_STATIC_STAGE_LINKS_NOT_LIVE';readonly rootStreamOffset:24;readonly rootLoaderPhysical:0x81eb2;readonly dynamicPointerLoadPhysical:0x81f55;readonly guardedRendererPhysical:0x9e118;readonly stages:readonly O130StageEntry[];readonly liveValuesObserved:false;}
export async function readMK2StageDynamicStreamsO130(exe:Uint8Array):Promise<O130StageEvidence>{
 ok(exe.length===861133,'expected canonical EXE size');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',exe.slice().buffer)),b=>b.toString(16).padStart(2,'0')).join('');
 ok(hash===SHA,'canonical original EXE hash');
 for(const [p,h] of [[0x82353,'8b00a3805a0700e853fbffff'],[0x98bcf,'8b00e8dc92feff'],[0x81eb2,'575051568b00e89b07feff'],[0x81ede,'5e595883c004'],[0x81f55,'8b1883c004891df65c0700'],[0x93557,'74517931407410'],[0x93585,'e88eab0000'],[0x9e118,'f705d4620500010000007473']] as const) sig(exe,p,h);
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const u=(p:number)=>{ok(p>=0&&p+4<=exe.length,'bounded dword');return dv.getUint32(p,true);};
 const s=(p:number)=>{ok(p>=0&&p+4<=exe.length,'bounded signed dword');return dv.getInt32(p,true);};
 const names=new TextDecoder('ascii').decode(exe.slice(0xa0ef1,0xa13a7)).split('\0').filter(Boolean);
 ok(names[28]==='TOMB.GRA'&&names[25]==='PORTAL.GRA','source resource registry');
 const stages:O130StageEntry[]=[];
 for(let index=0;index<10;index++){
  const roots=TABLES.map(base=>u(O2+base+4*index));
  ok(roots.every(root=>root>0&&O2+root+28<=exe.length),'original stage roots');
  const streams=roots.map(root=>u(O2+root+24));
  ok(streams[0]===streams[1]&&streams[1]===streams[2],'same first-ten stream in three modes');
  const packed=u(O2+roots[0]),id=packed>>>24;
  ok(id>0&&id<names.length,'packed resource ID');
  let p=streams[0],pairCount=0,otherNegativeCount=0;const drawCommands:O130DrawCommand[]=[];
  let terminated=false;
  for(let c=0;c<128;c++){
   const token=s(O2+p);
   if(token===0){terminated=true;break;}
   if(token===-1){drawCommands.push({at:p,sourcePointer:u(O2+p+4),rawParameter2:u(O2+p+8),rawParameter3:u(O2+p+12)});p+=16;}
   else if(token>0){ok(u(O2+p+4)>0,'positive pair pointer');pairCount++;p+=8;}
   else{ok(token===-2,'unexpected negative token');otherNegativeCount++;p+=4;}
  }
  ok(terminated,'zero terminator within 128 commands');
  ok(drawCommands.length===(EXPECT_DRAW.has(index)?1:0),'known draw dispatch at '+index);
  stages.push({index,resourceID:id,resourceName:names[id],streamObject2:streams[0],rootsByMode:roots,pairCount,otherNegativeCount,drawCommands});
 }
 ok(stages[1].streamObject2===0x17300&&stages[7].streamObject2===0x16440,'Tomb/Portal stage streams');
 return {evidence:'ORIGINAL_EXE_STATIC_STAGE_LINKS_NOT_LIVE',rootStreamOffset:24,rootLoaderPhysical:0x81eb2,dynamicPointerLoadPhysical:0x81f55,guardedRendererPhysical:0x9e118,stages,liveValuesObserved:false};
}
