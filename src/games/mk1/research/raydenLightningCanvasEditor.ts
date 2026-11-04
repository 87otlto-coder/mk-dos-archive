/**
 * MK1 bounded interactive placement editor model — Pass 1E.3O.5.
 *
 * Purpose:
 *  - promote the runtime-verified Rayden lightning descriptor-local placement mechanism
 *    into a user-editable semantic canvas model;
 *  - decode the 13 already-qualified projectile descriptors for deterministic preview;
 *  - compile user-authored in-place signed-int16 X/Y edits back into MK1.EXE;
 *  - fail closed outside the qualified descriptor set and preserve every other byte.
 *
 * This is intentionally NOT a generic animation compiler. It does not relocate records,
 * resize descriptors, change GRA pixels, add/remove parts, or edit gameplay/world state.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { resolveMK1GraTarget } from './spriteDescriptorProbe';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1RaydenLightningPlacementReport } from './raydenLightningPlacementFixture';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const EXPECTED_RESOURCE_ID = 36;
const EXPECTED_RESOURCE = 'GRAPHICS/RAIDEN.GRA';
const SETUP = 'HANDBO22';
const INITIAL = ['HANDBO4','HANDBO5','HANDBO8','HANDBO9'] as const;
const CONTINUATION = ['HANDBO10','HANDBO11','HANDBO12','HANDBO13','HANDBO14','HANDBO15','HANDBO16','HANDBO17'] as const;
const LOOP = ['HANDBO14','HANDBO15','HANDBO16','HANDBO17'] as const;
const QUALIFIED = [SETUP,...INITIAL,...CONTINUATION] as const;

type PlacementPhase = 'SETUP'|'INITIAL'|'CONTINUATION'|'PERSISTENT_LOOP';

function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){if(o<0||o+2>b.length)throw new Error(`u16 out of range at ${hx(o)}`);return b[o]|b[o+1]<<8;}
function i16(b:Uint8Array,o:number){const v=u16(b,o);return v&0x8000?v-0x10000:v;}
function u32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 out of range at ${hx(o)}`);return (b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0;}
function wrI16(b:Uint8Array,o:number,v:number){if(!Number.isInteger(v)||v<-32768||v>32767)throw new Error(`signed int16 placement out of range: ${v}`);const n=v&0xffff;b[o]=n&255;b[o+1]=(n>>>8)&255;}
function diff(a:Uint8Array,b:Uint8Array){const out:Array<{physicalOffset:number;physicalOffsetHex:string;before:number;after:number}>=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}
function rgb15(value:number){const mult=255/63;const r=Math.min(255,Math.max(0,Math.round(((((value>>9)&0x3f)|1)*mult))));const g=Math.min(255,Math.max(0,Math.round(((((value>>4)&0x3f)|1)*mult))));const bl=Math.min(255,Math.max(0,Math.round(((((value<<1)&0x3f)|1)*mult))));return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`.toUpperCase();}
function phaseFor(symbol:string):PlacementPhase{if(symbol===SETUP)return 'SETUP';if((LOOP as readonly string[]).includes(symbol))return 'PERSISTENT_LOOP';if((INITIAL as readonly string[]).includes(symbol))return 'INITIAL';return 'CONTINUATION';}
function orderFor(symbol:string){if(symbol===SETUP)return -1;const travel=[...INITIAL,...CONTINUATION] as readonly string[];return travel.indexOf(symbol);}

export interface RaydenCanvasPreviewPayload{
  symbol:string;width:number;height:number;indices:Uint8Array;opaqueMask:Uint8Array;
}
export interface RaydenCanvasDescriptorModel{
  symbol:string;phase:PlacementPhase;travelOrder:number;watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
  width:number;height:number;x:number;y:number;packedReference:number;packedReferenceHex:string;fileId:number;graOffset:number;graOffsetHex:string;
  writableFields:['x','y'];
  decode:{success:true;checksum:string;encodedBytesConsumed:number;opaquePixelCount:number;minOpaqueIndex:number|null;maxOpaqueIndex:number|null;outOfPaletteRangeCount:number};
}
export interface MK1RaydenLightningCanvasEditorReport{
  format:'mk1_rayden_lightning_canvas_editor_model_v1';timestamp:string;operationId:string;
  provenance:MK1RaydenLightningPlacementReport['provenance'];fixture:MK1RaydenLightningPlacementReport['fixture'];
  prerequisite:{pass:'1E.3O.4';operationId:string;verdict:'RAYDEN_LIGHTNING_PLACEMENT_FIXTURE_STATICALLY_VERIFIED';validationPassed:true};
  coordinateModel:MK1RaydenLightningPlacementReport['coordinateModel'];
  resource:{path:string;fileId:36;fileSize:number;fileSizeHex:string};
  palette:{symbol:'MORPH_P';watcomOffset:number;declaredLength:number;colorWords15:number[];rgbHex:string[]};
  descriptors:RaydenCanvasDescriptorModel[];
  canvas:{minX:number;minY:number;maxX:number;maxY:number;width:number;height:number;anchorX:0;anchorY:0;padding:number;recommendedScale:2};
  serializer:{inPlaceDescriptorWritesOnly:true;signedInt16XY:true;descriptorWidthHeightReadOnly:true;packedReferenceReadOnly:true;relocationSupported:false;ugraEncodingSupported:false;addRemoveDescriptorsSupported:false};
  noEditRoundTrip:{sourceSha256:string;rebuiltSha256:string;mismatchCount:number;exact:boolean};
  decision:{qualifiedDescriptorCount:13;interactiveXYAuthoringEstablished:true;previewDecodeEstablished:true;boundedWritableSerializerEstablished:true;genericAnimationCompilerEstablished:false;verdict:'RAYDEN_LIGHTNING_BOUNDED_CANVAS_EDITOR_ESTABLISHED';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean}>};
  previewPayloads?:Map<string,RaydenCanvasPreviewPayload>;
}
export interface RaydenCanvasPlacementChange{symbol:string;x:number;y:number;}
export interface MK1RaydenLightningCanvasEditRequest{changes:RaydenCanvasPlacementChange[];authoringMode:'INTERACTIVE_CANVAS'|'NUMERIC';note?:string;}
export interface MK1RaydenLightningCanvasEditReport{
  format:'mk1_rayden_lightning_canvas_edit_v1';timestamp:string;operationId:string;
  provenance:MK1RaydenLightningCanvasEditorReport['provenance'];fixture:MK1RaydenLightningCanvasEditorReport['fixture'];
  prerequisite:{pass:'1E.3O.5';operationId:string;verdict:'RAYDEN_LIGHTNING_BOUNDED_CANVAS_EDITOR_ESTABLISHED';validationPassed:true};
  request:MK1RaydenLightningCanvasEditRequest;
  changes:Array<{symbol:string;physicalStart:number;physicalStartHex:string;before:{x:number;y:number};after:{x:number;y:number};delta:{x:number;y:number};editedFields:Array<'x'|'y'>}>;
  evidence:{originalSha256:string;editedSha256:string;reversedSha256:string;changedDescriptorCount:number;changedByteCount:number;changedBytes:ReturnType<typeof diff>;unexpectedByteChanges:number;reverseRestoresOriginal:boolean};
  constraints:{worldPositionUntouched:true;velocityUntouched:true;collisionUntouched:true;dimensionsUntouched:true;packedReferencesUntouched:true;graPixelsUntouched:true;paletteUntouched:true;inPlaceOnly:true};
  status:'SUCCESS';
}
export interface MK1RaydenLightningCanvasEditResult{originalExe:Uint8Array;editedExe:Uint8Array;report:MK1RaydenLightningCanvasEditReport;}

async function readCanonicalExe(source:DirectorySource,fixturePath:string,fixtureSize:number){
  if(source.isSynthetic!==false)throw new Error('1E.3O.5 requires an authentic user-loaded MK1 directory');
  const entries=await source.listRecursive();const entry=entries.find(e=>e.path===fixturePath);if(!entry)throw new Error(`${fixturePath} missing`);if(entry.size!==fixtureSize)throw new Error('MK1.EXE size changed');
  const bytes=await source.readSlice(entry.path,0,entry.size);const hash=await sha256Bytes(bytes);if(hash!==CANONICAL_SHA)throw new Error('1E.3O.5 writes require the canonical untouched MK1.EXE');return{bytes,hash};
}

export async function executeRaydenLightningCanvasEditorModel(source:DirectorySource,qualification:MK1RaydenLightningPlacementReport):Promise<MK1RaydenLightningCanvasEditorReport>{
  if(qualification.status!=='STATIC_VALIDATION_PASSED_RUNTIME_PENDING'||!qualification.validation.allChecksPassed||qualification.decision.verdict!=='RAYDEN_LIGHTNING_PLACEMENT_FIXTURE_STATICALLY_VERIFIED')throw new Error('1E.3O.5 requires the qualified 1E.3O.4 descriptor route');
  if(qualification.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.5 prerequisite is not canonical');
  const {bytes,hash}=await readCanonicalExe(source,qualification.fixture.exePath,qualification.fixture.exeSize);
  const gra=await resolveMK1GraTarget(source,EXPECTED_RESOURCE);if(gra.fileId!==EXPECTED_RESOURCE_ID)throw new Error('RAIDEN.GRA file ID changed');
  const graBytes=await source.readSlice(gra.path,0,gra.fileSize);if(graBytes.length!==gra.fileSize)throw new Error('RAIDEN.GRA could not be read completely');
  if(qualification.descriptors.length!==13||new Set(qualification.descriptors.map(d=>d.symbol)).size!==13)throw new Error('O4 descriptor set is not the qualified 13-descriptor fixture');
  for(const name of QUALIFIED)if(!qualification.descriptors.some(d=>d.symbol===name))throw new Error(`O4 prerequisite is missing ${name}`);
  const previewPayloads=new Map<string,RaydenCanvasPreviewPayload>();const descriptors:RaydenCanvasDescriptorModel[]=[];
  for(const q of qualification.descriptors){
    const p=q.physicalStart;const w=u16(bytes,p),h=u16(bytes,p+2),x=i16(bytes,p+4),y=i16(bytes,p+6),packed=u32(bytes,p+8),fid=(packed>>>24)&255,go=packed&0xffffff;
    if(w!==q.width||h!==q.height||x!==q.x||y!==q.y||packed!==q.packedReference||fid!==36)throw new Error(`${q.symbol} no longer matches the O4 qualified descriptor`);
    const dec=decodeUgraSprite(graBytes,go,w,h);if(!dec.success||!dec.checksum)throw new Error(`${q.symbol} uGRA decode failed: ${dec.failureReason??'unknown failure'}`);
    let opaque=0,min:null|number=null,max:null|number=null,out=0;for(let i=0;i<dec.indices.length;i++){if(!dec.opaqueMask[i])continue;opaque++;const idx=dec.indices[i];if(idx<1||idx>qualification.palette.declaredLength)out++;min=min===null?idx:Math.min(min,idx);max=max===null?idx:Math.max(max,idx);}
    if(out)throw new Error(`${q.symbol} contains opaque indices outside MORPH_P`);
    descriptors.push({symbol:q.symbol,phase:phaseFor(q.symbol),travelOrder:orderFor(q.symbol),watcomOffset:q.watcomOffset,watcomOffsetHex:q.watcomOffsetHex,physicalStart:p,physicalStartHex:q.physicalStartHex,width:w,height:h,x,y,packedReference:packed,packedReferenceHex:hx(packed),fileId:fid,graOffset:go,graOffsetHex:hx(go),writableFields:['x','y'],decode:{success:true,checksum:dec.checksum,encodedBytesConsumed:dec.encodedBytesConsumed,opaquePixelCount:opaque,minOpaqueIndex:min,maxOpaqueIndex:max,outOfPaletteRangeCount:out}});
    previewPayloads.set(q.symbol,{symbol:q.symbol,width:w,height:h,indices:dec.indices,opaqueMask:dec.opaqueMask});
  }
  const rawMinX=Math.min(0,...descriptors.map(d=>d.x)),rawMinY=Math.min(0,...descriptors.map(d=>d.y)),rawMaxX=Math.max(0,...descriptors.map(d=>d.x+d.width)),rawMaxY=Math.max(0,...descriptors.map(d=>d.y+d.height));const padding=64;
  const minX=rawMinX-padding,minY=rawMinY-padding,maxX=rawMaxX+padding,maxY=rawMaxY+padding;
  const rebuilt=bytes.slice();for(const d of descriptors){wrI16(rebuilt,d.physicalStart+4,d.x);wrI16(rebuilt,d.physicalStart+6,d.y);}const mismatch=diff(bytes,rebuilt).length,rebuiltHash=await sha256Bytes(rebuilt);
  const timestamp=new Date().toISOString(),operationId=createOperationId('rayden-lightning-canvas-editor');
  const checks=[['CANONICAL_PROVENANCE',hash===CANONICAL_SHA],['O4_PREREQUISITE',true],['RAIDEN_GRA_RESOURCE',gra.fileId===36],['THIRTEEN_QUALIFIED_DESCRIPTORS',descriptors.length===13],['ALL_SPRITES_DECODE',previewPayloads.size===13],['MORPH_P_FIT',descriptors.every(d=>d.decode.outOfPaletteRangeCount===0)],['NO_EDIT_SERIALIZER',mismatch===0&&rebuiltHash===hash],['SCOPE_BOUNDARY',true]].map(([checkId,passed])=>({checkId:String(checkId),passed:Boolean(passed)}));
  const report:MK1RaydenLightningCanvasEditorReport={format:'mk1_rayden_lightning_canvas_editor_model_v1',timestamp,operationId,provenance:{...qualification.provenance,timestamp,operationId},fixture:qualification.fixture,prerequisite:{pass:'1E.3O.4',operationId:qualification.operationId,verdict:'RAYDEN_LIGHTNING_PLACEMENT_FIXTURE_STATICALLY_VERIFIED',validationPassed:true},coordinateModel:qualification.coordinateModel,resource:{path:gra.path,fileId:36,fileSize:gra.fileSize,fileSizeHex:gra.fileSizeHex},palette:{symbol:'MORPH_P',watcomOffset:qualification.palette.watcomOffset,declaredLength:qualification.palette.declaredLength,colorWords15:[...qualification.palette.colorWords15],rgbHex:qualification.palette.colorWords15.map(rgb15)},descriptors,canvas:{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY,anchorX:0,anchorY:0,padding,recommendedScale:2},serializer:{inPlaceDescriptorWritesOnly:true,signedInt16XY:true,descriptorWidthHeightReadOnly:true,packedReferenceReadOnly:true,relocationSupported:false,ugraEncodingSupported:false,addRemoveDescriptorsSupported:false},noEditRoundTrip:{sourceSha256:hash,rebuiltSha256:rebuiltHash,mismatchCount:mismatch,exact:mismatch===0&&rebuiltHash===hash},decision:{qualifiedDescriptorCount:13,interactiveXYAuthoringEstablished:true,previewDecodeEstablished:true,boundedWritableSerializerEstablished:true,genericAnimationCompilerEstablished:false,verdict:'RAYDEN_LIGHTNING_BOUNDED_CANVAS_EDITOR_ESTABLISHED',narrative:'The O4-qualified Rayden lightning placement fixture is promoted into a bounded semantic editor model. Thirteen qualified WITH_XY descriptors decode from RAIDEN.GRA with MORPH_P and expose only their signed-int16 X/Y fields as writable. A no-edit semantic rewrite of every qualified X/Y value produces zero executable differences and the canonical SHA-256. User-authored edits are compiled in place and are rejected if they target unqualified symbols or require relocation, resizing, GRA re-encoding, part insertion/removal, palette changes, or gameplay/world-state changes.'},status:'SUCCESS',validation:{allChecksPassed:checks.every(c=>c.passed),checks},previewPayloads};
  if(!report.validation.allChecksPassed)throw new Error('1E.3O.5 editor model qualification failed');return report;
}

export function createMK1RaydenLightningCanvasEditorExport(report:MK1RaydenLightningCanvasEditorReport){const{previewPayloads:_preview,...serializable}=report;return serializable;}

export async function executeRaydenLightningCanvasEdit(source:DirectorySource,model:MK1RaydenLightningCanvasEditorReport,request:MK1RaydenLightningCanvasEditRequest):Promise<MK1RaydenLightningCanvasEditResult>{
  if(model.status!=='SUCCESS'||!model.validation.allChecksPassed||model.decision.verdict!=='RAYDEN_LIGHTNING_BOUNDED_CANVAS_EDITOR_ESTABLISHED')throw new Error('Canvas edit requires a verified 1E.3O.5 model');
  if(!Array.isArray(request.changes)||request.changes.length<1)throw new Error('Canvas edit requires at least one changed descriptor');
  const duplicate=new Set<string>();for(const c of request.changes){if(duplicate.has(c.symbol))throw new Error(`Duplicate edit for ${c.symbol}`);duplicate.add(c.symbol);if(!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<-32768||c.x>32767||c.y<-32768||c.y>32767)throw new Error(`${c.symbol} X/Y must be signed int16 integers`);}
  const bySymbol=new Map(model.descriptors.map(d=>[d.symbol,d] as const));for(const c of request.changes)if(!bySymbol.has(c.symbol))throw new Error(`Unqualified descriptor edit rejected: ${c.symbol}`);
  const {bytes:original,hash:originalHash}=await readCanonicalExe(source,model.fixture.exePath,model.fixture.exeSize);const edited=original.slice();const changedDescriptors:MK1RaydenLightningCanvasEditReport['changes']=[];const expectedByteOffsets=new Set<number>();
  for(const c of request.changes){const d=bySymbol.get(c.symbol)!;const p=d.physicalStart;const bx=i16(original,p+4),by=i16(original,p+6);if(bx!==d.x||by!==d.y)throw new Error(`${d.symbol} source coordinate drifted from qualified model`);if(c.x===bx&&c.y===by)continue;const fields:Array<'x'|'y'>=[];if(c.x!==bx){wrI16(edited,p+4,c.x);expectedByteOffsets.add(p+4);expectedByteOffsets.add(p+5);fields.push('x');}if(c.y!==by){wrI16(edited,p+6,c.y);expectedByteOffsets.add(p+6);expectedByteOffsets.add(p+7);fields.push('y');}changedDescriptors.push({symbol:d.symbol,physicalStart:p,physicalStartHex:d.physicalStartHex,before:{x:bx,y:by},after:{x:c.x,y:c.y},delta:{x:c.x-bx,y:c.y-by},editedFields:fields});}
  if(!changedDescriptors.length)throw new Error('Canvas edit is a no-op; move at least one qualified descriptor');
  const changedBytes=diff(original,edited),unexpected=changedBytes.filter(c=>!expectedByteOffsets.has(c.physicalOffset));if(unexpected.length)throw new Error('Canvas serializer changed bytes outside qualified X/Y fields');
  const editedHash=await sha256Bytes(edited),reversed=edited.slice();for(const c of changedBytes)reversed[c.physicalOffset]=c.before;const reversedHash=await sha256Bytes(reversed);if(reversedHash!==originalHash)throw new Error('Canvas edit reversal did not restore the canonical executable');
  const timestamp=new Date().toISOString(),operationId=createOperationId('rayden-lightning-canvas-edit');
  const report:MK1RaydenLightningCanvasEditReport={format:'mk1_rayden_lightning_canvas_edit_v1',timestamp,operationId,provenance:{...model.provenance,timestamp,operationId},fixture:model.fixture,prerequisite:{pass:'1E.3O.5',operationId:model.operationId,verdict:'RAYDEN_LIGHTNING_BOUNDED_CANVAS_EDITOR_ESTABLISHED',validationPassed:true},request:{...request,changes:changedDescriptors.map(d=>({symbol:d.symbol,x:d.after.x,y:d.after.y}))},changes:changedDescriptors,evidence:{originalSha256:originalHash,editedSha256:editedHash,reversedSha256:reversedHash,changedDescriptorCount:changedDescriptors.length,changedByteCount:changedBytes.length,changedBytes,unexpectedByteChanges:unexpected.length,reverseRestoresOriginal:reversedHash===originalHash},constraints:{worldPositionUntouched:true,velocityUntouched:true,collisionUntouched:true,dimensionsUntouched:true,packedReferencesUntouched:true,graPixelsUntouched:true,paletteUntouched:true,inPlaceOnly:true},status:'SUCCESS'};
  return{originalExe:original,editedExe:edited,report};
}

export function createMK1RaydenLightningCanvasEditExport(result:MK1RaydenLightningCanvasEditResult){return result.report;}

export async function buildRaydenLightningCanvasEditBundle(result:MK1RaydenLightningCanvasEditResult):Promise<Uint8Array>{
  const r=result.report;const lines=['MK1 DOS — Pass 1E.3O.5 Interactive Rayden lightning canvas edit','',`Original SHA-256: ${r.evidence.originalSha256}`,`Edited SHA-256:   ${r.evidence.editedSha256}`,'',`Qualified descriptors changed: ${r.evidence.changedDescriptorCount}`,`Changed executable bytes: ${r.evidence.changedByteCount}`,'','Semantic placement edits:'];for(const c of r.changes)lines.push(`- ${c.symbol}: (${c.before.x}, ${c.before.y}) -> (${c.after.x}, ${c.after.y}) [delta ${c.delta.x}, ${c.delta.y}]`);lines.push('','Use a SEPARATE copy of the MK1 installation and replace only MK1.EXE with the bundled file.','Play as Rayden and use the normal lightning projectile. The visible sprite placement should reflect your authored descriptor X/Y edits.','Projectile world coordinates, velocity, collision, damage, sprite pixels, palette, dimensions and packed resource references are untouched.','','This bundle is a bounded in-place descriptor placement edit, not a general animation compiler.');
  return buildStoredZip([{name:'MK1.EXE',bytes:result.editedExe},{name:'mk1_rayden_lightning_canvas_edit.json',bytes:new TextEncoder().encode(JSON.stringify(r,null,2))},{name:'READ_ME_FIRST.txt',bytes:new TextEncoder().encode(lines.join('\r\n'))}]);
}
