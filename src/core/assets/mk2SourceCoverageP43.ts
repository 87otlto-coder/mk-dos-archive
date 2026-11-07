/** P43: add only independently qualified, already-exported TOWER effects to byte accounting. */
import type {Asset} from './model';
import {hash} from './model';
import type {SourceFileEntry} from '../filesystem/DirectorySource';
import {buildMK2SourceCoverageP40} from './mk2SourceCoverageP40';
import {summarizeEncodedIntervals} from './mk2SourceCoverageP37';
const TOWER_SHA='7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8';
const ORIGINALS=[
{"assetId":"mk2-stage-effect:tower_original_effect:00","sequence":"tower_original_effect","ordinal":0,"sourcePointerObject2":91280,"descriptorObject2":96704,"width":41,"height":63,"anchor":{"x":22,"y":40},"start":40776,"endExclusive":42976,"indicesSha256":"627eac26600a897f390dfbd689f6fe31496e2bd08181d4bf39b750aa9985ec8d","maskSha256":"21909ce120ad153097f32f67318b0bef2cdf8a8bcdffd6752d6cf4a9bbd01e6a"},
{"assetId":"mk2-stage-effect:tower_original_effect:01","sequence":"tower_original_effect","ordinal":1,"sourcePointerObject2":91280,"descriptorObject2":96720,"width":38,"height":63,"anchor":{"x":22,"y":40},"start":42976,"endExclusive":45160,"indicesSha256":"7a3a7e4cfd03ef119785f222b7ccb6a396409e0f8463b0ab94c8522a9bd93ac2","maskSha256":"0c4103c8920f85decef15ccbcc28f29d57bc563ba7702ea24f3f30fa4d5189e7"},
{"assetId":"mk2-stage-effect:tower_original_effect:02","sequence":"tower_original_effect","ordinal":2,"sourcePointerObject2":91280,"descriptorObject2":96732,"width":37,"height":63,"anchor":{"x":22,"y":40},"start":45160,"endExclusive":47344,"indicesSha256":"0624accc086086557d1a719e61e72195171588edc2a404bd63a3d931dc3d32c3","maskSha256":"af58feb63136ff33285d1e0cb693845aefcc0284aec53a0bb5e1aa5e01bc1f99"},
{"assetId":"mk2-stage-effect:tower_original_effect:03","sequence":"tower_original_effect","ordinal":3,"sourcePointerObject2":91280,"descriptorObject2":96744,"width":38,"height":63,"anchor":{"x":22,"y":40},"start":47344,"endExclusive":49536,"indicesSha256":"e55ae30ff6e9df23621309d3d75ac862cb035d4ab70c1d9e8f9dfa61356a1847","maskSha256":"41acfa94d882edf039f058b421593ea7d9f9d47ae20b09d622313af6ed759baf"},
{"assetId":"mk2-stage-effect:tower_original_effect:04","sequence":"tower_original_effect","ordinal":4,"sourcePointerObject2":91280,"descriptorObject2":96756,"width":39,"height":63,"anchor":{"x":22,"y":40},"start":49536,"endExclusive":51764,"indicesSha256":"7e220dfd2c670c6fd211dc0bd74472696ba8bd293083ff811cf498321968a22d","maskSha256":"8aa6c9ab0bd6133937ce205c11b9a164883e437eff9812aab246943dbdddf20f"},
{"assetId":"mk2-stage-effect:tower_original_effect:05","sequence":"tower_original_effect","ordinal":5,"sourcePointerObject2":91280,"descriptorObject2":96768,"width":40,"height":63,"anchor":{"x":22,"y":40},"start":51764,"endExclusive":54020,"indicesSha256":"c3bba940ef55b25bd4151719f2b98ccbefca11a42ff1832cc31c7747365e5447","maskSha256":"22352de4643f0293da971fae3e39d841bcad2dd0b8cfc51dbdf7e2c6a6b40125"},
{"assetId":"mk2-stage-effect:tower_original_effect:06","sequence":"tower_original_effect","ordinal":6,"sourcePointerObject2":91280,"descriptorObject2":96780,"width":42,"height":63,"anchor":{"x":22,"y":40},"start":54020,"endExclusive":56268,"indicesSha256":"63f56a180dedcfe26039ed6337a9f1eab50bb3723b0e6d6ae3c96461ec6c32d4","maskSha256":"38875163c8b4b7ef3310dd5d6798509e713084762feae4fdc36c6969c6d1efc6"}
] as const;
export const MK2_P43_COVERAGE_LIMITATION='P43 includes seven existing TOWER effect streams in source-byte accounting. Complete byte coverage does not prove a complete scene, runtime alpha, palette ownership or timing. Other gaps remain outside the selected report scope.';
function need(ok:unknown,detail:string):asserts ok{if(!ok)throw Error('P43 TOWER coverage: '+detail);}
export async function buildMK2SourceCoverageP43(files:SourceFileEntry[],assets:Asset[]){
 const base=await buildMK2SourceCoverageP40(files,assets);
 const tower=base.resources.find(r=>r.name==='TOWER.GRA');
 let replacement:Record<string,unknown>,reconciliation:Record<string,unknown>;
 try{
  need(tower&&'intervals' in tower&&tower.status==='VERIFIED_INTERVAL_ACCOUNTING','P40 TOWER interval accounting unavailable');
  const entries=files.filter(f=>f.name.toLowerCase()==='tower.gra');
  need(entries.length===1&&entries[0].size===113612&&tower.upstreamAuthenticatedSha256===TOWER_SHA,'original resource binding');
  const normalize=(s:string)=>s.replace(/\\/g,'/').toLowerCase();
  const selected=assets.filter(a=>/^mk2-stage-effect:tower_original_effect:/.test(a.id));
  need(selected.length===7,'exactly seven existing effect records required');
  const added=[];
  for(const expected of ORIGINALS){
   const matches=selected.filter(a=>a.id===expected.assetId);need(matches.length===1,'unique effect '+expected.assetId);
   const a=matches[0],m=a.metadata,ref=normalize(a.source.path);
   need((ref===normalize(entries[0].path)||ref==='tower.gra')&&a.source.sha256===TOWER_SHA,'authenticated source reference');
   need(a.source.offset===expected.start&&a.source.length===expected.endExclusive-expected.start,'original source extent');
   need(a.width===expected.width&&a.height===expected.height,'original geometry');
   need(m.stage==='tower'&&m.sequence===expected.sequence&&m.sourceFrameOrdinal===expected.ordinal,'original sequence provenance');
   need(m.sourcePointerObject2===expected.sourcePointerObject2&&m.descriptorObject2===expected.descriptorObject2,'original pointer/descriptor');
   need(m.sourceX===expected.anchor.x&&m.sourceY===expected.anchor.y,'original descriptor anchors');
   need(m.animationFPSKnown===false&&m.runtimeActivationKnown===false&&m.finalScreenCoordinatesKnown===false&&m.runtimePaletteSelected===false,'qualification flags');
   need(m.indices instanceof Uint8Array&&m.mask instanceof Uint8Array,'native planes');
   need(await hash(m.indices)===expected.indicesSha256&&await hash(m.mask)===expected.maskSha256,'independent native plane hashes');
   added.push({assetId:a.id,start:a.source.offset,endExclusive:a.source.offset+a.source.length});
  }
  const originalIntervals=tower.intervals;need(Array.isArray(originalIntervals),'P40 intervals missing');
  const summary=summarizeEncodedIntervals(entries[0].size,[...originalIntervals,...added]);
  need(summary.qualifiedReferences===14&&summary.coveredBytes===113612&&summary.outsideScopeBytes===0&&summary.duplicateOrOverlappingReferenceBytes===0,'exact native byte partition');
  replacement={...tower,...summary};
  reconciliation={status:'VERIFIED',existingEffectReferences:7,newRepresentations:0,priorOutsideScopeBytes:15492,remainingOutsideScopeBytes:0,
   sourceImageInterval:{start:40776,endExclusive:56268,encodedBytes:15492},sourceListObject2:[0x16490],
   nativePaletteOrTimingClaimsAdded:false};
 }catch(e){
  replacement={name:'TOWER.GRA',status:'UNAVAILABLE',reason:e instanceof Error?e.message:String(e)};
  reconciliation={status:'UNAVAILABLE',existingEffectReferences:0,newRepresentations:0,reason:replacement.reason};
 }
 const resources=base.resources.map(r=>r.name==='TOWER.GRA'?replacement:r);
 return {...base,schema:'mkdos_p43_native_source_interval_coverage_v1',status:resources.some(r=>r.status==='UNAVAILABLE')?'PARTIAL':'VERIFIED_INTERVAL_ACCOUNTING',
  scope:'P22-P35 standalone indexed streams, P10 bridge streams, authenticated native floors, and all 43 existing TOMB/PORTAL/TOWER effect streams. Generic whole-resource references and composites are excluded; gaps are outside this selected scope.',
  limitation:MK2_P43_COVERAGE_LIMITATION,towerEffectReconciliation:reconciliation,resources};
}
