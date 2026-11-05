/** P13: authentic MOUNTAIN.GRA consumer-connected original indexed graphics.
 * O96T independently verifies 15 contiguous native streams in the original
 * 23,024-byte resource suffix; O96S consumer selects only first 14 records.
 * O96U establishes six conditional source-list alternatives, NOT a runtime
 * selected layout, screen-coordinate mapping, palette or animation timing.
 * Source-only previews are diagnostic grayscale; correct RGB is UNKNOWN.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';

const EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA = '0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6';
const OBJ2_IMAGE = 0xa0c54, FIRST_DESCRIPTOR = 0x1c4cc, DESCRIPTOR_STRIDE = 16;
const POINTER_TABLE = 0x1c264, NATIVE_SUFFIX_START = 0x29314, RESOURCE_ID = 37;
const WIDTH = 35, HEIGHT = 41, IMAGE_PIXELS = WIDTH * HEIGHT;

export const MK2_P13_MOUNTAIN_LIMITATION =
  'P13 MOUNTAIN.GRA: 14 O96S table-selected original indexed object graphics and one structurally adjacent, NOT selected image. ' +
  'Their lossless 23,024-byte encoded suffix is source-verified, while the 168,724-byte prefix remains unresolved. ' +
  'The normalized grayscale PNG is a diagnostic INDEX-VALUE visualization, never the original palette. ' +
  'Original source indices reach 96; a direct unmodified 63-color palette cannot represent them. ' +
  'Six O96U source orders are conditional object-creation inputs, NOT verified animation order, screen position, timing, named stage or reconstructed scene.';

interface IndexedImage {
  ordinal: number; selectedBySourceTable: boolean; width: number; height: number;
  descriptorPhysical: number; graOffset: number; graEnd: number;
  indices: Uint8Array; mask: Uint8Array; rgba: Uint8Array;
  minIndex: number; maxIndex: number; commandCounts: { skip: number; rle: number; literal: number };
}
export type P13MountainResult = {
  assets: Asset[];
  packages: Array<{ name: string; bytes: Uint8Array }>;
  status: {
    status: 'VERIFIED' | 'UNAVAILABLE'; count: number; selectedCount: number;
    adjacentUnselectedCount: number; detail?: string;
    originalSourceOrders?: number[][];
  };
};
function ensure(ok: unknown, reason: string): asserts ok {
  if (!ok) throw Error('P13 original MOUNTAIN.GRA: ' + reason);
}
function one(entries: SourceFileEntry[], basename: string): SourceFileEntry {
  const found = entries.filter(e => e.name.toLowerCase() === basename);
  ensure(found.length === 1, `expected exactly one ${basename}, got ${found.length}`);
  return found[0];
}
function decode(exe: Uint8Array, gra: Uint8Array): { images: IndexedImage[]; sourceOrders: number[][] } {
  const ev = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  const gv = new DataView(gra.buffer, gra.byteOffset, gra.byteLength);
  const u16 = (p: number) => ev.getUint16(p, true);
  const u32 = (p: number) => ev.getUint32(p, true);
  ensure(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1, 0xa13a7)).split('\0')[37] === 'MOUNTAIN.GRA',
    'resource filename pool slot 37');
  for (let slot = 0; slot < 15; slot++) {
    ensure(u32(OBJ2_IMAGE + POINTER_TABLE + slot*4) === FIRST_DESCRIPTOR + DESCRIPTOR_STRIDE*Math.min(slot,13),
      `O96S consumer descriptor slot ${slot}`);
  }
  const sourceOrders: number[][] = [];
  for (let variant = 0; variant < 6; variant++) {
    const target = u32(OBJ2_IMAGE + 0x2af80 + variant*4);
    ensure(target === 0x2af98 + variant*32, `O96R original word-stream pointer ${variant}`);
    const words = Array.from({length:16}, (_,i) => ev.getInt16(OBJ2_IMAGE + target + i*2,true));
    ensure(words[14] === 13 && words[15] === -1 &&
      JSON.stringify([...words.slice(0,14)].sort((a,b)=>a-b)) === JSON.stringify([...Array(13)].map((_,i)=>i).concat([14])),
      `O96U conditional object-source token domain variant ${variant}`);
    sourceOrders.push(words.slice(0,14));
  }
  ensure(new Set(sourceOrders.map(x=>JSON.stringify(x))).size===5 &&
    JSON.stringify(sourceOrders[2])===JSON.stringify(sourceOrders[3]), 'O96U six variants / five distinct source orders');
  for (let j=0;j<14;j++) {
    ensure(ev.getInt16(OBJ2_IMAGE + 0x1c2c6 + j*2,true)===771-47*j,
      `O96S source object high-word input ${j}`);
  }
  const images: IndexedImage[] = [];
  let previousEnd = NATIVE_SUFFIX_START;
  for (let i=0;i<15;i++) {
    const descriptorPhysical=OBJ2_IMAGE + FIRST_DESCRIPTOR + DESCRIPTOR_STRIDE*i;
    ensure(descriptorPhysical+16<=exe.length,`descriptor ${i} within EXE`);
    const width=u16(descriptorPhysical),height=u16(descriptorPhysical+2),state=u32(descriptorPhysical+4),
      packed=u32(descriptorPhysical+8),aux=u32(descriptorPhysical+12);
    const graOffset=packed & 0xffffff;
    ensure(width===WIDTH && height===HEIGHT && state===0 && (packed>>>24)===RESOURCE_ID && aux===0x2b52a,
      `original 16-byte descriptor ${i}`);
    ensure(graOffset===previousEnd,`contiguous bounded original stream ${i}`);
    const indices=new Uint8Array(IMAGE_PIXELS), mask=new Uint8Array(IMAGE_PIXELS),rgba=new Uint8Array(IMAGE_PIXELS*4);
    const counts={skip:0,rle:0,literal:0};let p=graOffset;
    for (let y=0;y<height;y++) {
      let x=0;
      while (x<width) {
        ensure(p+4<=gra.length,`truncated original stream ${i} row ${y}`);
        const cmd=gv.getUint32(p,true);p+=4;
        let count:number;
        if (cmd&1) {count=cmd>>>1;counts.skip++;}
        else if (cmd&2) {
          count=cmd>>>10;
          ensure(count>0&&count<=width-x,`RLE row length ${i}:${y}`);
          indices.fill((cmd>>>2)&255,y*width+x,y*width+x+count);
          mask.fill(1,y*width+x,y*width+x+count);counts.rle++;
        } else {
          count=cmd>>>2;
          ensure(count>0&&count<=64&&count<=width-x&&p+((count+3)&~3)<=gra.length,
            `native literal length ${i}:${y}`);
          indices.set(gra.subarray(p,p+count),y*width+x);
          mask.fill(1,y*width+x,y*width+x+count);
          p+=(count+3)&~3;counts.literal++;
        }
        ensure(count>0&&count<=width-x,`original row extent ${i}:${y}`);
        x+=count;
      }
    }
    ensure(counts.skip===0 && mask.every(x=>x===1),`all 1435 source pixels opaque ${i}`);
    const minIndex=Math.min(...indices),maxIndex=Math.max(...indices);
    for(let px=0;px<IMAGE_PIXELS;px++) {
      // Source-value visualization only; original values remain in metadata.indices.
      const intensity=Math.floor(indices[px]*255/96),pos=px*4;
      rgba[pos]=intensity;rgba[pos+1]=intensity;rgba[pos+2]=intensity;rgba[pos+3]=255;
    }
    images.push({ordinal:i,selectedBySourceTable:i<14,width,height,descriptorPhysical,graOffset,graEnd:p,
      indices,mask,rgba,minIndex,maxIndex,commandCounts:counts});
    previousEnd=p;
  }
  ensure(previousEnd===gra.length && gra.length===191748 && previousEnd-NATIVE_SUFFIX_START===23024,
    '15 original streams exactly tile source suffix');
  ensure(Math.max(...images.map(i=>i.maxIndex))===96,'original source index maximum is 96, not 63');
  return {images,sourceOrders};
}
export async function buildMK2MountainSourceP13(source:DirectorySource):Promise<P13MountainResult> {
  try {
    const entries=await source.listRecursive();
    const e=one(entries,'mk2.exe'),m=one(entries,'mountain.gra');
    const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(m.path,0,m.size);
    ensure(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical original MK2.EXE checksum');
    ensure(gra.length===191748&&await hash(gra)===GRA_SHA,'canonical original MOUNTAIN.GRA checksum');
    const {images,sourceOrders}=decode(exe,gra);
    const assets:Asset[]=[],files:Array<{name:string;bytes:Uint8Array}>=[],manifestRecords:Record<string,unknown>[]=[];
    for(const s of images) {
      const ordinal=String(s.ordinal).padStart(2,'0');
      const known=new Uint8Array(IMAGE_PIXELS); // every RGB assignment is UNQUALIFIED
      const paths={png:`preview/mountain_source_${ordinal}.png`,
        indices:`indexed/mountain_source_${ordinal}.indices.bin`,mask:`indexed/mountain_source_${ordinal}.mask.bin`,
        paletteKnownMask:`indexed/mountain_source_${ordinal}.palette-known.bin`};
      const preview=encodeOriginalEffectRgbaPngO177(s.width,s.height,s.rgba);
      files.push({name:paths.png,bytes:preview},{name:paths.indices,bytes:s.indices},
        {name:paths.mask,bytes:s.mask},{name:paths.paletteKnownMask,bytes:known});
      const metadata={resourceId:RESOURCE_ID,sourceDescriptorPhysical:s.descriptorPhysical,
        nativeGraOffset:s.graOffset,nativeGraEndExclusive:s.graEnd,
        nativeSourceWidth:s.width,nativeSourceHeight:s.height,
        sourceIndexMin:s.minIndex,sourceIndexMax:s.maxIndex,sourceCommands:s.commandCounts,
        selectedByO96SPointerTable:s.selectedBySourceTable,
        isAdjacentStructurallyQualifiedOnly:!s.selectedBySourceTable,
        originalPaletteKnown:false,liveDACVerified:false,originalFrameRateKnown:false,
        originalScenePositionKnown:false,originalStageIdentityKnown:false,
        sourceWordInputMeaningKnown:false,originalResourcePrefixCoverage:'UNQUALIFIED 168724 bytes',
        diagnosticPreviewFormula:'grayscale=floor(sourceIndex*255/96); NOT a runtime palette',
        indices:s.indices,mask:s.mask,paletteKnownMask:known,
        provenance:'O96S pointer consumer + O96T independent original decoder + O96U conditional source orders'};
      assets.push({id:`mk2-mountain-source:${s.ordinal}:original-indices`,
        name:`MOUNTAIN.GRA · original graphic ${ordinal}${s.selectedBySourceTable?'':' · adjacent unselected'}`,
        group:'MK2 MOUNTAIN.GRA · original indexed object graphics (scene unknown)',kind:'sprite',
        format:'PNG · diagnostic grayscale; original indexed data preserved',
        confidence:s.selectedBySourceTable?'O96T source-exact; O96S conditional descriptor selected; RGB UNKNOWN':
          'O96T source-exact adjacent sprite; NOT selected by O96S; RGB UNKNOWN',
        source:{path:m.path,offset:s.graOffset,length:s.graEnd-s.graOffset,sha256:GRA_SHA},
        metadata,width:s.width,height:s.height,rgba:s.rgba,
        filename:`MK2_MOUNTAIN_original_${ordinal}_INDEX_VALUE_PREVIEW.png`});
      manifestRecords.push({ordinal:s.ordinal,selectedByO96SPointerTable:s.selectedBySourceTable,
        originalDescriptorPhysical:s.descriptorPhysical,originalGraOffset:s.graOffset,
        originalGraEndExclusive:s.graEnd,sourceMinIndex:s.minIndex,sourceMaxIndex:s.maxIndex,
        width:s.width,height:s.height,paths});
    }
    ensure(assets.length===15 && assets.filter(a=>a.metadata.selectedByO96SPointerTable).length===14,
      'exact 14 selected plus 1 adjacent original graphic');
    files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({
      format:'mkdos_p13_mountain_o96t_o96u_original_indexed_v1',
      originalExeSha256:EXE_SHA,originalMountainGraSha256:GRA_SHA,
      resourceBytes:191748,unqualifiedPrefixBytes:NATIVE_SUFFIX_START,
      boundedSuffixStart:NATIVE_SUFFIX_START,boundedSuffixEndExclusive:gra.length,
      suffixEncodedBytes:23024,sourcePointerSlots:15,selectedUniqueSourceDescriptors:14,
      sourceToken14AliasesDescriptor13:true,adjacentFifteenthNotSelected:true,
      originalConditionalOrders:sourceOrders,selectedVariantAtRuntimeKnown:false,
      allRgbUnknown:true,originalPaletteAssigned:false,completeStageComposition:false,
      limitations:MK2_P13_MOUNTAIN_LIMITATION,records:manifestRecords},null,2))});
    files.push({name:'README.txt',bytes:utf8.encode(MK2_P13_MOUNTAIN_LIMITATION+'\nSource assets are index-value previews, not authentic coloured gameplay frames.\n')});
    return {assets,packages:[{name:'MK2_P13_MOUNTAIN_FIFTEEN_ORIGINAL_INDEXED_GRAPHICS.zip',bytes:buildStoredZip(files)}],
      status:{status:'VERIFIED',count:assets.length,selectedCount:14,adjacentUnselectedCount:1,originalSourceOrders:sourceOrders}};
  }catch(error) {
    return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,selectedCount:0,adjacentUnselectedCount:0,detail:String(error)}};
  }
}
