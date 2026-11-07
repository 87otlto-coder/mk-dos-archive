#!/usr/bin/env node
/** P57 cross-game thumbnail eligibility controls, synthetic source/image data only. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildGalleryVisualsP57}=require('../src/components/stageGalleryVisualsP57.ts');
const HASH='a'.repeat(64);
const asset=(id,path,kind='stage',w=320,h=200)=>({
 id,name:id,group:'source',kind,width:w,height:h,rgba:new Uint8Array(w*h*4),
 source:{path,offset:0,length:100,sha256:HASH},metadata:{},confidence:'Original source, not runtime stage',filename:id+'.png',format:'PNG'
});
const mk1Asset=asset('stages/statue_mod/normalized_combined_background.png','MK1_stages.zip');
const report={
 schema:'mk1_p54_header_module_preview_joins_v1',
 arcadeStageNamesVerified:false,livePaletteOwnershipVerified:false,canonicalGameplayScenesVerified:false,
 modules:[{moduleSymbol:'STATUE_MOD',headerResource:'FU1HDRS.GRA',resourcePath:'FU1HDRS.GRA',status:'EXACT_JOIN',
  normalizedPreviewAssetId:mk1Asset.id}],
 resources:[{headerResource:'FU1HDRS.GRA',moduleSymbols:['STATUE_MOD'],normalizedPreviewAssetIds:[mk1Asset.id]}],
 summary:{sourceModules:1,headerResources:1,exactPreviewJoins:1,missingPreviewJoins:0,unjoinedNormalizedPreviews:[]}
};
const positive=buildGalleryVisualsP57('mk1',[mk1Asset],report);
assert.equal(positive.mk1ByHeader.size,1);
assert.equal(positive.mk1ByHeader.get('FU1HDRS.GRA')[0].asset.id,mk1Asset.id);
assert.equal(positive.errors.length,0);
const mk1Unverified=buildGalleryVisualsP57('mk1',[mk1Asset],{...report,arcadeStageNamesVerified:true});
assert.equal(mk1Unverified.mk1ByHeader.size,0,'falsely named stage must not gain visual link');
const mk1Missing=buildGalleryVisualsP57('mk1',[],report);
assert.equal(mk1Missing.mk1ByHeader.size,0);assert.equal(mk1Missing.errors.length,1);
const mk1Corrupt=buildGalleryVisualsP57('mk1',[{...mk1Asset,rgba:new Uint8Array(1)}],report);
assert.equal(mk1Corrupt.mk1ByHeader.size,0);assert.equal(mk1Corrupt.errors.length,1);
const mk1Duplicate=buildGalleryVisualsP57('mk1',[mk1Asset,mk1Asset],report);
assert.equal(mk1Duplicate.mk1ByHeader.size,0);assert.equal(mk1Duplicate.errors.length,1);

const setup=asset('mk2-stage-setup:tomb:object2_123','TOMB.GRA');
const floor=asset('mk2-floor:tomb:rgba','TOMB.GRA','stage',896,32);
const wrong=asset('unknown:unbound','PORTAL.GRA');
wrong.source.sha256=undefined;
const sprite=asset('mk2-fighter','TOMB.GRA','sprite');
const other=asset('mk2-stage-setup:forest:object2','FOREST.GRA');
const mk2=buildGalleryVisualsP57('mk2',[floor,setup,wrong,sprite,other],null);
assert.equal(mk2.mk2ByResource.get('TOMB.GRA').asset.id,setup.id,'full setup layer preferred over narrow floor');
assert.equal(mk2.mk2ByResource.get('FOREST.GRA').asset.id,other.id);
assert.equal(mk2.mk2ByResource.has('PORTAL.GRA'),false,'unqualified source cannot acquire a stage thumbnail');
assert.equal(mk2.errors.length,1,'failed MK2 binding must be reported');
assert.equal(buildGalleryVisualsP57('mk2',[{...setup,rgba:new Uint8Array(3)}],null).errors.length,1);
assert.equal(buildGalleryVisualsP57('mk2',[setup,setup],null).mk2ByResource.size,0);

const mk3=(offset)=>({
 ...asset('DATA.MK3@'+offset,'DATA.MK3','image',16,12),id:'DATA.MK3@'+offset,
 source:{path:'DATA.MK3',offset,length:250,sha256:HASH},
 metadata:{sourceImageOnly:true,paletteFormat:'IFF_CMAP_RGB8',
  paletteSource:'Embedded CMAP in this source FORM',paletteRuntimeOwnershipKnown:false}
});
const iff=mk3(123),iff2=mk3(20);
const wrongPalette={...mk3(400),metadata:{...mk3(400).metadata,paletteFormat:'UNVERIFIED'}};
const wrongSource={...mk3(501),source:{path:'ANOTHER.MK3',offset:501,length:250,sha256:HASH}};
const mk3Result=buildGalleryVisualsP57('mk3',[iff,iff2,wrongPalette,wrongSource],null);
assert.deepStrictEqual(mk3Result.mk3UnassignedPictures.map(x=>x.asset.id),['DATA.MK3@20','DATA.MK3@123']);
assert.equal(mk3Result.errors.length,1);
assert(mk3Result.mk3UnassignedPictures.every(x=>x.evidence.includes('stage assignment UNKNOWN')));
const mk3Identity=buildGalleryVisualsP57('mk3',[{...iff,id:'DATA.MK3@124'}],null);
assert.equal(mk3Identity.mk3UnassignedPictures.length,0);assert.equal(mk3Identity.errors.length,1);
const mk3Missing=buildGalleryVisualsP57('mk3',[{...iff,rgba:new Uint8Array(1)}],null);
assert.equal(mk3Missing.mk3UnassignedPictures.length,0);assert.equal(mk3Missing.errors.length,1);
const mk3Duplicate=buildGalleryVisualsP57('mk3',[iff,iff],null);
assert.equal(mk3Duplicate.mk3UnassignedPictures.length,0);
console.log(JSON.stringify({pass:'P57_CROSS_GAME_THUMBNAILS',status:'PASS',
 mk1QualifiedHeaderPreviews:1,mk2QualifiedSourceLayers:2,mk3EmbeddedCmapPictures:2,
 mk1InvalidReportExcluded:true,mk1MissingOrCorruptExcluded:true,
 mk2UnprovenSourceExcluded:true,mk3FalsePaletteOrIdentityExcluded:true,
 stageIdentityInvented:false,networkImagesUsed:false,sourceOnly:true},null,2));
