/** P37: union of explicitly qualified native stream/floor extents.
 * Source byte accounting only; gaps are outside this scope, not missing images.
 */
import type {Asset} from './model';
import type {SourceFileEntry} from '../filesystem/DirectorySource';
export const MK2_P37_COVERAGE_LIMITATION='P37 reports encoded-byte intervals from explicitly qualified native stream/floor families. Gaps are outside this report scope, not proven missing artwork. Byte coverage does not establish palette, timing, runtime alpha, setup ownership or a complete scene.';
export interface EncodedInterval {assetId:string;start:number;endExclusive:number}
export function summarizeEncodedIntervals(size:number,intervals:EncodedInterval[]){
 if(!Number.isSafeInteger(size)||size<0)throw Error('Invalid resource size');
 const sorted=intervals.map(x=>({...x})).sort((a,b)=>a.start-b.start||a.endExclusive-b.endExclusive||(a.assetId<b.assetId?-1:a.assetId>b.assetId?1:0));
 let referencedBytes=0;
 for(const x of sorted){
  if(!Number.isSafeInteger(x.start)||!Number.isSafeInteger(x.endExclusive)||x.start<0||x.endExclusive<=x.start||x.endExclusive>size)throw Error('Invalid source interval '+x.assetId);
  referencedBytes+=x.endExclusive-x.start;
  if(!Number.isSafeInteger(referencedBytes))throw Error('Reference byte total overflow');
 }
 const union:Array<{start:number;endExclusive:number}>=[];
 for(const x of sorted){const last=union[union.length-1];if(last&&x.start<=last.endExclusive)last.endExclusive=Math.max(last.endExclusive,x.endExclusive);else union.push({start:x.start,endExclusive:x.endExclusive});}
 const gaps:Array<{start:number;endExclusive:number}>=[];let previous=0,coveredBytes=0;
 for(const x of union){if(previous<x.start)gaps.push({start:previous,endExclusive:x.start});coveredBytes+=x.endExclusive-x.start;previous=x.endExclusive;}
 if(previous<size)gaps.push({start:previous,endExclusive:size});
 return {resourceBytes:size,qualifiedReferences:sorted.length,referencedBytes,coveredBytes,duplicateOrOverlappingReferenceBytes:referencedBytes-coveredBytes,
  outsideScopeBytes:size-coveredBytes,union,gaps,intervals:sorted};
}
const SPECS=[
 ['CAVE.GRA',['mk2-cave-source:']],
 ['ARMORY.GRA',['mk2-armory-source:','mk2-armory-tail-source:']],
 ['BATTLE.GRA',['mk2-battle-source:']],
 ['ARENA.GRA',['mk2-arena-source:','mk2-arena-tail-source:']],
 ['TOMB.GRA',['mk2-tomb-source:']],
 ['PORTAL.GRA',['mk2-portal-source:']],
 ['TOWER.GRA',['mk2-tower-source:']],
 ['FOREST.GRA',['mk2-forest-source:','mk2-forest-tail-source:']],
 ['PIT.GRA',['mk2-pit-source:','mk2-pit-bridge:']],
 ['VFRAME.GRA',[]],['FONTS.GRA',[]],['PLAYSTA.GRA',[]],['PROBE.GRA',[]],['ACCLAIM.GRA',[]],['MONKS.GRA',[]],
] as const;
const normalized=(s:string)=>s.replace(/\\/g,'/').toLowerCase();
export function buildMK2SourceCoverageP37(files:SourceFileEntry[],assets:Asset[]){
 const resources=SPECS.map(([name,prefixes])=>{
  const matches=files.filter(f=>f.name.toUpperCase()===name);
  const registered=assets.filter(a=>normalized(a.source.path).split('/').pop()===name.toLowerCase());
  if(matches.length!==1)return {name,status:'UNAVAILABLE',registeredRepresentations:registered.length,reason:matches.length?'Ambiguous source basename':'Missing source'};
  const file=matches[0],stage=name.slice(0,-4).toLowerCase();
  const candidates=assets.filter(a=>prefixes.some(p=>a.id.startsWith(p))||a.id===`mk2-floor:${stage}:indices`);
  try{
   const hashes=new Set<string>();
   const intervals=candidates.map(a=>{
    const ref=normalized(a.source.path),bound=ref===normalized(file.path)||ref===name.toLowerCase();
    if(!bound||!a.source.sha256||!/^([a-f0-9]{64})$/.test(a.source.sha256))throw Error('Qualified source binding mismatch '+a.id);
    hashes.add(a.source.sha256);
    return {assetId:a.id,start:a.source.offset,endExclusive:a.source.offset+a.source.length};
   });
   if(hashes.size>1)throw Error('Conflicting authenticated source hashes');
   const summary=summarizeEncodedIntervals(file.size,intervals);
   return {name,path:file.path,status:intervals.length?'VERIFIED_INTERVAL_ACCOUNTING':'NO_QUALIFIED_INTERVALS_IN_SCOPE',
    registeredRepresentations:registered.length,upstreamAuthenticatedSha256:[...hashes][0]??null,...summary};
  }catch(e){return {name,path:file.path,status:'UNAVAILABLE',registeredRepresentations:registered.length,reason:e instanceof Error?e.message:String(e)};}
 });
 return {schema:'mkdos_p37_native_source_interval_coverage_v1',status:resources.some(r=>r.status==='UNAVAILABLE')?'PARTIAL':'VERIFIED_INTERVAL_ACCOUNTING',
  scope:'P22-P35 standalone native indexed streams, P10 bridge streams, and one authenticated native raw floor per resource; all other representations excluded from the union. Basename-only legacy references bind only when the input basename is unique.',
  limitation:MK2_P37_COVERAGE_LIMITATION,originalDataIncluded:false,sceneCompletenessClaimed:false,resources};
}

