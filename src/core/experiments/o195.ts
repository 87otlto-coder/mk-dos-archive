/** O195 — independently inspect MK2 source-qualified cross-stage packed-floor command
 * shape and illustrate guarded VGA row visibility. Read-only, never gameplay timing.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import {hash, utf8} from '../assets/model';
import {readMK2StageDynamicStreamsO130} from '../../games/mk2/research/stageDynamicStreamsO130';
import {readMK2StageRowGeometryO131, illustrateMK2StageRowGeometryO131} from '../../games/mk2/research/stagePackedFloorGeometryO131';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {download} from '../assets/export';

const OBJECT2_FILE_BASE=0xA0C54;
const STAGES = ['TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'] as const;
export type O195StageName = typeof STAGES[number];
export type O195Token = {ordinal:number; kind:'positive-pair'|'packed-draw'|'other-negative'|'terminator';
  object2Offset:number; exePhysicalOffset:number; rawSignedToken:number; rawWordHex:string; extraDwords:number[]; physicalByteLength:number};
export type O195Row = {stage:O195StageName; stageIndex:number; streamObject2:number;
  sourcePointer:number; rawDestinationY:number; requestedRows:number; sourceResourceSuffix:number;
  sourceResourceID:number; pairCount:number; originalPackedCommandPhysical:number;
  displayStartY:number|null; visibleRows:number; clippedRows:number; rowSourceCorrection:number[];
  controlTokens:O195Token[]; signatureGroup:'portal-battle-arena'|'same-source-pointer'|'distinct-pointer';
  sourceGRAHash:string|null; sourceGRAPath:string|null; resourceExists:boolean;};
export type O195Report = {format:'mkdos_o195_cross_stage_floor_v1'; game:'mk2'; status:'experimental';
  startedAt:string; completedAt:string; sourceEXE:{path:string;bytes:number;sha256:string};
  sourceGraphics:{path:string;bytes:number;sha256:string}[]; parameters:{verticalScrollFixed:number;cameraWord:number;
    displayHeight:200; zeroScrollIsIllustration:boolean;}; rows:O195Row[];
  observations:string[]; refusals:string[]; limitations:string[];
  method:{stream:'O130';geometry:'O131';rawExeObject2Base:number;pointerMeaning:string;};};
function need(value:boolean, reason:string):asserts value {if(!value)throw new Error(`O195 cross-stage qualification: ${reason}`);}
function u32(dv:DataView,n:number):number{return dv.getUint32(n,true);}
function i32(dv:DataView,n:number):number{return dv.getInt32(n,true);}
function maybeFile(list:SourceFileEntry[], name:string):SourceFileEntry|null{
  const candidates=list.filter(x=>x.name.toUpperCase()===name);
  need(candidates.length<=1,`ambiguous resource ${name}`);
  return candidates[0]??null;
}
async function readFile(source:DirectorySource,file:SourceFileEntry):Promise<Uint8Array>{
 const raw=await source.readSlice(file.path,0,file.size);
 need(raw.byteLength===file.size,`short source read ${file.path}`);
 return raw;
}
/** Mirrors O130 grammar while independently preserving the entire original token stream.
 * This scan does not substitute a Portal-specific frame descriptor for any target.
 */
export function captureO195StreamTokens(exe:Uint8Array,start:number):O195Token[]{
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const tokens:O195Token[]=[];
 let cursor=start;
 for(let ordinal=0;ordinal<128;ordinal++){
  const p=OBJECT2_FILE_BASE+cursor;
  need(p>=0&&p+4<=exe.length,'token outside EXE');
  const t=i32(dv,p);
  const extra=t===-1?3:t>0?1:0;
  const bytes=(1+extra)*4;
  need(p+bytes<=exe.length,'truncated control token');
  const extraDwords=Array.from({length:extra},(_,i)=>u32(dv,p+4+i*4));
  const rawWordHex=Array.from(exe.subarray(p,p+bytes),v=>v.toString(16).padStart(2,'0')).join('');
  need(t>=0||t===-1||t===-2,'unexpected opcode');
  if(t>0)need(extraDwords[0]>0,'invalid positive pointer');
  tokens.push({ordinal,kind:t===0?'terminator':t===-1?'packed-draw':t===-2?'other-negative':'positive-pair',
    object2Offset:cursor,exePhysicalOffset:p,rawSignedToken:t,rawWordHex,extraDwords,physicalByteLength:bytes});
  cursor+=bytes;
  if(t===0)return tokens;
 }
 throw new Error('Control-token stream has no zero terminator within 128 records');
}

export async function runO195CrossStageFloor(source:DirectorySource,verticalScrollFixed=0,cameraWord=288):Promise<O195Report>{
 need(Number.isInteger(verticalScrollFixed)&&verticalScrollFixed>=-2147483648&&verticalScrollFixed<=2147483647,'signed scroll integer');
 need(Number.isInteger(cameraWord)&&cameraWord>=0&&cameraWord<=65535,'camera word bounds');
 const startedAt=new Date().toISOString();
 const files=await source.listRecursive();
 const exeFile=maybeFile(files,'MK2.EXE');need(!!exeFile,'original MK2.EXE required');
 const exe=await readFile(source,exeFile);
 // O130 original EXE size, opcode and SHA guards; O131 validates the actual row consumer.
 const stream=await readMK2StageDynamicStreamsO130(exe);
 const geometry=readMK2StageRowGeometryO131(exe,stream);
 const result:O195Row[]=[];
 const graphics:O195Report['sourceGraphics']=[];
 const refusals:string[]=[];
 for(const stageName of STAGES){
  const geo=geometry.find(g=>g.resourceName===stageName);
  need(!!geo,`missing O131 source evidence ${stageName}`);
  const stage=stream.stages[geo.stageIndex];
  const command=stage.drawCommands[0];
  const tokens=captureO195StreamTokens(exe,stage.streamObject2);
  const packed=tokens.filter(t=>t.kind==='packed-draw');
  need(packed.length===1&&packed[0].object2Offset===geo.commandObject2,'source command mismatch');
  need(tokens.filter(t=>t.kind==='positive-pair').length===stage.pairCount,'pointer pair mismatch');
  need(packed[0].extraDwords[0]===command.sourcePointer&&packed[0].extraDwords[1]===geo.rawDestinationY&&packed[0].extraDwords[2]===geo.requestedRows,'operand identity mismatch');
  const illustrated=illustrateMK2StageRowGeometryO131(geo.rawDestinationY,geo.requestedRows,verticalScrollFixed,cameraWord);
  const file=maybeFile(files,stageName);
  let sourceHash:string|null=null;
  if(file){const data=await readFile(source,file);sourceHash=await hash(data);graphics.push({path:file.path,bytes:file.size,sha256:sourceHash});}
  else refusals.push(`${stageName} absent: recorded original EXE control geometry only; no stage image or graphic decode attempted.`);
  const signatureGroup=command.sourcePointer===0x84312?'distinct-pointer':
    command.rawParameter2===164&&command.rawParameter3===40?'portal-battle-arena':'same-source-pointer';
  result.push({stage:stageName,stageIndex:stage.index,streamObject2:stage.streamObject2,
    sourcePointer:command.sourcePointer,rawDestinationY:command.rawParameter2,requestedRows:command.rawParameter3,
    sourceResourceSuffix:geo.packedSuffixStart,sourceResourceID:stage.resourceID,
    pairCount:stage.pairCount,originalPackedCommandPhysical:packed[0].exePhysicalOffset,
    displayStartY:illustrated.startY,visibleRows:illustrated.visibleRows,
    clippedRows:geo.requestedRows-illustrated.visibleRows,rowSourceCorrection:illustrated.perRowSourceCorrection,
    controlTokens:tokens,signatureGroup,sourceGRAHash:sourceHash,
    sourceGRAPath:file?.path??null,resourceExists:!!file});
 }
 const exact=result.filter(r=>r.signatureGroup==='portal-battle-arena');
 need(exact.length===3&&['PORTAL.GRA','BATTLE.GRA','ARENA.GRA'].every(s=>exact.some(r=>r.stage===s)),'source-exact operand group');
 need(result.find(r=>r.stage==='FOREST.GRA')?.rawDestinationY===172,'Forest source geometry');
 const observations=[
  'Portal, Battle and Arena share the full original (source pointer, raw Y, requested rows) signature; common operands do NOT establish identical artwork.',
  'Forest shares the source-pointer operand 0x8432A, but its command uses Y=172, rows=32 rather than Portal Y=164, rows=40.',
  'Seven original stage-control streams carry one -1 packed-draw command; not every MK2 stage does.',
  `At this chosen hypothetical scroll/camera input, visible rows are ${result.map(r=>`${r.stage.replace('.GRA','')}:${r.visibleRows}`).join(', ')}.`
 ];
 return {format:'mkdos_o195_cross_stage_floor_v1',game:'mk2',status:'experimental',startedAt,
  completedAt:new Date().toISOString(),sourceEXE:{path:exeFile.path,bytes:exeFile.size,sha256:await hash(exe)},
  sourceGraphics:graphics,parameters:{verticalScrollFixed,cameraWord,displayHeight:200,zeroScrollIsIllustration:verticalScrollFixed===0},
  rows:result,observations,refusals,
  limitations:['Illustrated values are calculated from user-selected hypothetical runtime state; no live VGA/camera/scroll observations were captured.',
    'Stage floor source pointers name runtime-managed state, NOT equal GRA pixel file offsets or equal bitmap identities.',
    'Source stream tokens are authenticated; activation, foreground occlusion, palette selection and final draw order are not determined.',
    'Forest native floor pixels, palette and scene animation are not reconstructed by this test.',
    'This experiment reads original game files and does not write, patch or recompile them.'],
  method:{stream:'O130',geometry:'O131',rawExeObject2Base:OBJECT2_FILE_BASE,
    pointerMeaning:'Raw operand read by the original renderer, pointing at runtime-managed state; not a GRA pixel offset.'}};
}

export function o195FloorGeometrySvg(report:O195Report):Uint8Array {
 const W=1100, rowH=58, top=88, graphX=405, graphW=420, pixelScale=graphW/200;
 const rows=report.rows.map((r,i)=>{
  const y=top+i*rowH;
  const start=r.displayStartY===null?200:r.displayStartY;
  const visible=Math.max(0,r.visibleRows);
  const overshoot=r.requestedRows-visible;
  const color=r.signatureGroup==='portal-battle-arena'?'#78a6ff':r.signatureGroup==='distinct-pointer'?'#ffb36b':'#69cbaa';
  const portion=(start:number,n:number,col:string)=>n>0?`<rect x="${(graphX+start*pixelScale).toFixed(2)}" y="${y-10}" width="${(n*pixelScale).toFixed(2)}" height="20" rx="2" fill="${col}"/>`:'';
  const clippedWidth=Math.min(overshoot,50);
  return `<text x="20" y="${y+4}" font-family="monospace" font-size="15" fill="#f5f5f5">${r.stage.padEnd(11)} Y=${String(r.rawDestinationY).padStart(3)} rows=${String(r.requestedRows).padStart(2)} visible=${String(visible).padStart(2)}</text>
   ${portion(start,visible,color)}${overshoot>0?`<rect x="${graphX+graphW}" y="${y-10}" width="${Math.max(2,clippedWidth*pixelScale).toFixed(2)}" height="20" fill="#ff687d"/>`:''}
   <text x="${graphX+graphW+114}" y="${y+4}" font-size="12" fill="#b2b8c5">0x${r.sourcePointer.toString(16)}</text>`;
 }).join('\n');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${top+report.rows.length*rowH+85}" viewBox="0 0 ${W} ${top+report.rows.length*rowH+85}">
 <rect width="100%" height="100%" fill="#0e1420"/>
 <text x="20" y="35" font-family="monospace" font-size="22" fill="#fff">MK2 | Source-backed packed-floor comparison</text>
 <text x="20" y="59" font-family="monospace" font-size="13" fill="#adbad0">Hypothetical scroll16.16=${report.parameters.verticalScrollFixed}, cameraWord=${report.parameters.cameraWord}; NOT gameplay screen capture</text>
 <line x1="${graphX}" y1="70" x2="${graphX}" y2="${top+report.rows.length*rowH}" stroke="#536078"/>
 <line x1="${graphX+graphW}" y1="70" x2="${graphX+graphW}" y2="${top+report.rows.length*rowH}" stroke="#ff687d" stroke-dasharray="4 3"/>
 <text x="${graphX}" y="75" font-size="12" fill="#aeb6c4">row 0</text>
 <text x="${graphX+graphW-54}" y="75" font-size="12" fill="#ff8c9b">row 200</text>
 ${rows}
 <text x="20" y="${top+report.rows.length*rowH+23}" font-size="13" fill="#aeb6c4">Bars: calculated visible destination rows. Red: requested rows beyond 200-row viewport.</text>
 <text x="20" y="${top+report.rows.length*rowH+45}" font-size="13" fill="#ffc37c">No original floor bitmap or actual runtime display is represented by this diagram.</text>
 </svg>`;
 return utf8.encode(svg);
}
const json=(x:unknown)=>utf8.encode(JSON.stringify(x,null,2));
export function buildO195ForensicZip(report:O195Report):Uint8Array {
 const text=`# O195 packed-floor cross-stage hypothesis\n\nThis is an original-executable structural comparison and a hypothetical row-visibility illustration, not a decoded Forest scene.\n\n${report.observations.map(x=>`- ${x}`).join('\n')}\n\n## Exclusions\n\n${report.limitations.map(x=>`- ${x}`).join('\n')}\n`;
 return buildStoredZip([
  {name:'SUMMARY.md',bytes:utf8.encode(text)},
  {name:'MANIFEST.json',bytes:json({format:report.format,mode:'forensic',sourceGameFilesBundled:false,experiment:'MK2 O195 cross-stage packed-floor geometry',sourceSHA256:report.sourceEXE.sha256})},
  {name:'EXPERIMENT.json',bytes:json({startedAt:report.startedAt,completedAt:report.completedAt,parameters:report.parameters,method:report.method,status:'experimental'})},
  {name:'evidence/source_hashes.json',bytes:json([report.sourceEXE,...report.sourceGraphics])},
  {name:'evidence/full_control_tokens.json',bytes:json(report.rows.map(r=>({stage:r.stage,streamObject2:r.streamObject2,tokens:r.controlTokens})))},
  {name:'evidence/operand_provenance.json',bytes:json(report.rows.map(r=>({stage:r.stage,commandPhysical:r.originalPackedCommandPhysical,streamObject2:r.streamObject2,pointer:r.sourcePointer,destinationY:r.rawDestinationY,rows:r.requestedRows,resourceID:r.sourceResourceID,packedSuffixStart:r.sourceResourceSuffix})))},
  {name:'results/row_geometry.json',bytes:json(report.rows)},
  {name:'results/geometry_comparison.svg',bytes:o195FloorGeometrySvg(report)},
  {name:'diagnostics/refused_operations.json',bytes:json(report.refusals)},
  {name:'diagnostics/warnings.json',bytes:json(report.limitations)},
  {name:'diagnostics/results.json',bytes:json({observations:report.observations,failures:[],runtimeObservations:[]})},
  {name:'reproduce/parameters.json',bytes:json({requiredExeSha256:report.sourceEXE.sha256,graphicsWitnesses:report.sourceGraphics,verticalScrollFixed:report.parameters.verticalScrollFixed,cameraWord:report.parameters.cameraWord,sourceMethods:['readMK2StageDynamicStreamsO130','readMK2StageRowGeometryO131','captureO195StreamTokens']})},
  {name:'reproduce/README.md',bytes:utf8.encode('Use MK DOS Archive O195. Select original MK2 installation; compare source SHA-256 witnesses; open Laboratory > Compile & hypotheses > O195 cross-stage geometry; set scroll/camera to reproduce/parameters.json, run and export. No original game source bytes are included. Do not infer runtime FPS, palette, stage bitmap identity or screen placement from this schematic.')}]);
}
export function exportO195ForensicZip(report:O195Report):void{
 download(buildO195ForensicZip(report),'MKDOS_O195_Cross_Stage_Floor_Forensic_Evidence.zip','application/zip');
}
