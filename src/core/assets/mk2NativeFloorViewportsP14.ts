/** P14 source-verified O110C original MK2 floor viewport projections.
 * 320-column, x=288, hypothetical palette base=1 is a BOUNDED NEUTRAL
 * original-source renderer input, NOT a verified runtime camera or palette.
 * Exact original index bytes are retained; grayscale is diagnostic only.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';

const EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const TABLE = 0xcfbac, LUT = 0xa0c54 + 0x1084;
const WIDTH = 320, STRIDE = 896, X = 288, BANK_START = 1;
const SOURCES = [
  {
    "label": "tomb",
    "filename": "tomb.gra",
    "sha256": "be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613",
    "resourceId": 28,
    "tableSlot": 0,
    "offset": 63776,
    "rows": 48,
    "sourcePlaneSha256": "c8b68c1b14f8c031ec55882438aff366ddcc2a254a01744febf04d19b3fc37a7",
    "indexSha256": "9c0e093d534602d354a1837b2173b60f5aaefa7fda15b6d84322e104a68283ec"
  },
  {
    "label": "battle",
    "filename": "battle.gra",
    "sha256": "ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63",
    "resourceId": 34,
    "tableSlot": 1,
    "offset": 59436,
    "rows": 40,
    "sourcePlaneSha256": "4ba70a5724b78e35d583a8b18b86d743c8eaa94e4dc07e124c87473260e343e6",
    "indexSha256": "068f9aaf252ed0e8598be67c3d21c4b99f52df1d32ff21fead47647a073d8bdf"
  },
  {
    "label": "tower",
    "filename": "tower.gra",
    "sha256": "7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8",
    "resourceId": 30,
    "tableSlot": 2,
    "offset": 56268,
    "rows": 64,
    "sourcePlaneSha256": "39433e089201493902762ddefc891a7fc62653ea3c1a06f8a85c7c509bd2193a",
    "indexSha256": "6bc3334fcaa23831ee94e8a27e35c40046795726f4710ceffd7051bc8b45db07"
  },
  {
    "label": "forest",
    "filename": "forest.gra",
    "sha256": "8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9",
    "resourceId": 27,
    "tableSlot": 3,
    "offset": 198116,
    "rows": 32,
    "sourcePlaneSha256": "04b8d6b67c89d83aa2514edd0107690e0812f399da2f32f2e60367c3fad5b688",
    "indexSha256": "c9c63bcf466c4e13def0863eab2a03ed74a32f0385a50f1cfa0a569f323c771e"
  },
  {
    "label": "armory",
    "filename": "armory.gra",
    "sha256": "fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612",
    "resourceId": 26,
    "tableSlot": 4,
    "offset": 126336,
    "rows": 56,
    "sourcePlaneSha256": "7f8c956a82b7f7b062b05a1f37b90f604a7e7a1c284c6209ba81bd03f7125226",
    "indexSha256": "290cc586432cba230da09d72ef3ed471b1abaedd5fd0f5c76ac2236fafb098c0"
  },
  {
    "label": "portal",
    "filename": "portal.gra",
    "sha256": "cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82",
    "resourceId": 25,
    "tableSlot": 6,
    "offset": 56916,
    "rows": 40,
    "sourcePlaneSha256": "eb99434188317a0adac30f378c2362b857efcba7690180bd60dc80b9432158ff",
    "indexSha256": "3f8488e9ba1a6857727da8d24ea04fc5005fde2f62519531e8478c87cad3a878"
  },
  {
    "label": "arena",
    "filename": "arena.gra",
    "sha256": "37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb",
    "resourceId": 31,
    "tableSlot": 7,
    "offset": 90488,
    "rows": 40,
    "sourcePlaneSha256": "c0a80a4ae3adec186475fd04dbd597b2f4d79f37a43a6e30cfe359a5da442ac5",
    "indexSha256": "0bb15c19f63420716f2fc4b36eb6d8112930dcca0d53a10657fe8e4a6e6b9334"
  }
] as const;

export const MK2_P14_VIEWPORT_LIMITATION =
  'P14 O110C seven original source-backed floor projections: 320 x source rows, x=288 and hypothetical palette-bank start=1. ' +
  'This neutral, source-executable-backed view is NOT an observed gameplay camera, 320x200 scene, colour palette, ' +
  'full background layout, layer order, animation timing, or runtime display state. Grayscale depicts numeric index values; ' +
  'palette-known mask is entirely zero. Original source indices and provenance are available in selected-asset ZIPs.';

type Status = {resource:string;status:'VERIFIED'|'UNAVAILABLE';reason?:string;pixels?:number;sourceRows?:number;sourceOffset?:number};
function assertSource(ok:unknown,why:string): asserts ok { if(!ok) throw Error('P14 O110C: '+why); }
function exactHex(b:Uint8Array,offset:number,hex:string):boolean {
  if(offset+hex.length/2>b.length)return false;
  for(let i=0;i<hex.length;i+=2)if(b[offset+i/2]!==parseInt(hex.slice(i,i+2),16))return false;
  return true;
}
function only(entries:SourceFileEntry[],name:string):SourceFileEntry {
  const hits=entries.filter(e=>e.name.toLowerCase()===name);
  assertSource(hits.length===1,`exactly one ${name} required (found ${hits.length})`);
  return hits[0];
}
function verifyExe(exe:Uint8Array):void {
  assertSource(exe.length===861133,'canonical original MK2.EXE size');
  // Exact original x86 instructions for the viewport camera model and
  // x86 DWORD emitter. These bytes were independently qualified at O110C.
  const witnesses:[number,string][]=[
    [0x9e138,'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fba373740700'],
    [0x9e16a,'03348554ef0200'],
    [0x9e18b,'b80100000055e83078fcff5d'],
    [0x659e7,'0fb7e88a04c5065b07004825ff0000008b1485841000008b3cbde4570300'],
    [0x65a0f,'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5']
  ];
  for(const [addr,hex]of witnesses) assertSource(exactHex(exe,addr,hex),`source renderer opcode witness 0x${addr.toString(16)}`);
  const v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
  for(let i=0;i<256;i++)assertSource(v.getUint32(LUT+i*4,true)===(i*0x01010101)>>>0,`native replicated-byte LUT entry ${i}`);
  // At bankStart=1, the exact source x86 DWORD correction is 0.
  assertSource(v.getUint32(LUT+(BANK_START-1)*4,true)===0,'neutral palette correction equals zero');
}
export type P14ViewportResult = {
  assets:Asset[];
  packages:Array<{name:string;bytes:Uint8Array}>;
  status:{status:'VERIFIED'|'PARTIAL'|'UNAVAILABLE';count:number;rows:Status[];exeQualification?:string};
};
export async function buildMK2NativeViewportFloorsP14(source:DirectorySource):Promise<P14ViewportResult> {
  const assets:Asset[]=[],packages:P14ViewportResult['packages']=[],rows:Status[]=[];
  const entries=await source.listRecursive();
  let exe:Uint8Array;
  try {
    const e=only(entries,'mk2.exe');
    exe=await source.readSlice(e.path,0,e.size);
    assertSource(await hash(exe)===EXE_SHA,'canonical original MK2.EXE SHA256');
    verifyExe(exe);
  } catch(err) {
    const reason=err instanceof Error?err.message:String(err);
    return {assets,packages,status:{status:'UNAVAILABLE',count:0,rows:SOURCES.map(s=>({resource:s.filename,status:'UNAVAILABLE',reason})),exeQualification:reason}};
  }
  const ev=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),files:Array<{name:string;bytes:Uint8Array}>=[],manifestRecords:unknown[]=[];
  for(const spec of SOURCES){
    try {
      const packed=((spec.resourceId<<24) | spec.offset)>>>0;
      assertSource(ev.getUint32(TABLE+spec.tableSlot*4,true)===packed,`original pointer ${spec.filename}`);
      const entry=only(entries,spec.filename);
      assertSource(entry.size===spec.offset+STRIDE*spec.rows,`full original resource length ${spec.filename}`);
      const original=await source.readSlice(entry.path,0,entry.size);
      assertSource(original.length===entry.size&&await hash(original)===spec.sha256,`canonical resource checksum ${spec.filename}`);
      const suffix=original.subarray(spec.offset);
      assertSource(await hash(suffix)===spec.sourcePlaneSha256,`native 896-column source suffix ${spec.filename}`);
      const indices=new Uint8Array(WIDTH*spec.rows),mask=new Uint8Array(indices.length).fill(1),paletteKnownMask=new Uint8Array(indices.length),rgba=new Uint8Array(indices.length*4);
      for(let y=0;y<spec.rows;y++) {
        // O110C source camera x=288 has slope 0, so each row advances by 896.
        // Bank-start 1 selects source LUT DWORD zero. The exact x86 DWORD ADD
        // therefore copies all 80 source DWORDs without pixel-level mutation.
        const from=y*STRIDE+X;
        assertSource(from+WIDTH<=(y+1)*STRIDE,`bounded source row ${spec.filename}:${y}`);
        indices.set(suffix.subarray(from,from+WIDTH),y*WIDTH);
      }
      assertSource(await hash(indices)===spec.indexSha256,`independent O110C projection pixel hash ${spec.filename}`);
      for(let p=0;p<indices.length;p++){
        const at=p*4;rgba[at]=indices[p];rgba[at+1]=indices[p];rgba[at+2]=indices[p];rgba[at+3]=255;
      }
      const paths={png:`preview/${spec.label}_x288_bank1_320x${spec.rows}.png`,
        indices:`indexed/${spec.label}_x288_bank1.indices.bin`,
        mask:`indexed/${spec.label}_x288_bank1.mask.bin`,
        paletteKnownMask:`indexed/${spec.label}_x288_bank1.palette-known.bin`};
      const metadata={sourceFormat:'O110C 896-byte packed floor row',sourceResourceId:spec.resourceId,
        originalPointerTablePhysical:TABLE+spec.tableSlot*4,originalGRAOffset:spec.offset,
        originalSourceStride:STRIDE,sourceRows:spec.rows,sourcePlaneSha256:spec.sourcePlaneSha256,
        sourceIndexProjectionSha256:spec.indexSha256,sourceX:X,sourceBankStart:BANK_START,
        nativeRowEmitter:'80 little-endian DWORD ADD per projected row; LUT word=0 at bankStart=1',
        sourceNativeCameraInput:'normalized O110C control input; not live observed',
        originalPaletteKnown:false,originalRuntimeCameraKnown:false,originalRowPlacementKnown:false,
        originalFrameRateKnown:false,completeStageComposition:false,
        diagnosticPreviewFormula:'RGB = (index,index,index) from exact source-projected bytes; NOT original RGB',
        indices,mask,paletteKnownMask,
        provenance:'O110C original MK2.EXE control walker / packed floor emitter and independent fixture parity'};
      assets.push({id:`mk2-viewport-floor:${spec.label}:x288-bank1`,
        name:`${spec.filename.toUpperCase()} · original 320×${spec.rows} viewport (normalized)`,
        group:'MK2 original packed stage-floor viewport projections · colour UNKNOWN',
        kind:'stage',format:'PNG index-value · O110C native 320-column viewport',
        confidence:'Original projected indices VERIFIED; actual runtime camera and palette UNKNOWN',
        source:{path:entry.path,offset:spec.offset,length:suffix.length,sha256:spec.sha256},
        metadata,width:WIDTH,height:spec.rows,rgba,
        filename:`MK2_${spec.label}_source_viewport_320x${spec.rows}_x288_gray.png`});
      files.push({name:paths.png,bytes:encodeOriginalEffectRgbaPngO177(WIDTH,spec.rows,rgba)},
        {name:paths.indices,bytes:indices},{name:paths.mask,bytes:mask},{name:paths.paletteKnownMask,bytes:paletteKnownMask});
      manifestRecords.push({resource:spec.filename,resourceId:spec.resourceId,sourceOffset:spec.offset,
        sourceRows:spec.rows,originalResourceSHA256:spec.sha256,originalSuffixSHA256:spec.sourcePlaneSha256,
        indexSha256:spec.indexSha256,assumptions:{sourceX:X,hypotheticalBankStart:BANK_START},paths});
      rows.push({resource:spec.filename,status:'VERIFIED',pixels:indices.length,sourceRows:spec.rows,sourceOffset:spec.offset});
    } catch(error) {rows.push({resource:spec.filename,status:'UNAVAILABLE',reason:error instanceof Error?error.message:String(error)});}
  }
  if(files.length) {
    files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({format:'mk2_p14_original_floor_native_viewport_v1',
      sourceResearch:'O110C independently verified MK2 native emitter',
      sourceInput:'authentic original DOS MK2 only',sourceX:X,hypotheticalPaletteBankStart:BANK_START,
      paletteKnown:false,runtimeCameraKnown:false,completeStageComposition:false,
      sourceRowStride:STRIDE,projectionWidth:WIDTH,records:manifestRecords,
      limitations:MK2_P14_VIEWPORT_LIMITATION},null,2)+'\n')});
    packages.push({name:'MK2_P14_SEVEN_NATIVE_PACKED_FLOOR_VIEWPORTS.zip',bytes:buildStoredZip(files)});
  }
  return {assets,packages,status:{status:rows.every(x=>x.status==='VERIFIED')?'VERIFIED':rows.some(x=>x.status==='VERIFIED')?'PARTIAL':'UNAVAILABLE',count:assets.length,rows}};
}
