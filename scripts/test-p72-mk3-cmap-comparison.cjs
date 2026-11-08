#!/usr/bin/env node
/** P72 source-only MK3 sprite vs explicitly selected original IFF CMAP.
 * Positive byte-level index/mask/CMAP parity and 16 false source claims.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {listMK3IffPaletteComparisonsP72,compareMK3FighterWithIffCmapP72,
  exportMK3PaletteComparisonP72,MK3_P72_FORMAT}=
 require('../src/core/assets/mk3SourcePaletteComparisonP72.ts');
const {parseAnimationStoreZip}=
 require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function original(){
 const palette=new Uint8Array(768);for(let i=0;i<256;i++){
  palette[3*i]=i;palette[3*i+1]=255-i;palette[3*i+2]=(i*3)&255;
 }
 const fighter={id:'BLADE.FTR:FrHd0:0',name:'BLADE.FTR / FrHd0 / 0',
  kind:'sprite',group:'BLADE',format:'Indexed sprite',confidence:'Decoded; palette unresolved',
  width:3,height:2,filename:'blade_index.png',
  source:{path:'BLADE.FTR',offset:1200,length:80,sha256:'f'.repeat(64)},
  metadata:{indices:new Uint8Array([0,1,2,3,4,255]),
   mask:new Uint8Array([1,1,0,1,0,1]),palette:'UNKNOWN',
   visualization:'GRAYSCALE_INDEX_MAP',headerOffset:120,descriptorIndex:0,
   descriptorX:-3,descriptorY:4,mode:1,group:2,model:0}};
 const iff={id:'DATA.MK3@50',name:'IFF 0',kind:'image',group:'DATA.MK3 · images',
  format:'PBM',confidence:'Embedded palette and bitmap decoded',
  source:{path:'DATA.MK3',offset:50,length:1000,sha256:'a'.repeat(64)},
  metadata:{paletteRgb:palette,paletteFormat:'IFF_CMAP_RGB8',
    paletteSource:'Embedded CMAP in this source FORM',
    paletteRuntimeOwnershipKnown:false}};
 return {fighter,iff};
}
(async()=>{
 const a=original(),b=original();
 const choice={...b.iff,id:'DATA.MK3@200',source:{...b.iff.source,offset:200}};
 const palettes=listMK3IffPaletteComparisonsP72([a.fighter,a.iff,choice]);
 assert.equal(palettes.length,1);assert.equal(palettes[0].identicalSourceCmaps,2);
 assert.equal(palettes[0].sourceIffAsset.id,'DATA.MK3@50');
 const comp=compareMK3FighterWithIffCmapP72(a.fighter,a.iff);
 assert.equal(comp.rgba.length,24);
 const want=new Uint8Array([0,255,0,255,1,254,3,255,0,0,0,0,
   3,252,9,255,0,0,0,0,255,0,253,255]);
 assert.deepStrictEqual(comp.rgba,want);
 assert.deepStrictEqual(comp.originalIndexedPixels,a.fighter.metadata.indices);
 assert.deepStrictEqual(comp.originalMask,a.fighter.metadata.mask);
 assert.deepStrictEqual(comp.originalEmbeddedCmap,a.iff.metadata.paletteRgb);
 assert.equal(a.fighter.metadata.palette,'UNKNOWN','must not mutate source fighter');
 assert.equal(a.fighter.metadata.paletteRgb,undefined);
 const exported=await exportMK3PaletteComparisonP72(a.fighter,a.iff);
 assert.match(exported.name,/^MK3_P72_.*_CMAP_COMPARISON\.zip$/);
 const z=parseAnimationStoreZip(exported.bytes);
 assert.equal(z.size,6);
 assert.deepStrictEqual(z.get('original/fighter-indices.bin').bytes,a.fighter.metadata.indices);
 assert.deepStrictEqual(z.get('original/fighter-mask.bin').bytes,a.fighter.metadata.mask);
 assert.deepStrictEqual(z.get('reference/iff-cmap-rgb8.bin').bytes,a.iff.metadata.paletteRgb);
 assert.deepStrictEqual(z.get('comparison.png').bytes.slice(0,8),new Uint8Array([137,80,78,71,13,10,26,10]));
 const m=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 assert.equal(m.format,MK3_P72_FORMAT);
 assert.equal(m.provenanceConfidence,
  'VERIFIED_SOURCE_PLANES_AND_IFF_CMAP__UNVERIFIED_CROSS_RESOURCE_PALETTE_BINDING');
 assert.equal(m.originalFighter.indicesSha256,sha(a.fighter.metadata.indices));
 assert.equal(m.originalFighter.opacityMaskSha256,sha(a.fighter.metadata.mask));
 assert.equal(m.originalFighter.originalDescriptorHeaderOffset,120);
 assert.equal(m.originalIffPalette.paletteRgbSha256,sha(a.iff.metadata.paletteRgb));
 assert.equal(m.originalIffPalette.originalVerifiedOwner,'EMBEDDED_IN_THIS_IFF_FORM_ONLY');
 assert.equal(m.originalIffPalette.originalFighterOwnership,'UNKNOWN');
 assert.equal(m.display.rgbaSha256,sha(want));
 assert.equal(m.nativeFighterPaletteOwnershipVerified,false);
 assert.equal(m.paletteChoiceWasExplicit,true);
 assert.equal(m.nativeRuntimeAnimationOrStageMembershipClaimed,false);
 let rejected=0;
 async function refuse(label,modify,pattern){
  const q=original();modify(q);
  assert.throws(()=>compareMK3FighterWithIffCmapP72(q.fighter,q.iff),pattern,label);
  await assert.rejects(exportMK3PaletteComparisonP72(q.fighter,q.iff),pattern,label);
  rejected++;
 }
 await refuse('wrong fighter kind',q=>q.fighter.kind='image',/fighter indexed sprite/);
 await refuse('non-FTR fighter',q=>q.fighter.source.path='BLADE.GRA',/fighter indexed sprite/);
 await refuse('source path traversal',q=>q.fighter.source.path='../BLADE.FTR',/original source path/);
 await refuse('no original fighter sha',q=>delete q.fighter.source.sha256,/original source path/);
 await refuse('bad compressed interval',q=>q.fighter.source.length=0,/original source path/);
 await refuse('invalid dimensions',q=>q.fighter.width=0,/sprite geometry/);
 await refuse('indices truncated',q=>q.fighter.metadata.indices=q.fighter.metadata.indices.slice(0,3),/indexed pixels/);
 await refuse('mask truncated',q=>q.fighter.metadata.mask=q.fighter.metadata.mask.slice(0,3),/indexed pixels/);
 await refuse('mask nonbinary',q=>q.fighter.metadata.mask[0]=8,/mask is not binary/);
 await refuse('descriptor missing',q=>delete q.fighter.metadata.headerOffset,/FHDS descriptor/);
 await refuse('original native palette forged',q=>q.fighter.metadata.palette='KNOWN',/fighter already has a different palette/);
 await refuse('RGB already assigned',q=>q.fighter.metadata.paletteRgb=new Uint8Array(768),/fighter already has a different palette/);
 await refuse('IFF CMAP ownership false',q=>q.iff.metadata.paletteRuntimeOwnershipKnown=true,/not an explicit/);
 await refuse('IFF CMAP wrong length',q=>q.iff.metadata.paletteRgb=new Uint8Array(765),/not an explicit/);
 await refuse('different original installation',q=>q.iff.source.path='other/DATA.MK3',/different installation roots/);
 await refuse('invalid IFF FORM asset identity',q=>q.iff.id='unrelated',/IFF FORM source extent/);
 assert.equal(rejected,16);
 console.log(JSON.stringify({pass:'P72_SOURCE',status:'PASS',
  syntheticFalsePaletteOwnershipOrSourceCasesRejected:rejected,
  explicitOriginalIffCmapOnly:true,
  deduplicatedIdenticalSourceCmaps:true,
  originalFighterIndexedPlanesByteIdentical:true,
  originalIffCmapBytesByteIdentical:true,
  rgbaAlphaAndPaletteEntryMappingVerified:true,
  nativeFighterPaletteOwnershipAsserted:false,sourceOnly:true},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
