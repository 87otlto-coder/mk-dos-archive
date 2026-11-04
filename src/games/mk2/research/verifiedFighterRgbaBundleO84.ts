/** MK2 six-fixture verified fighter-resource RGBA integration bundle — Pass 1E.3O.84. */
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK2JC0PaletteContextRgbaFixturesResult } from './jc0PaletteContextRgbaFixtures';
import { MK2HH0PaletteContextRgbaFixturesResult } from './hh0PaletteContextRgbaFixtures';
import { MK2LK0PaletteContextRgbaFixturesResult } from './lk0PaletteContextRgbaFixtures';
import { MK2BA0PaletteContextRgbaFixturesResult } from './ba0PaletteContextRgbaFixtures';
import { MK2FN4PaletteContextRgbaFixturesResult } from './fn4PaletteContextRgbaFixtures';
import { MK2FN6PaletteContextRgbaFixturesResult } from './fn6PaletteContextRgbaFixtures';

const encoder=new TextEncoder();
async function sha256(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

const EXPECTED={
 hh0:{slot:0,resource:'HH0.GRA',zipSha:'1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2',pngs:72,entries:77},
 lk0:{slot:1,resource:'LK0.GRA',zipSha:'04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836',pngs:72,entries:77},
 jc0:{slot:2,resource:'JC0.GRA',zipSha:'d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7',pngs:70,entries:75},
 ba0:{slot:3,resource:'BA0.GRA',zipSha:'8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133',pngs:88,entries:93},
 fn4:{slot:4,resource:'FN4.GRA',zipSha:'f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726',pngs:54,entries:59},
 fn6:{slot:5,resource:'FN6.GRA',zipSha:'68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3',pngs:92,entries:97},
} as const;

export interface MK2VerifiedFighterRgbaBundleO84Report{
 format:'mk2_verified_fighter_rgba_bundle_o84_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'verified-prerequisite-packages';synthetic:false;exeSha256:string};
 fixtures:Array<{identitySlot:number;resourceName:string;fixturePass:'O74'|'O76'|'O77'|'O79'|'O81'|'O83';fixtureVerdict:string;nestedPackagePath:string;nestedPackageSha256:string;nestedPackageByteLength:number;nestedEntryCount:number;pngCount:number;paletteSemanticContexts:['DEFAULT_CHARACTER_PALETTE','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE'];scope:string}>;
 package:{downloadFileName:'MK2_O84_VERIFIED_FIGHTER_RGBA_BUNDLE.zip';outerEntryCount:8;nestedPackageCount:6;nestedLogicalEntryCount:478;totalPngCount:448;byteLength:number;sha256:string;zipEncoding:'ZIP_STORE_ONLY'};
 decision:{sixIndependentFixtureContractsIntegrated:true;newPaletteOwnershipPromoted:false;siblingResourceOwnershipPromoted:false;humanFighterNamesPromoted:false;mk1AssumptionsImported:false;verdict:'MK2_SIX_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}
export interface MK2VerifiedFighterRgbaBundleO84Result{report:MK2VerifiedFighterRgbaBundleO84Report;zipBytes:Uint8Array;}

export async function executeMK2VerifiedFighterRgbaBundleO84(o74:MK2JC0PaletteContextRgbaFixturesResult,o76:MK2HH0PaletteContextRgbaFixturesResult,o77:MK2LK0PaletteContextRgbaFixturesResult,o79:MK2BA0PaletteContextRgbaFixturesResult,o81:MK2FN4PaletteContextRgbaFixturesResult,o83:MK2FN6PaletteContextRgbaFixturesResult):Promise<MK2VerifiedFighterRgbaBundleO84Result>{
 for(const x of [o74.report,o76.report,o77.report,o79.report,o81.report,o83.report])if(x.status!=='SUCCESS'||!x.validation.allChecksPassed)throw new Error('O84 requires verified O74/O76/O77/O79/O81/O83 prerequisites');
 const exeSha=o74.report.provenance.exeSha256;if([o76.report.provenance.exeSha256,o77.report.provenance.exeSha256,o79.report.provenance.exeSha256,o81.report.provenance.exeSha256,o83.report.provenance.exeSha256].some(x=>x!==exeSha))throw new Error('O84 prerequisite executable identity mismatch');
 const rows=[
  {k:'hh0' as const,pass:'O76' as const,r:o76.report,z:o76.zipBytes,path:'packages/slot_00_HH0_RGBA.zip',scope:'HH0_ONLY_NOT_WHOLE_HH_FAMILY'},
  {k:'lk0' as const,pass:'O77' as const,r:o77.report,z:o77.zipBytes,path:'packages/slot_01_LK0_RGBA.zip',scope:'LK0_ONLY_NOT_WHOLE_LK_FAMILY'},
  {k:'jc0' as const,pass:'O74' as const,r:o74.report,z:o74.zipBytes,path:'packages/slot_02_JC0_RGBA.zip',scope:'JC0_ONLY'},
  {k:'ba0' as const,pass:'O79' as const,r:o79.report,z:o79.zipBytes,path:'packages/slot_03_BA0_RGBA.zip',scope:'BA0_ONLY_NOT_WHOLE_BA_FAMILY'},
  {k:'fn4' as const,pass:'O81' as const,r:o81.report,z:o81.zipBytes,path:'packages/slot_04_FN4_RGBA.zip',scope:'FN4_ONLY_NOT_WHOLE_FN_FAMILY'},
  {k:'fn6' as const,pass:'O83' as const,r:o83.report,z:o83.zipBytes,path:'packages/slot_05_FN6_RGBA.zip',scope:'FN6_ONLY_NOT_WHOLE_FN_FAMILY'},
 ];
 const fixtures:MK2VerifiedFighterRgbaBundleO84Report['fixtures']=[];
 for(const row of rows){const e=EXPECTED[row.k],h=await sha256(row.z);if(h!==e.zipSha||row.r.package.sha256!==e.zipSha||row.r.package.pngEntryCount!==e.pngs)throw new Error(`O84 prerequisite package identity mismatch ${row.k}`);fixtures.push({identitySlot:e.slot,resourceName:e.resource,fixturePass:row.pass,fixtureVerdict:row.r.decision.verdict,nestedPackagePath:row.path,nestedPackageSha256:h,nestedPackageByteLength:row.z.length,nestedEntryCount:e.entries,pngCount:e.pngs,paletteSemanticContexts:['DEFAULT_CHARACTER_PALETTE','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE'],scope:row.scope});}
 const stableManifest={format:'mk2_o84_verified_fighter_rgba_manifest_v1',exeSha256:exeSha,fixtureCount:6,totalPngCount:448,nestedLogicalEntryCount:478,fixtures,boundaries:{newPaletteOwnershipPromoted:false,siblingResourceOwnershipPromoted:false,humanFighterNamesPromoted:false,playerNumberLabelsPromoted:false,mode4MeaningPromoted:false,mk1AssumptionsImported:false}};
 const readme=`# MK2 O84 verified fighter-resource RGBA bundle\n\nThis archive integrates exactly six already independently verified MK2 fighter-resource fixture packages: HH0.GRA (identity slot 0), LK0.GRA (identity slot 1), JC0.GRA (identity slot 2), BA0.GRA (identity slot 3), FN4.GRA (identity slot 4), and FN6.GRA (identity slot 5). It does not recompute or strengthen palette ownership. Each nested ZIP is preserved byte-for-byte at its accepted deterministic SHA-256. Default and same-character duplicate-override meanings come from O75. No sibling resources, whole resource families, human fighter names, Player 1/Player 2 labels, mode-4 meaning, or MK1-derived assumptions are promoted by O84.\n`;
 const files=[...rows.map(x=>({name:x.path,bytes:x.z})),{name:'manifest/verified_fighter_resources.json',bytes:encoder.encode(JSON.stringify(stableManifest,null,2))},{name:'README.md',bytes:encoder.encode(readme)}].sort((a,b)=>a.name.localeCompare(b.name));
 const zipBytes=buildStoredZip(files),zipSha=await sha256(zipBytes);
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,p:boolean,d:string)=>checks.push({id,passed:p,detail:d});
 ck('fixture_count',fixtures.length===6,String(fixtures.length));
 ck('slot_set',fixtures.map(x=>x.identitySlot).join(',')==='0,1,2,3,4,5',fixtures.map(x=>x.identitySlot).join(','));
 ck('resource_set',fixtures.map(x=>x.resourceName).join(',')==='HH0.GRA,LK0.GRA,JC0.GRA,BA0.GRA,FN4.GRA,FN6.GRA',fixtures.map(x=>x.resourceName).join(','));
 ck('accepted_nested_hashes',fixtures.every(x=>{const k=x.resourceName==='HH0.GRA'?'hh0':x.resourceName==='LK0.GRA'?'lk0':x.resourceName==='JC0.GRA'?'jc0':x.resourceName==='BA0.GRA'?'ba0':x.resourceName==='FN4.GRA'?'fn4':'fn6';return x.nestedPackageSha256===EXPECTED[k].zipSha;}),'all six accepted hashes');
 ck('total_pngs',fixtures.reduce((n,x)=>n+x.pngCount,0)===448,'72+72+70+88+54+92=448');
 ck('nested_logical_entries',fixtures.reduce((n,x)=>n+x.nestedEntryCount,0)===478,'77+77+75+93+59+97=478');
 ck('outer_entries',files.length===8,String(files.length));
 ck('no_semantic_promotion',stableManifest.boundaries.newPaletteOwnershipPromoted===false&&stableManifest.boundaries.siblingResourceOwnershipPromoted===false&&stableManifest.boundaries.humanFighterNamesPromoted===false,'all integration-only boundaries false');
 const failed=checks.filter(x=>!x.passed);if(failed.length)throw new Error(`O84 validation failed: ${failed.map(x=>x.id).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_verified_fighter_rgba_bundle_o84');
 const report:MK2VerifiedFighterRgbaBundleO84Report={format:'mk2_verified_fighter_rgba_bundle_o84_v1',timestamp,operationId,provenance:{sourceKind:'verified-prerequisite-packages',synthetic:false,exeSha256:exeSha},fixtures,package:{downloadFileName:'MK2_O84_VERIFIED_FIGHTER_RGBA_BUNDLE.zip',outerEntryCount:8,nestedPackageCount:6,nestedLogicalEntryCount:478,totalPngCount:448,byteLength:zipBytes.length,sha256:zipSha,zipEncoding:'ZIP_STORE_ONLY'},decision:{sixIndependentFixtureContractsIntegrated:true,newPaletteOwnershipPromoted:false,siblingResourceOwnershipPromoted:false,humanFighterNamesPromoted:false,mk1AssumptionsImported:false,verdict:'MK2_SIX_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION',narrative:'O84 integrates the exact deterministic O74 JC0, O76 HH0, O77 LK0, O79 BA0, O81 FN4, and O83 FN6 correct-colour fixture packages under one browser-downloadable outer archive. The nested package bytes and hashes are preserved exactly. O84 adds distribution/provenance only: it does not extend palette ownership to sibling resources, whole families, new identity slots beyond the six proven fixtures, or human fighter names.'},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return {report,zipBytes};
}
export function createMK2VerifiedFighterRgbaBundleO84Export(r:MK2VerifiedFighterRgbaBundleO84Result){if(r.report.status!=='SUCCESS'||!r.report.validation.allChecksPassed)throw new Error('O84 verified report required');return r.report;}
