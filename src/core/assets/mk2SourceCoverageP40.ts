/** P40: include 20 already-exported PORTAL effect streams in source-byte accounting.
 * No additional image, runtime timing, live DAC, alpha or scene assertions.
 */
import type {Asset} from './model';
import type {SourceFileEntry} from '../filesystem/DirectorySource';
import {hash} from './model';
import {buildMK2SourceCoverageP38} from './mk2SourceCoverageP38';
import {summarizeEncodedIntervals} from './mk2SourceCoverageP37';
const PORTAL_SHA='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82';
const ORIGINALS=[
 {
  "assetId": "mk2-stage-effect:portal_swaying:00",
  "sequence": "portal_swaying",
  "ordinal": 0,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91588,
  "width": 41,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 35912,
  "endExclusive": 38112,
  "indicesSha256": "9a9e3693d918d66fbccce3aca86dc5fe5eb99d5c020f557b77ffc868353b37b1",
  "maskSha256": "21909ce120ad153097f32f67318b0bef2cdf8a8bcdffd6752d6cf4a9bbd01e6a"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:01",
  "sequence": "portal_swaying",
  "ordinal": 1,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91604,
  "width": 38,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 38112,
  "endExclusive": 40296,
  "indicesSha256": "c5e9f9e4644f628939f66c4c19bb3d383fc175523bedd6196730275ed39262f3",
  "maskSha256": "0c4103c8920f85decef15ccbcc28f29d57bc563ba7702ea24f3f30fa4d5189e7"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:02",
  "sequence": "portal_swaying",
  "ordinal": 2,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91616,
  "width": 37,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 40296,
  "endExclusive": 42480,
  "indicesSha256": "b1e399992495ca1c88d23a9c92f5f3717581e4f1983b9af12dff702d86b349fd",
  "maskSha256": "af58feb63136ff33285d1e0cb693845aefcc0284aec53a0bb5e1aa5e01bc1f99"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:03",
  "sequence": "portal_swaying",
  "ordinal": 3,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91628,
  "width": 38,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 42480,
  "endExclusive": 44672,
  "indicesSha256": "b065d9e932cbd39794afdd9f54b48d92bf88b41501e5862bce7e156eddc3e6f0",
  "maskSha256": "41acfa94d882edf039f058b421593ea7d9f9d47ae20b09d622313af6ed759baf"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:04",
  "sequence": "portal_swaying",
  "ordinal": 4,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91640,
  "width": 39,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 44672,
  "endExclusive": 46900,
  "indicesSha256": "f306e30d4384caf0e40fad55cdf4742c7892640452cbf59b1f0fb75826be280d",
  "maskSha256": "8aa6c9ab0bd6133937ce205c11b9a164883e437eff9812aab246943dbdddf20f"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:05",
  "sequence": "portal_swaying",
  "ordinal": 5,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91652,
  "width": 41,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 46900,
  "endExclusive": 49160,
  "indicesSha256": "5ab085ec93455458292a0d5c118573e30ccd528637426bb2497ce48e7b51c1d2",
  "maskSha256": "8f236cc985300568993a65185937fe86a3f0ab68c2f2bfb9edc8c50cb2acd342"
 },
 {
  "assetId": "mk2-stage-effect:portal_swaying:06",
  "sequence": "portal_swaying",
  "ordinal": 6,
  "sourcePointerObject2": 91316,
  "descriptorObject2": 91664,
  "width": 42,
  "height": 63,
  "anchor": {
   "x": 22,
   "y": 40
  },
  "start": 49160,
  "endExclusive": 51408,
  "indicesSha256": "7f282049382917a8007801dd20d9d88cc04c3713edfa00f4c438fb7f6346c9b3",
  "maskSha256": "38875163c8b4b7ef3310dd5d6798509e713084762feae4fdc36c6969c6d1efc6"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:00",
  "sequence": "portal_hanging",
  "ordinal": 0,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91676,
  "width": 14,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 51408,
  "endExclusive": 52040,
  "indicesSha256": "88c084025c537684b39b46ec76059bae511490ada9986f50f414c1ae2cdf0eb2",
  "maskSha256": "4cbd85d8565b71a2f30d877d6063189bf1a4eed7b754302d1405e826f038e8d7"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:01",
  "sequence": "portal_hanging",
  "ordinal": 1,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91692,
  "width": 14,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 52040,
  "endExclusive": 52668,
  "indicesSha256": "4cbf6dc1108c729444ab827aa64a4b7dcbac20fffc36bc0970445710912c6587",
  "maskSha256": "f03780945d7c280b73dd340ad0cf48f492274a957c842b076d0c82b881f2e619"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:02",
  "sequence": "portal_hanging",
  "ordinal": 2,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91704,
  "width": 14,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 52668,
  "endExclusive": 53304,
  "indicesSha256": "2881883f6422869244f69ee026d81023f877cdbfae4b8a54f267c440200a3baf",
  "maskSha256": "154be675c848b9b53382b24c2faad7a1f5a772387ed1cba2e93e89b9856e5ab2"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:03",
  "sequence": "portal_hanging",
  "ordinal": 3,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91716,
  "width": 13,
  "height": 23,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 53304,
  "endExclusive": 53900,
  "indicesSha256": "9787a8e61bc116dbf4b22e7fb4d90e7f93bc7b4e0617c0a062fe7aa7d70dfb47",
  "maskSha256": "26f8c173e5fe262508f040241e7adc8c10c3f9db8cf40e406f9b8f7b7a145058"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:04",
  "sequence": "portal_hanging",
  "ordinal": 4,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91728,
  "width": 14,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 53900,
  "endExclusive": 54520,
  "indicesSha256": "f558f0e09fd16c6b0810ee0e0db4f485c6c03034b06fb3ebd712c3816f65df26",
  "maskSha256": "013a1a9685b4eb7bfe61440cf72aac3d979c06199db8c03b40f29dbd115154b4"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:05",
  "sequence": "portal_hanging",
  "ordinal": 5,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91740,
  "width": 15,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 54520,
  "endExclusive": 55152,
  "indicesSha256": "61fa4a68ffcdd4a9d054ece81a4a88ad3bd3fa2acf1d2bacbd34823ec1765c3e",
  "maskSha256": "813423984e174d29490aaf1b40c7f4e9c639795ad5f2a0a26cf004f397ecea23"
 },
 {
  "assetId": "mk2-stage-effect:portal_hanging:06",
  "sequence": "portal_hanging",
  "ordinal": 6,
  "sourcePointerObject2": 91352,
  "descriptorObject2": 91752,
  "width": 15,
  "height": 24,
  "anchor": {
   "x": -10,
   "y": -13
  },
  "start": 55152,
  "endExclusive": 55780,
  "indicesSha256": "2b8c0f1f3d352e5cae0dea51de4880f864f0f4839ed82295320d7ddedadbb344",
  "maskSha256": "efece5f7af317b49fc8e5ea95716c54ba51948c95e3cc24f968065ae922d1d69"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:00",
  "sequence": "portal_electric",
  "ordinal": 0,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91764,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 55780,
  "endExclusive": 55936,
  "indicesSha256": "0f806d899a31e5eb2426ba09e03718a07fd256a2c5248551b5628067b79f858c",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:01",
  "sequence": "portal_electric",
  "ordinal": 1,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91780,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 55936,
  "endExclusive": 56124,
  "indicesSha256": "9791f1e1a7c3ad6f68f948171081a5ab7a523768c492778fc14eb115216d75e1",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:02",
  "sequence": "portal_electric",
  "ordinal": 2,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91792,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 56124,
  "endExclusive": 56316,
  "indicesSha256": "cb5943ad2de14bbfeaa4ceec553c0dc78e46845a68b809cca7f196b2dac0ae21",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:03",
  "sequence": "portal_electric",
  "ordinal": 3,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91804,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 56316,
  "endExclusive": 56544,
  "indicesSha256": "0d24fac502ac6279928ce6b030d126172ab68f41d11781604e4e1c954c0e7be1",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:04",
  "sequence": "portal_electric",
  "ordinal": 4,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91816,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 56544,
  "endExclusive": 56736,
  "indicesSha256": "718e39a84fbe24934dc0721a6276363c7e5ef4fb377a5a78b8e7d2ecab7c308d",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 },
 {
  "assetId": "mk2-stage-effect:portal_electric:05",
  "sequence": "portal_electric",
  "ordinal": 5,
  "sourcePointerObject2": 91384,
  "descriptorObject2": 91828,
  "width": 21,
  "height": 14,
  "anchor": {
   "x": 0,
   "y": 0
  },
  "start": 56736,
  "endExclusive": 56916,
  "indicesSha256": "0ddaecddb70ef78e3358ebc3f49e9dfd36a6cf96764d0197950179577d73c406",
  "maskSha256": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5"
 }
] as const;
export const MK2_P40_COVERAGE_LIMITATION='P40 includes twenty existing PORTAL effects in encoded-byte accounting. Complete resource-byte coverage does not establish a full scene, runtime palette/alpha, camera placement, activation or native timing.';
function need(ok:unknown,msg:string):asserts ok {if(!ok)throw Error('P40 PORTAL coverage: '+msg);}
export async function buildMK2SourceCoverageP40(files:SourceFileEntry[],assets:Asset[]){
 const base=await buildMK2SourceCoverageP38(files,assets);
 const portal=base.resources.find(r=>r.name==='PORTAL.GRA');
 let replacement:Record<string,unknown>,reconciliation:Record<string,unknown>;
 try{
  need(portal&&'intervals' in portal&&portal.status==='VERIFIED_INTERVAL_ACCOUNTING','P38 PORTAL accounting unavailable');
  const entries=files.filter(f=>f.name.toLowerCase()==='portal.gra');
  need(entries.length===1&&entries[0].size===92756&&portal.upstreamAuthenticatedSha256===PORTAL_SHA,'original resource binding');
  need(portal.qualifiedReferences===14&&portal.coveredBytes===71752&&portal.outsideScopeBytes===21004,'original P38 accounting changed');
  const existing=assets.filter(a=>/^mk2-stage-effect:portal_(swaying|hanging|electric):/.test(a.id));
  need(existing.length===20,'exactly twenty existing PORTAL effect assets required');
  const normalize=(s:string)=>s.replace(/\\/g,'/').toLowerCase();
  const added=[];
  for(const expected of ORIGINALS){
   const matches=existing.filter(a=>a.id===expected.assetId);
   need(matches.length===1,'unique existing effect '+expected.assetId);
   const a=matches[0],m=a.metadata,ref=normalize(a.source.path);
   need((ref===normalize(entries[0].path)||ref==='portal.gra')&&a.source.sha256===PORTAL_SHA,'original source identity');
   need(a.source.offset===expected.start&&a.source.length===expected.endExclusive-expected.start,'exact source extent');
   need(a.width===expected.width&&a.height===expected.height,'original geometry');
   need(m.stage==='portal'&&m.sequence===expected.sequence&&m.sourceFrameOrdinal===expected.ordinal,'original track provenance');
   need(m.sourcePointerObject2===expected.sourcePointerObject2&&m.descriptorObject2===expected.descriptorObject2,'original pointer/descriptor');
   need(m.sourceX===expected.anchor.x&&m.sourceY===expected.anchor.y,'original source anchor');
   need(m.animationFPSKnown===false&&m.runtimeActivationKnown===false&&m.finalScreenCoordinatesKnown===false&&m.runtimePaletteSelected===false,'native claim boundaries');
   need(m.indices instanceof Uint8Array&&m.mask instanceof Uint8Array,'indexed and paint planes');
   need(await hash(m.indices)===expected.indicesSha256&&await hash(m.mask)===expected.maskSha256,'independently qualified planes');
   added.push({assetId:a.id,start:a.source.offset,endExclusive:a.source.offset+a.source.length});
  }
  const summary=summarizeEncodedIntervals(entries[0].size,[...portal.intervals,...added]);
  need(summary.qualifiedReferences===34&&summary.coveredBytes===92756&&summary.outsideScopeBytes===0&&summary.duplicateOrOverlappingReferenceBytes===0,'no missing or overlapping native bytes');
  replacement={...portal,...summary};
  reconciliation={status:'VERIFIED',existingEffectReferences:20,newRepresentations:0,priorOutsideScopeBytes:21004,remainingOutsideScopeBytes:0,
   sourceImageInterval:{start:35912,endExclusive:56916,encodedBytes:21004},sourceListObject2:[91316,91352,91384],
   nativePaletteOrTimingClaimsAdded:false};
 }catch(e){
  const reason=e instanceof Error?e.message:String(e);
  replacement={name:'PORTAL.GRA',status:'UNAVAILABLE',reason};
  reconciliation={status:'UNAVAILABLE',existingEffectReferences:0,newRepresentations:0,reason};
 }
 const resources=base.resources.map(r=>r.name==='PORTAL.GRA'?replacement:r);
 return {...base,schema:'mkdos_p40_native_source_interval_coverage_v1',
  status:resources.some(r=>r.status==='UNAVAILABLE')?'PARTIAL':'VERIFIED_INTERVAL_ACCOUNTING',
  scope:base.scope+' P40 additionally includes twenty independently qualified existing PORTAL effect streams; TOWER effects remain outside scope.',
  limitation:MK2_P40_COVERAGE_LIMITATION,portalEffectReconciliation:reconciliation,resources};
}
