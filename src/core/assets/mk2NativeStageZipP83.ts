/**
 * P83: opt-in import of the independently qualified P82 MK2 native-width
 * Tomb/Portal source-layer ZIP. Do NOT reconstruct, resample, or composite
 * sprite streams or assign live palettes/parallax/animation timing here.
 *
 * Original index/opacity PNG bytes are preserved EXACTLY as imported.
 * PNGs remain files rather than fabricated alpha/index planes in metadata.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {parseAnimationStoreZip} from '../../games/mk1/research/browserAnimationExportBundleValidation';

export const MK2_P83_FORMAT='mkdos_p82_mk2_uncropped_source_layer_pack_v1';
export const MK2_P83_CANONICAL_SHA:Record<string,string>={
  'MK2.EXE':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
  'TOMB.GRA':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
  'PORTAL.GRA':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
  'IMAGES.GRA':'2b26796a64c2aebfee75832696aeae9bbcf9df58a557d3ad8cf',
};
type Stage='tomb'|'portal';
type Json=Record<string,unknown>;
type LayerRow={path:string;sha256:string;bytes:number;dimensions:number[];format:string;assetId:string};
const STAGES:{
 [K in Stage]:{gra:string;floor:[number,number];sprites:number;setups:number;paletteSource:number}
}={
 tomb:{gra:'TOMB.GRA',floor:[896,48],sprites:16,setups:6,paletteSource:0x893c6},
 portal:{gra:'PORTAL.GRA',floor:[896,40],sprites:13,setups:2,paletteSource:0x891e0},
};
const utf8=new TextDecoder('utf-8',{fatal:true});
function need(ok:unknown,reason:string):asserts ok {
  if(!ok)throw new Error('P83 original MK2 stage source archive: '+reason);
}
function object(v:unknown):v is Json {return typeof v==='object'&&v!==null&&!Array.isArray(v)}
function integer(v:unknown,min=0,max=10000000):v is number {
  return typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
}
function dimensions(v:unknown):v is [number,number] {
  return Array.isArray(v)&&v.length===2&&integer(v[0],1,4096)&&integer(v[1],1,4096)&&v[0]*v[1]<=2000000;
}
function safePath(v:unknown):v is string {
  return typeof v==='string'&&v.length>0&&v.length<=240&&!v.startsWith('/')&&!v.includes('\\')&&
    v.split('/').every(p=>p.length>0&&p!=='.'&&p!=='..');
}
function json(bytes:Uint8Array,label:string):Json {
  let value:unknown;
  try {value=JSON.parse(utf8.decode(bytes));} catch{throw new Error('P83: invalid '+label+' JSON');}
  need(object(value),label+' JSON must be object');
  return value;
}
const pngSig=[137,80,78,71,13,10,26,10];
function be32(b:Uint8Array,o:number):number {
  return ((b[o]*0x1000000)+(b[o+1]<<16)+(b[o+2]<<8)+b[o+3])>>>0;
}
function pngHeader(bytes:Uint8Array):{width:number;height:number;format:'INDEX8_PNG'|'ALPHA8_PNG'|'RGBA_PNG'} {
  need(bytes.length>=57&&pngSig.every((v,i)=>bytes[i]===v),'invalid source PNG signature or truncated PNG');
  need(be32(bytes,8)===13&&utf8.decode(bytes.subarray(12,16))==='IHDR',
    'original PNG must start with IHDR');
  const width=be32(bytes,16),height=be32(bytes,20),depth=bytes[24],colorType=bytes[25];
  need(dimensions([width,height])&&depth===8&&(colorType===0||colorType===6)
    &&bytes[26]===0&&bytes[27]===0&&bytes[28]===0,
  'unrecognized PNG pixel mode, dimensions, compression or interlace');
  need(bytes[bytes.length-12]===0&&bytes[bytes.length-11]===0
    &&bytes[bytes.length-10]===0&&bytes[bytes.length-9]===0
    &&utf8.decode(bytes.subarray(bytes.length-8,bytes.length-4))==='IEND',
    'original PNG missing final IEND');
  return {width,height,format:colorType===6?'RGBA_PNG':'INDEX8_PNG'};
}
export interface P83VerifiedPackage {
  assets:Asset[];
  report:{
    format:'MK2_P83_NATIVE_SOURCE_ARCHIVE_IMPORTED';
    originalMk2AssetsPreserved:5369;
    separatelyImportedPngs:115;
    originalSourceStages:2;
    originalNativeFloors:2;
    originalNativeSprites:29;
    originalSetupLocalLayers:8;
    originalSourceFingerprintsVerified:4;
    nativeWidthsPreserved:[896,896];
    livePaletteOrCameraOrAnimationClaimed:false;
    sourceInputSignatureSha256:Record<string,string>;
    selectedP82ArchiveSha256:string;
  };
}
/** Pure archive validation; real-folder provenance is authenticated by importMK2P83StageZip. */
export async function validateMK2P83StageZip(
  bytes:Uint8Array,originalSignatures:Readonly<Record<string,string>>,signal?:AbortSignal,
):Promise<P83VerifiedPackage>{
  signal?.throwIfAborted();
  need(bytes.length>=100&&bytes.length<=128*1024*1024,'source ZIP exceeds safe size');
  const entries=parseAnimationStoreZip(bytes);
  need(entries.size===117,'expected precisely 115 PNG layers plus 2 source manifests');
  const expectedKeys=new Set(Object.keys(MK2_P83_CANONICAL_SHA));
  need(Object.keys(originalSignatures).length===4&&
    Object.keys(originalSignatures).every(x=>expectedKeys.has(x)),
    'expected exactly four original DOS source signatures');
  const man=entries.get('O132_SCENE_LAYERS.json');
  const policy=entries.get('P82_EXPORT_PROVENANCE.json');
  need(Boolean(man&&policy),'missing original O132 or P82 provenance JSON');
  const source=json(man!.bytes,'O132'),wrapper=json(policy!.bytes,'P82');
  need(source.schema==='mk2_o132_native_source_layer_pack_v1'&&
    source.status==='STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT',
    'unknown O132 source format or static-stage status');
  need(wrapper.format===MK2_P83_FORMAT,'unqualified P82 source package format');
  need(source.sourceExecutableSHA256===originalSignatures['MK2.EXE'],
    'original MK2 source executable fingerprint mismatch');
  const evidence=wrapper.originalInputSha256;
  need(object(evidence)&&Object.keys(evidence).length===4,
    'P82 input source fingerprints incomplete');
  for(const key of expectedKeys){
    need(typeof originalSignatures[key]==='string'&&
      typeof evidence[key]==='string'&&evidence[key]===originalSignatures[key],
      'source ZIP does not match authenticated current original '+key);
  }
  need(wrapper.nativeCameraOrFinalStageCompositingProven===false&&
    wrapper.originalAnimationOrParallaxTimingProven===false&&
    wrapper.allOriginalCommercialGameFilesExcludedFromExport===true,
    'fabricated renderer timing/camera or commercial source inclusion');
  const compositor=source.compositing,motion=source.motion;
  need(object(compositor)&&object(motion)&&
    compositor.finalDrawOrderRecovered===false&&
    compositor.liveCameraPositionRecovered===false&&
    compositor.interSetupLayerPositionRecovered===false&&
    motion.animationFrameOrderingRecovered===false&&
    motion.animationDurationsRecovered===false&&
    motion.parallaxMotionRulesRecovered===false,
    'invented original stage composition or frame timing');
  const stages=source.stages;
  need(Array.isArray(stages)&&stages.length===2&&Array.isArray(wrapper.stageNames)&&
    JSON.stringify(wrapper.stageNames)==='["tomb","portal"]',
    'P83 requires independently verified BOTH Tomb and Portal source stages');
  const stageObjects=new Map<Stage,Json>();
  const names=['tomb','portal'] as const;
  for(let i=0;i<2;i++){
    const stage=stages[i];
    need(object(stage)&&stage.stage===names[i],
      'source stage identity/order mismatch');
    stageObjects.set(names[i],stage);
    const config=STAGES[names[i]];
    const floor=stage.packedFloor, sprites=stage.nativeSpriteDescriptors,
      setup=stage.setupLocalLayers;
    need(object(floor)&&dimensions(floor.nativeDimensions)&&
      JSON.stringify(floor.nativeDimensions)===JSON.stringify(config.floor)&&
      floor.cameraCropApplied===false&&floor.registeredStageWorldPosition===null&&
      Array.isArray(sprites)&&sprites.length===config.sprites&&
      Array.isArray(setup)&&setup.length===config.setups,
      'original native floor or sprite/setup identity changed');
    for(const row of sprites){
      need(object(row)&&typeof row.assetId==='string'&&
        integer(row.sourcePackedOffset)&&integer(row.sourcePackedEndExclusive)&&
        row.sourcePackedEndExclusive>row.sourcePackedOffset&&dimensions(row.dimensions)&&
        row.unalteredNativeSpriteBounds===true&&
        row.originalGameAnimationMembershipKnown===false,
        'unverified source native sprite geometry/animation');
    }
    for(const row of setup){
      need(object(row)&&typeof row.assetId==='string'&&dimensions(row.dimensions)&&
        row.sourceCoordinateSystem==='SETUP_LOCAL_NOT_SCENE_WORLD'&&
        row.registeredStageWorldPosition===null&&
        row.parallaxMovementRecovered===false&&
        row.animationFramesRecovered===false,
        'unverified source mosaic/camera/animation');
    }
  }
  const fileRows=source.files;
  need(Array.isArray(fileRows)&&fileRows.length===115,
    'source native layer PNG census not 115');
  const items:LayerRow[]=[];
  for(const row of fileRows){
    need(object(row)&&safePath(row.path)&&row.path.endsWith('.png')&&
      integer(row.bytes,40,16*1024*1024)&&typeof row.sha256==='string'&&
      /^[a-f0-9]{64}$/.test(row.sha256)&&dimensions(row.dimensions)&&
      ['INDEX8_PNG','ALPHA8_PNG','RGBA_PNG'].includes(String(row.format))&&
      typeof row.assetId==='string'&&row.assetId.length>0,
      'invalid native layer file descriptor');
    items.push(row as LayerRow);
  }
  need(new Set(items.map(r=>r.path)).size===115&&
    [...entries.keys()].every(x=>x==='O132_SCENE_LAYERS.json'||
      x==='P82_EXPORT_PROVENANCE.json'||items.some(r=>r.path===x)),
    'unexpected ZIP member or duplicate stage file name');
  const assets:Asset[]=[];
  const counter:{[K in Stage]:{floor:number;sprite:number;setup:number}}={
    tomb:{floor:0,sprite:0,setup:0},
    portal:{floor:0,sprite:0,setup:0},
  };
  for(const row of items){
    signal?.throwIfAborted();
    const stage=row.path.split('/')[0];
    need(stage==='tomb'||stage==='portal','unrecognized original source stage');
    const config=STAGES[stage],stageRow=stageObjects.get(stage)!;
    const file=entries.get(row.path);
    need(Boolean(file),'missing source PNG '+row.path);
    need(file!.bytes.length===row.bytes&&await hash(file!.bytes)===row.sha256,
      'source PNG SHA256/length differs from authenticated O132 archive: '+row.path);
    const header=pngHeader(file!.bytes);
    need(header.width===row.dimensions[0]&&header.height===row.dimensions[1]&&
      (row.format===header.format||
       (row.format==='ALPHA8_PNG'&&header.format==='INDEX8_PNG')),
      'source original image IHDR size/pixel format differs: '+row.path);
    let kind:'floor'|'sprite'|'setup',originalOffset=0,originalLength=0;
    if(row.path.startsWith(stage+'/floor_')){
      kind='floor';
      const floor=stageRow.packedFloor as Json;
      need(row.assetId===stage+'_packed_floor'&&
        ['floor_rgba.png','floor_indices.png'].some(x=>row.path===stage+'/'+x)&&
        integer(floor.sourceOffset),
        'original native floor PNG path/offset unqualified');
      originalOffset=floor.sourceOffset as number;originalLength=config.floor[0]*config.floor[1];
    }else if(row.path.startsWith(stage+'/native_sprites/')){
      kind='sprite';const sprites=stageRow.nativeSpriteDescriptors as Json[];
      const owner=sprites.find(s=>row.assetId===s.assetId);
      need(Boolean(owner)&&
        ['indices','opacity','rgba'].some(x=>row.path===stage+'/native_sprites/'+row.assetId+'_'+x+'.png')&&
        JSON.stringify(owner!.dimensions)===JSON.stringify(row.dimensions),
        'original uncut sprite PNG/geometry/owner mismatch');
      originalOffset=owner!.sourcePackedOffset as number;
      originalLength=(owner!.sourcePackedEndExclusive as number)-originalOffset;
    }else if(row.path.startsWith(stage+'/setups/')){
      kind='setup';const setups=stageRow.setupLocalLayers as Json[];
      const owner=setups.find(s=>row.assetId===s.assetId);
      need(Boolean(owner)&&['indices','opacity','rgba'].some(x=>
        row.path===stage+'/setups/'+row.assetId+'_'+x+'.png')&&
        JSON.stringify(owner!.dimensions)===JSON.stringify(row.dimensions),
        'original setup-local PNG/geometry/owner mismatch');
      originalOffset=0;originalLength=0; // derived from multiple stream inputs
    }else throw new Error('P83: unexpected stage source ZIP entry '+row.path);
    counter[stage][kind]++;
    const entryBytes=file!.bytes.slice();
    assets.push({
      id:'mk2:p83:'+row.path,
      name:row.path.split('/').at(-1)??row.path,
      group:'P83 '+(stage==='tomb'?'Kombat Tomb':'The Portal')+
        ' · '+(kind==='floor'?'native-width floor':kind==='sprite'?'uncropped source sprites':'setup-local layers'),
      kind:'image',format:'Original stage source '+row.format+' (P82 ZIP)',
      confidence:'Source PNG verified against P82 original-index evidence; native live stage assembly/timing UNKNOWN',
      source:{path:config.gra,offset:originalOffset,length:originalLength,
        sha256:originalSignatures[config.gra]},
      width:header.width,height:header.height,
      bytes:entryBytes,mime:'image/png',filename:'MK2_P83_'+row.path.replaceAll('/','_'),
      metadata:{
        sourceFormat:'MK2_P83_QUALIFIED_O132_SOURCE_LAYER_ZIP_V1',
        archiveMember:row.path,originalP82ArchiveFileSha256:row.sha256,
        originalIndexOrOpacityPlaneStoredAsPng:true,
        sourcePlaneEncoding:row.format,sourceStage:stage,
        sourceLayerRole:kind,
        sourceExeSha256:originalSignatures['MK2.EXE'],
        staticPaletteSourcePhysical:config.paletteSource,
        livePaletteOwnershipVerified:false,
        sceneWorldPositionRecovered:false,
        nativeAnimationSequenceRecovered:false,
        nativeAnimationTimingRecovered:false,
        nativeParallaxRulesRecovered:false,
        originalP82SourceDecodedInApp:false,
        sourceMosaicIsSetupLocal:kind==='setup',
      },
    });
  }
  for(const stage of names){
    const c=counter[stage],cfg=STAGES[stage];
    need(c.floor===2&&c.sprite===cfg.sprites*3&&c.setup===cfg.setups*3,
      'stage native source PNG category totals mismatch');
  }
  const policySum=wrapper.summary;
  need(object(policySum)&&policySum.sourcePngFiles===115&&
    policySum.originalNativeSpriteCount===29&&
    policySum.originalSetupLocalLayerCount===8,
    'P82 source summary and original stage count disagree');
  return {assets,report:{
    format:'MK2_P83_NATIVE_SOURCE_ARCHIVE_IMPORTED',
    originalMk2AssetsPreserved:5369,separatelyImportedPngs:115,
    originalSourceStages:2,originalNativeFloors:2,
    originalNativeSprites:29,originalSetupLocalLayers:8,
    originalSourceFingerprintsVerified:4,nativeWidthsPreserved:[896,896],
    livePaletteOrCameraOrAnimationClaimed:false,
    sourceInputSignatureSha256:{...originalSignatures},
    selectedP82ArchiveSha256:await hash(bytes),
  }};
}
/** Original MK2 directory fingerprint check cannot be bypassed by the UI. */
export async function importMK2P83StageZip(
  source:DirectorySource,existing:readonly Asset[],
  bytes:Uint8Array,signal?:AbortSignal,
):Promise<P83VerifiedPackage>{
  signal?.throwIfAborted();
  need(existing.length===5369,'accepted original MK2 5,369-asset baseline required');
  const entries=await source.listRecursive();
  const originals:Record<string,string>={};
  for(const [name,expected] of Object.entries(MK2_P83_CANONICAL_SHA)){
    signal?.throwIfAborted();
    const matches=entries.filter((e:SourceFileEntry)=>e.name.toUpperCase()===name);
    need(matches.length===1,'original DOS MK2 source file absent or duplicated: '+name);
    const e=matches[0],data=await source.readSlice(e.path,0,e.size);
    need(data.length===e.size&&await hash(data)===expected,
      'original MK2 file differs from canonical source: '+name);
    originals[name]=expected;
  }
  const imported=await validateMK2P83StageZip(bytes,originals,signal);
  const currentIds=new Set(existing.map(a=>a.id));
  need(imported.assets.every(a=>!currentIds.has(a.id)),'P83 native source IDs collide with existing resources');
  return imported;
}
