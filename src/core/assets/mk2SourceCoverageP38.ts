/** P38: add only independently qualified, already-exported TOMB effects to byte accounting. */
import type {Asset} from './model';
import {hash} from './model';
import type {SourceFileEntry} from '../filesystem/DirectorySource';
import {buildMK2SourceCoverageP37,summarizeEncodedIntervals} from './mk2SourceCoverageP37';
const TOMB_SHA='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613';
const ORIGINALS=[
{"assetId":"mk2-stage-effect:tomb_flying_a:00","sequence":"tomb_flying_a","ordinal":0,"sourcePointerObject2":96276,"descriptorObject2":96108,"width":41,"height":25,"anchor":{"x":-3,"y":7},"start":60124,"endExclusive":60520,"indicesSha256":"21c3f33497e61f0da814d3421b6ff39d73dc5997c177c827ff74d4b20eb632fc","maskSha256":"d7d125db08ca6c61e1d7a4f7a6ca34bfa7d7ed13ea98719c86f0e8928d4a3a0e"},
{"assetId":"mk2-stage-effect:tomb_flying_a:01","sequence":"tomb_flying_a","ordinal":1,"sourcePointerObject2":96276,"descriptorObject2":96124,"width":41,"height":25,"anchor":{"x":-3,"y":8},"start":60520,"endExclusive":60984,"indicesSha256":"39d2c5e3965d15ba5dcc4652238c243fbf6fa9bec36f65ed2a1e0b16d70a051b","maskSha256":"276228a17cdef5e8bab9d6873e14dc190b35134e3d3a08988eb4e232f5c04c08"},
{"assetId":"mk2-stage-effect:tomb_flying_a:02","sequence":"tomb_flying_a","ordinal":2,"sourcePointerObject2":96276,"descriptorObject2":96136,"width":41,"height":25,"anchor":{"x":-4,"y":11},"start":60984,"endExclusive":61476,"indicesSha256":"a8947f202d1d3c71461f6851c29b406ce243c2fa0e2e3aeedce258c1fbd9b3d9","maskSha256":"17059fcb24076bcece2c4571c6c60db3ad4f0520fac32aba2812fddb6d4a2ee6"},
{"assetId":"mk2-stage-effect:tomb_flying_a:03","sequence":"tomb_flying_a","ordinal":3,"sourcePointerObject2":96276,"descriptorObject2":96148,"width":41,"height":25,"anchor":{"x":-6,"y":13},"start":61476,"endExclusive":61952,"indicesSha256":"58cf800707007f026788aefb8eb24a1fdc6803d52eed6eb245c7ae27a8fe19d2","maskSha256":"1e218c072274954d82801ab988c2a11c5c84d121794a1c38d86d286d18dc1674"},
{"assetId":"mk2-stage-effect:tomb_flying_a:04","sequence":"tomb_flying_a","ordinal":4,"sourcePointerObject2":96276,"descriptorObject2":96160,"width":41,"height":25,"anchor":{"x":-6,"y":15},"start":61952,"endExclusive":62392,"indicesSha256":"5991ab8f18b56a7030529fc4cbbaf135378e330c0b101c81fd4119ba3e2e3ee4","maskSha256":"637ccda431c762438724249fd02604f89aba0e9a52e611b74f5d3752d913daa9"},
{"assetId":"mk2-stage-effect:tomb_flying_a:05","sequence":"tomb_flying_a","ordinal":5,"sourcePointerObject2":96276,"descriptorObject2":96172,"width":41,"height":25,"anchor":{"x":-8,"y":19},"start":62392,"endExclusive":62880,"indicesSha256":"4dd5f6d89505a9501e97ce09c7ec69611c76e7ce8332be2ab6f905e317d2b51f","maskSha256":"83d37a555d66fcd369ce7558ea911d5cf1464cdf89b9b34a188186e27391b06a"},
{"assetId":"mk2-stage-effect:tomb_flying_a:06","sequence":"tomb_flying_a","ordinal":6,"sourcePointerObject2":96276,"descriptorObject2":96184,"width":41,"height":25,"anchor":{"x":-9,"y":14},"start":62880,"endExclusive":63380,"indicesSha256":"42d7630a5db0f463099a222cde137172f5e66a41a959b186c04c61eff7652b44","maskSha256":"bf3713d43137172023f3901ba04afdb77104b9ccf837183dc020ae23e6b7eb89"},
{"assetId":"mk2-stage-effect:tomb_flying_a:07","sequence":"tomb_flying_a","ordinal":7,"sourcePointerObject2":96276,"descriptorObject2":96196,"width":41,"height":25,"anchor":{"x":-6,"y":6},"start":63380,"endExclusive":63776,"indicesSha256":"6c5f600d25feb3d6c98812471f5a866f8737042c2b9f7eda24f2ba95ca7fd3fb","maskSha256":"0e87f8a3e6057e882bf76b0fe0ff17b03754c063a4e50fe6b6f6652b72f355be"},
{"assetId":"mk2-stage-effect:tomb_flying_b:00","sequence":"tomb_flying_b","ordinal":0,"sourcePointerObject2":96236,"descriptorObject2":96008,"width":49,"height":25,"anchor":{"x":-3,"y":11},"start":54328,"endExclusive":54888,"indicesSha256":"934fc27ece48517094f8c49554a8e1f149983d6cca1a6db49430c6b983fddf62","maskSha256":"1287dee7e1d4963e03e5d8659252ad60e4af2af3a06094fef99e5530f95f42ce"},
{"assetId":"mk2-stage-effect:tomb_flying_b:01","sequence":"tomb_flying_b","ordinal":1,"sourcePointerObject2":96236,"descriptorObject2":96024,"width":49,"height":25,"anchor":{"x":-3,"y":11},"start":54888,"endExclusive":55600,"indicesSha256":"c791ada5ab6cdc600c64c4e983e18dbf422aaeb416778cf8d7291b840d08e642","maskSha256":"7560877c0c0319df1dc25761a6d94a5fe8fa54e39aa4d1780070ca565eeaa883"},
{"assetId":"mk2-stage-effect:tomb_flying_b:02","sequence":"tomb_flying_b","ordinal":2,"sourcePointerObject2":96236,"descriptorObject2":96036,"width":49,"height":25,"anchor":{"x":-5,"y":15},"start":55600,"endExclusive":56388,"indicesSha256":"0b429b7e5572e691af83006301c0bb19e089ae17b8ae484149fd45f0b791d9e8","maskSha256":"3c43e2210800b24d2ee71d9d479256f3e5b230557b53d7f79457f5fa22846730"},
{"assetId":"mk2-stage-effect:tomb_flying_b:03","sequence":"tomb_flying_b","ordinal":3,"sourcePointerObject2":96236,"descriptorObject2":96048,"width":49,"height":25,"anchor":{"x":-6,"y":18},"start":56388,"endExclusive":57260,"indicesSha256":"a63656615f52eee868224bfd6d083bb094e8212a9c8925a26bc0da948beb2ec7","maskSha256":"a51e505c213f2286cce0cae4acfc5168703bcc5695a3853f22e3c4c92fa81c5e"},
{"assetId":"mk2-stage-effect:tomb_flying_b:04","sequence":"tomb_flying_b","ordinal":4,"sourcePointerObject2":96236,"descriptorObject2":96060,"width":49,"height":25,"anchor":{"x":-7,"y":22},"start":57260,"endExclusive":57920,"indicesSha256":"4d0f0e1814583a94f30698426bebb93f8a46ec97c4c510d47c6e0c296b5cdb43","maskSha256":"b75338294104caa212d3a100b0061710f1063d25abd9408aa8149dcffb13fac9"},
{"assetId":"mk2-stage-effect:tomb_flying_b:05","sequence":"tomb_flying_b","ordinal":5,"sourcePointerObject2":96236,"descriptorObject2":96072,"width":49,"height":25,"anchor":{"x":-8,"y":28},"start":57920,"endExclusive":58708,"indicesSha256":"c6dd765187cca01500653fd87453e20402fb8240d0ae86c47f92c8387cd6cbdd","maskSha256":"816a5976962a28b6d9a85978c4d5b1869d2bda422354a05a516c5c18009bdd9c"},
{"assetId":"mk2-stage-effect:tomb_flying_b:06","sequence":"tomb_flying_b","ordinal":6,"sourcePointerObject2":96236,"descriptorObject2":96084,"width":49,"height":25,"anchor":{"x":-7,"y":22},"start":58708,"endExclusive":59496,"indicesSha256":"4300f95e639c5b01227db04a486a633c1e2f9e0d980d85710d6916143a72c785","maskSha256":"c80b875ded3708bea1c320794cd5aecf99388317b385f0eaff13b40b55374139"},
{"assetId":"mk2-stage-effect:tomb_flying_b:07","sequence":"tomb_flying_b","ordinal":7,"sourcePointerObject2":96236,"descriptorObject2":96096,"width":49,"height":25,"anchor":{"x":-5,"y":8},"start":59496,"endExclusive":60124,"indicesSha256":"2445b00c9539f2a2e6236f1b9492a84da6231c474ad77eb85640ff01b205d3a6","maskSha256":"4ecc0b47bde983fb22b579068232228411df0ccffaf1514734ff57b9878c6e70"}
] as const;
export const MK2_P38_COVERAGE_LIMITATION='P38 includes sixteen existing TOMB effect streams in source-byte accounting. Complete byte coverage does not prove a complete scene, runtime alpha, palette ownership or timing. Other gaps remain outside the selected report scope.';
function need(ok:unknown,detail:string):asserts ok{if(!ok)throw Error('P38 TOMB coverage: '+detail);}
export async function buildMK2SourceCoverageP38(files:SourceFileEntry[],assets:Asset[]){
 const base=buildMK2SourceCoverageP37(files,assets);
 const tomb=base.resources.find(r=>r.name==='TOMB.GRA');
 let replacement:Record<string,unknown>,reconciliation:Record<string,unknown>;
 try{
  need(tomb&&'intervals' in tomb&&tomb.status==='VERIFIED_INTERVAL_ACCOUNTING','P37 TOMB interval accounting unavailable');
  const entries=files.filter(f=>f.name.toLowerCase()==='tomb.gra');
  need(entries.length===1&&entries[0].size===106784&&tomb.upstreamAuthenticatedSha256===TOMB_SHA,'original resource binding');
  const normalize=(s:string)=>s.replace(/\\/g,'/').toLowerCase();
  const selected=assets.filter(a=>/^mk2-stage-effect:tomb_flying_[ab]:/.test(a.id));
  need(selected.length===16,'exactly sixteen existing effect records required');
  const added=[];
  for(const expected of ORIGINALS){
   const matches=selected.filter(a=>a.id===expected.assetId);need(matches.length===1,'unique effect '+expected.assetId);
   const a=matches[0],m=a.metadata,ref=normalize(a.source.path);
   need((ref===normalize(entries[0].path)||ref==='tomb.gra')&&a.source.sha256===TOMB_SHA,'authenticated source reference');
   need(a.source.offset===expected.start&&a.source.length===expected.endExclusive-expected.start,'original source extent');
   need(a.width===expected.width&&a.height===expected.height,'original geometry');
   need(m.stage==='tomb'&&m.sequence===expected.sequence&&m.sourceFrameOrdinal===expected.ordinal,'original sequence provenance');
   need(m.sourcePointerObject2===expected.sourcePointerObject2&&m.descriptorObject2===expected.descriptorObject2,'original pointer/descriptor');
   need(m.sourceX===expected.anchor.x&&m.sourceY===expected.anchor.y,'original descriptor anchors');
   need(m.animationFPSKnown===false&&m.runtimeActivationKnown===false&&m.finalScreenCoordinatesKnown===false&&m.runtimePaletteSelected===false,'qualification flags');
   need(m.indices instanceof Uint8Array&&m.mask instanceof Uint8Array,'native planes');
   need(await hash(m.indices)===expected.indicesSha256&&await hash(m.mask)===expected.maskSha256,'independent native plane hashes');
   added.push({assetId:a.id,start:a.source.offset,endExclusive:a.source.offset+a.source.length});
  }
  const summary=summarizeEncodedIntervals(entries[0].size,[...tomb.intervals,...added]);
  need(summary.qualifiedReferences===33&&summary.coveredBytes===106784&&summary.outsideScopeBytes===0&&summary.duplicateOrOverlappingReferenceBytes===0,'exact native byte partition');
  replacement={...tomb,...summary};
  reconciliation={status:'VERIFIED',existingEffectReferences:16,newRepresentations:0,priorOutsideScopeBytes:9448,remainingOutsideScopeBytes:0,
   sourceImageInterval:{start:54328,endExclusive:63776,encodedBytes:9448},sourceListObject2:[0x17814,0x177ec],
   nativePaletteOrTimingClaimsAdded:false};
 }catch(e){
  replacement={name:'TOMB.GRA',status:'UNAVAILABLE',reason:e instanceof Error?e.message:String(e)};
  reconciliation={status:'UNAVAILABLE',existingEffectReferences:0,newRepresentations:0,reason:replacement.reason};
 }
 const resources=base.resources.map(r=>r.name==='TOMB.GRA'?replacement:r);
 return {...base,schema:'mkdos_p38_native_source_interval_coverage_v1',status:resources.some(r=>r.status==='UNAVAILABLE')?'PARTIAL':'VERIFIED_INTERVAL_ACCOUNTING',
  scope:base.scope+' P38 additionally includes sixteen authenticated, independently qualified existing TOMB effect streams; PORTAL/TOWER effects remain excluded.',
  limitation:MK2_P38_COVERAGE_LIMITATION,tombEffectReconciliation:reconciliation,resources};
}
