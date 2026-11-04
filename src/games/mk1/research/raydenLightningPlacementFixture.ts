/**
 * MK1 Rayden lightning persistent visual placement fixture — Pass 1E.3O.4.
 *
 * Bounded purpose:
 *  - qualify the normal Rayden projectile route through the generic THROW_LIGHTNING path;
 *  - resolve its INIT_MULTI setup descriptor and the HANDBO travel animation descriptors;
 *  - prove the travel animation reaches a four-frame loop (HANDBO14..17);
 *  - apply a conspicuous +24 descriptor-local Y edit to the setup + all qualified travel frames;
 *  - emit an exactly diffed/reversible runtime fixture.
 *
 * This does not alter projectile world coordinates, velocity, collision, damage, or move logic.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1MultiPartFrameLosslessIrReport } from './multiPartFrameLosslessIr';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const RAYDEN_ID = 2;
const Y_DELTA = 24;
const SETUP_TABLE = 0x0000F305;
const TRAVEL_TABLE = 0x0000F30E;
const EXPECTED_SETUP_INDEX = 60;
const EXPECTED_TRAVEL_INDEX = 34;
const SETUP_LIST = 0x0001951E;
const TRAVEL_STREAM = 0x00019444;
const CONTINUATION_STREAM = 0x00019458;
const LOOP_TARGET = 0x00019468;
const SETUP_DESCRIPTOR = 'HANDBO22';
const INITIAL_NAMES = ['HANDBO4','HANDBO5','HANDBO8','HANDBO9'] as const;
const CONTINUATION_NAMES = ['HANDBO10','HANDBO11','HANDBO12','HANDBO13','HANDBO14','HANDBO15','HANDBO16','HANDBO17'] as const;
const EDIT_NAMES = [SETUP_DESCRIPTOR, ...INITIAL_NAMES, ...CONTINUATION_NAMES] as const;
const EXPECTED_OFFSETS: Record<string,number> = {
  HANDBO4:0x19B60,HANDBO5:0x19B6C,HANDBO8:0x19B78,HANDBO9:0x19B84,
  HANDBO10:0x19B90,HANDBO11:0x19B9C,HANDBO12:0x19BA8,HANDBO13:0x19BB4,
  HANDBO14:0x19BC0,HANDBO15:0x19BCC,HANDBO16:0x19BD8,HANDBO17:0x19BE4,HANDBO22:0x19C20,
};

function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return b[o]|b[o+1]<<8;}
function i16(b:Uint8Array,o:number){const v=u16(b,o);return v&0x8000?v-0x10000:v;}
function u32(b:Uint8Array,o:number){return (b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0;}
function i32(b:Uint8Array,o:number){return u32(b,o)|0;}
function rel32(b:Uint8Array,o:number){return o+5+i32(b,o+1);}
function wrI16(b:Uint8Array,o:number,v:number){const n=v&0xffff;b[o]=n&255;b[o+1]=(n>>>8)&255;}
function sym(symbols:readonly WatcomGlobalSymbol[],name:string,segment:number,kind:'code'|'data'){
  const m=symbols.filter(s=>s.valid&&s.name===name&&s.segment===segment&&(kind==='code'?s.kindBits.isCode:s.kindBits.isData));
  if(m.length!==1)throw new Error(`1E.3O.4 requires exactly one ${kind} symbol ${name}; found ${m.length}`);return m[0];
}
function diff(a:Uint8Array,b:Uint8Array){const out:Array<{physicalOffset:number;physicalOffsetHex:string;before:number;after:number}>=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}

export interface RaydenLightningDescriptor {
  symbol:string; watcomOffset:number; watcomOffsetHex:string; physicalStart:number; physicalStartHex:string;
  width:number;height:number;x:number;y:number;editedY:number;packedReference:number;fileId:number;graOffset:number;
}
export interface MK1RaydenLightningPlacementReport {
  format:'mk1_rayden_lightning_placement_fixture_v1'; timestamp:string;operationId:string;
  provenance:MK1MultiPartFrameLosslessIrReport['provenance']; fixture:MK1MultiPartFrameLosslessIrReport['fixture'];
  prerequisite:{pass:'1E.3O.2';operationId:string;verdict:'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED';validationPassed:true};
  coordinateModel:MK1MultiPartFrameLosslessIrReport['coordinateModel'];
  route:{raydenCharacterId:2;throwLightning:{watcomOffset:number;physicalStart:number};makeProjectileObj:{watcomOffset:number;physicalStart:number};getCharAni:{watcomOffset:number;physicalStart:number};initMulti:{watcomOffset:number;physicalStart:number};raidenAnitab:{watcomOffset:number;physicalStart:number};setupIndexTable:number;setupIndex:number;travelIndexTable:number;travelIndex:number;setupList:number;travelStream:number;continuationStream:number;loopTarget:number;loopDescriptors:string[];classification:'VERIFIED_RAYDEN_PROJECTILE_DESCRIPTOR_ROUTE'};
  palette:{symbol:'MORPH_P';watcomOffset:number;declaredLength:number;colorWords15:number[];linkedFromSetupDescriptorPlus0C:boolean};
  descriptors:RaydenLightningDescriptor[];
  edit:{field:'y';delta:number;semanticScope:string;descriptorCount:number;worldPositionUntouched:true;velocityUntouched:true;collisionUntouched:true};
  evidence:{originalSha256:string;editedSha256:string;reversedSha256:string;changedByteCount:number;changedBytes:ReturnType<typeof diff>;reverseRestoresOriginal:boolean;unexpectedByteChanges:number};
  decision:{persistentLoopQualified:boolean;descriptorLocalPlacementEditEstablished:boolean;runtimeTestPending:true;verdict:'RAYDEN_LIGHTNING_PLACEMENT_FIXTURE_STATICALLY_VERIFIED';narrative:string};
  status:'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean}>};
}
export interface MK1RaydenLightningPlacementResult{originalExe:Uint8Array;editedExe:Uint8Array;report:MK1RaydenLightningPlacementReport;}

export async function executeRaydenLightningPlacementFixture(source:DirectorySource,baseline:MK1MultiPartFrameLosslessIrReport):Promise<MK1RaydenLightningPlacementResult>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.4 requires an authentic user-loaded MK1 directory');
  if(baseline.status!=='SUCCESS'||baseline.decision.verdict!=='MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED')throw new Error('1E.3O.4 requires verified 1E.3O.2');
  if(baseline.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.4 is bound to the canonical MK1.EXE fixture');
  const entries=await source.listRecursive();const e=entries.find(x=>x.path===baseline.fixture.exePath);if(!e)throw new Error('MK1.EXE missing');
  const original=await source.readSlice(e.path,0,e.size);const oh=await sha256Bytes(original);if(oh!==CANONICAL_SHA)throw new Error('MK1.EXE is not canonical');
  const inv=await enumerateMK1WatcomPermanentClasses(source);if(inv.status!=='SUCCESS'||!inv.result.overallValid)throw new Error('Watcom symbol inventory failed');
  const ss=inv.result.globalSymbols.symbols, cb=baseline.coordinateModel.codeImageBase, db=baseline.coordinateModel.staticDataBase;
  const throwS=sym(ss,'THROW_LIGHTNING',1,'code'), makeS=sym(ss,'MAKE_PROJECTILE_OBJ',1,'code'), getAni=sym(ss,'GET_CHAR_ANI',1,'code'), initS=sym(ss,'INIT_MULTI',1,'code'), tabS=sym(ss,'RAIDEN_ANITAB',2,'data'), palS=sym(ss,'MORPH_P',2,'data');
  if(throwS.addressOffset!==0x1B515||makeS.addressOffset!==0x1B85D||tabS.addressOffset!==0x18498)throw new Error('Qualified Rayden projectile anchor moved');
  const throwP=cb+throwS.addressOffset;
  // The generic throw route reads animation indices from two character-indexed byte tables.
  if(u32(original,throwP+0x95)!==SETUP_TABLE||rel32(original,throwP+0x9E)!==cb+makeS.addressOffset)throw new Error('Projectile setup path no longer matches MAKE_PROJECTILE_OBJ');
  if(u32(original,throwP+0xBC)!==TRAVEL_TABLE)throw new Error('Projectile travel animation table anchor moved');
  if(original[db+SETUP_TABLE+RAYDEN_ID]!==EXPECTED_SETUP_INDEX||original[db+TRAVEL_TABLE+RAYDEN_ID]!==EXPECTED_TRAVEL_INDEX)throw new Error('Rayden projectile animation indices changed');
  if(u32(original,db+tabS.addressOffset+EXPECTED_SETUP_INDEX*4)!==SETUP_LIST||u32(original,db+tabS.addressOffset+EXPECTED_TRAVEL_INDEX*4)!==TRAVEL_STREAM)throw new Error('RAIDEN_ANITAB projectile bindings changed');
  if(u32(original,db+SETUP_LIST)!==EXPECTED_OFFSETS.HANDBO22||u32(original,db+SETUP_LIST+4)!==0)throw new Error('Rayden projectile setup list changed');
  // First phase: four records then 0. Continuation: eight records then STREAM_JUMP to the last four.
  const firstRecords=[0x1949E,0x194A6,0x194AE,0x194B6];
  for(let i=0;i<4;i++)if(u32(original,db+TRAVEL_STREAM+i*4)!==firstRecords[i])throw new Error('Rayden projectile initial stream changed');
  if(u32(original,db+TRAVEL_STREAM+16)!==0)throw new Error('Rayden projectile initial terminator changed');
  const contRecords=[0x194BE,0x194C6,0x194CE,0x194D6,0x194DE,0x194E6,0x194EE,0x194F6];
  for(let i=0;i<8;i++)if(u32(original,db+CONTINUATION_STREAM+i*4)!==contRecords[i])throw new Error('Rayden projectile continuation stream changed');
  if(u32(original,db+CONTINUATION_STREAM+32)!==1||u32(original,db+CONTINUATION_STREAM+36)!==LOOP_TARGET)throw new Error('Rayden projectile persistent loop changed');
  const frameNames=[...INITIAL_NAMES,...CONTINUATION_NAMES];
  for(let i=0;i<firstRecords.length;i++){if(u32(original,db+firstRecords[i])!==EXPECTED_OFFSETS[frameNames[i]]||u32(original,db+firstRecords[i]+4)!==0)throw new Error('Initial HANDBO frame record changed');}
  for(let i=0;i<contRecords.length;i++){if(u32(original,db+contRecords[i])!==EXPECTED_OFFSETS[frameNames[i+4]]||u32(original,db+contRecords[i]+4)!==0)throw new Error('Continuation HANDBO frame record changed');}
  const descriptors:RaydenLightningDescriptor[]=[];
  for(const name of EDIT_NAMES){const s=sym(ss,name,2,'data');if(s.addressOffset!==EXPECTED_OFFSETS[name])throw new Error(`${name} offset changed`);const p=db+s.addressOffset,w=u16(original,p),h=u16(original,p+2),x=i16(original,p+4),y=i16(original,p+6),packed=u32(original,p+8);if((packed>>>24)!==36)throw new Error(`${name} no longer points to RAIDEN.GRA file ID 36`);descriptors.push({symbol:name,watcomOffset:s.addressOffset,watcomOffsetHex:hx(s.addressOffset),physicalStart:p,physicalStartHex:hx(p),width:w,height:h,x,y,editedY:y+Y_DELTA,packedReference:packed,fileId:packed>>>24,graOffset:packed&0xffffff});}
  const setup=descriptors[0];if(u32(original,setup.physicalStart+12)!==palS.addressOffset)throw new Error('HANDBO22 palette link no longer resolves to MORPH_P');
  const plen=u16(original,db+palS.addressOffset);if(plen!==7)throw new Error('MORPH_P length changed');const colors=Array.from({length:plen},(_,i)=>u16(original,db+palS.addressOffset+2+i*2));
  const edited=original.slice();for(const d of descriptors)wrI16(edited,d.physicalStart+6,d.editedY);
  const changes=diff(original,edited),eh=await sha256Bytes(edited);const reversed=edited.slice();for(const c of changes)reversed[c.physicalOffset]=c.before;const rh=await sha256Bytes(reversed);
  const expectedFieldBytes=new Set<number>();for(const d of descriptors){expectedFieldBytes.add(d.physicalStart+6);expectedFieldBytes.add(d.physicalStart+7);}const unexpected=changes.filter(c=>!expectedFieldBytes.has(c.physicalOffset));if(unexpected.length||rh!==oh)throw new Error('Rayden lightning controlled edit failed exact diff/reversal checks');
  const timestamp=new Date().toISOString(),operationId=createOperationId('rayden-lightning-placement');
  const checks=[['CANONICAL_PROVENANCE',oh===CANONICAL_SHA],['SYMBOL_ROUTE',true],['RAYDEN_INDEX_BINDINGS',true],['SETUP_DESCRIPTOR_ROUTE',true],['TRAVEL_STREAM_ROUTE',true],['PERSISTENT_FOUR_FRAME_LOOP',true],['MORPH_P_LINK',true],['DESCRIPTOR_LOCAL_Y_ONLY',unexpected.length===0],['REVERSAL',rh===oh]].map(([checkId,passed])=>({checkId:String(checkId),passed:Boolean(passed)}));
  const report:MK1RaydenLightningPlacementReport={format:'mk1_rayden_lightning_placement_fixture_v1',timestamp,operationId,provenance:{...baseline.provenance,timestamp,operationId},fixture:baseline.fixture,prerequisite:{pass:'1E.3O.2',operationId:baseline.operationId,verdict:'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED',validationPassed:true},coordinateModel:baseline.coordinateModel,route:{raydenCharacterId:2,throwLightning:{watcomOffset:throwS.addressOffset,physicalStart:cb+throwS.addressOffset},makeProjectileObj:{watcomOffset:makeS.addressOffset,physicalStart:cb+makeS.addressOffset},getCharAni:{watcomOffset:getAni.addressOffset,physicalStart:cb+getAni.addressOffset},initMulti:{watcomOffset:initS.addressOffset,physicalStart:cb+initS.addressOffset},raidenAnitab:{watcomOffset:tabS.addressOffset,physicalStart:db+tabS.addressOffset},setupIndexTable:SETUP_TABLE,setupIndex:EXPECTED_SETUP_INDEX,travelIndexTable:TRAVEL_TABLE,travelIndex:EXPECTED_TRAVEL_INDEX,setupList:SETUP_LIST,travelStream:TRAVEL_STREAM,continuationStream:CONTINUATION_STREAM,loopTarget:LOOP_TARGET,loopDescriptors:['HANDBO14','HANDBO15','HANDBO16','HANDBO17'],classification:'VERIFIED_RAYDEN_PROJECTILE_DESCRIPTOR_ROUTE'},palette:{symbol:'MORPH_P',watcomOffset:palS.addressOffset,declaredLength:plen,colorWords15:colors,linkedFromSetupDescriptorPlus0C:true},descriptors,edit:{field:'y',delta:Y_DELTA,semanticScope:'Rayden normal lightning projectile setup + all qualified HANDBO travel frames',descriptorCount:descriptors.length,worldPositionUntouched:true,velocityUntouched:true,collisionUntouched:true},evidence:{originalSha256:oh,editedSha256:eh,reversedSha256:rh,changedByteCount:changes.length,changedBytes:changes,reverseRestoresOriginal:rh===oh,unexpectedByteChanges:unexpected.length},decision:{persistentLoopQualified:true,descriptorLocalPlacementEditEstablished:true,runtimeTestPending:true,verdict:'RAYDEN_LIGHTNING_PLACEMENT_FIXTURE_STATICALLY_VERIFIED',narrative:'The normal Rayden projectile reaches the generic MAKE_PROJECTILE_OBJ route, selects setup animation 60 and travel animation 34 through character-indexed tables, resolves RAIDEN_ANITAB[60] to the HANDBO22 INIT_MULTI setup list, and resolves RAIDEN_ANITAB[34] to HANDBO travel frames. After four initial frames and eight continuation frames, animation command 1 redirects to the HANDBO14..17 four-frame loop. The controlled fixture changes only descriptor-local Y fields (+24) for HANDBO22 plus all twelve qualified travel descriptors. Projectile world position, velocity, collision and move code are untouched. Runtime visual placement remains pending.'},status:'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',validation:{allChecksPassed:checks.every(x=>x.passed),checks}};
  if(!report.validation.allChecksPassed)throw new Error('1E.3O.4 validation failed');return{originalExe:original,editedExe:edited,report};
}

export async function createMK1RaydenLightningPlacementExport(result:MK1RaydenLightningPlacementResult){return result.report;}
export async function buildRaydenLightningRuntimeBundle(result:MK1RaydenLightningPlacementResult):Promise<Uint8Array>{
  const artifact=await createMK1RaydenLightningPlacementExport(result);
  const readme=[
    'MK1 DOS — Pass 1E.3O.4 Rayden lightning placement runtime test','',
    `Original SHA-256: ${artifact.evidence.originalSha256}`,
    `Edited SHA-256:   ${artifact.evidence.editedSha256}`,'',
    'Use a SEPARATE copy of your MK1 installation and replace only MK1.EXE with the bundled file.',
    'Play as Rayden and repeatedly perform his normal lightning projectile move.',
    'Expected observation: the lightning visual should travel roughly 24 descriptor pixels lower than normal while its gameplay path/collision otherwise behaves normally.',
    'The edit touches only local Y fields in HANDBO22 and the 12 qualified HANDBO travel descriptors. No world-position, velocity, collision, damage or input code is edited.','',
    'Return a screenshot/video observation and the JSON if convenient.'
  ].join('\r\n');
  return buildStoredZip([
    {name:'MK1.EXE',bytes:result.editedExe},
    {name:'mk1_rayden_lightning_placement_fixture.json',bytes:new TextEncoder().encode(JSON.stringify(artifact,null,2))},
    {name:'READ_ME_FIRST.txt',bytes:new TextEncoder().encode(readme)},
  ]);
}
