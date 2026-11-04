/** MK2 eight-contract verified identity/resource RGBA integration bundle — Pass 1E.3O.88. */
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK2JC0PaletteContextRgbaFixturesResult } from './jc0PaletteContextRgbaFixtures';
import { MK2HH0PaletteContextRgbaFixturesResult } from './hh0PaletteContextRgbaFixtures';
import { MK2LK0PaletteContextRgbaFixturesResult } from './lk0PaletteContextRgbaFixtures';
import { MK2BA0PaletteContextRgbaFixturesResult } from './ba0PaletteContextRgbaFixtures';
import { MK2FN4PaletteContextRgbaFixturesResult } from './fn4PaletteContextRgbaFixtures';
import { MK2FN6PaletteContextRgbaFixturesResult } from './fn6PaletteContextRgbaFixtures';
import { MK2FN4Slot16PaletteContextRgbaFixturesResult } from './fn4Slot16PaletteContextRgbaFixtures';
import { MK2NJ7PaletteContextRgbaFixturesResult } from './nj7Slot8PaletteContextRgbaFixtures';

const encoder=new TextEncoder();
async function sha256(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

const EXPECTED={
 hh0:{slot:0,resource:'HH0.GRA',zipSha:'1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2',pngs:72,entries:77},
 lk0:{slot:1,resource:'LK0.GRA',zipSha:'04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836',pngs:72,entries:77},
 jc0:{slot:2,resource:'JC0.GRA',zipSha:'d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7',pngs:70,entries:75},
 ba0:{slot:3,resource:'BA0.GRA',zipSha:'8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133',pngs:88,entries:93},
 fn4:{slot:4,resource:'FN4.GRA',zipSha:'f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726',pngs:54,entries:59},
 fn6:{slot:5,resource:'FN6.GRA',zipSha:'68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3',pngs:92,entries:97},
 nj7slot8:{slot:8,resource:'NJ7.GRA',zipSha:'b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd',pngs:232,entries:237},
 fn4slot16:{slot:16,resource:'FN4.GRA',zipSha:'f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff',pngs:54,entries:59},
} as const;

export interface MK2VerifiedFighterRgbaBundleO88Report{
 format:'mk2_verified_identity_resource_rgba_bundle_o88_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'verified-prerequisite-packages';synthetic:false;exeSha256:string};
 fixtures:Array<{identitySlot:number;resourceName:string;fixturePass:'O74'|'O76'|'O77'|'O79'|'O81'|'O83'|'O85'|'O87';fixtureVerdict:string;nestedPackagePath:string;nestedPackageSha256:string;nestedPackageByteLength:number;nestedEntryCount:number;pngCount:number;paletteSemanticContexts:['DEFAULT_CHARACTER_PALETTE','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE'];scope:string}>;
 package:{downloadFileName:'MK2_O88_VERIFIED_IDENTITY_RESOURCE_RGBA_BUNDLE.zip';outerEntryCount:10;nestedPackageCount:8;nestedLogicalEntryCount:774;totalPngCount:734;byteLength:number;sha256:string;zipEncoding:'ZIP_STORE_ONLY'};
 decision:{eightIndependentIdentityResourceContractsIntegrated:true;newPaletteOwnershipPromoted:false;siblingResourceOwnershipPromoted:false;canonicalGeometryPromoted:false;humanFighterNamesPromoted:false;mk1AssumptionsImported:false;verdict:'MK2_EIGHT_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}
export interface MK2VerifiedFighterRgbaBundleO88Result{report:MK2VerifiedFighterRgbaBundleO88Report;zipBytes:Uint8Array;}

export async function executeMK2VerifiedFighterRgbaBundleO88(o74:MK2JC0PaletteContextRgbaFixturesResult,o76:MK2HH0PaletteContextRgbaFixturesResult,o77:MK2LK0PaletteContextRgbaFixturesResult,o79:MK2BA0PaletteContextRgbaFixturesResult,o81:MK2FN4PaletteContextRgbaFixturesResult,o83:MK2FN6PaletteContextRgbaFixturesResult,o85:MK2FN4Slot16PaletteContextRgbaFixturesResult,o87:MK2NJ7PaletteContextRgbaFixturesResult):Promise<MK2VerifiedFighterRgbaBundleO88Result>{
 for(const x of [o74.report,o76.report,o77.report,o79.report,o81.report,o83.report,o85.report,o87.report])if(x.status!=='SUCCESS'||!x.validation.allChecksPassed)throw new Error('O88 requires verified O74/O76/O77/O79/O81/O83/O85/O87 prerequisites');
 const exeSha=o74.report.provenance.exeSha256;if([o76.report.provenance.exeSha256,o77.report.provenance.exeSha256,o79.report.provenance.exeSha256,o81.report.provenance.exeSha256,o83.report.provenance.exeSha256,o85.report.provenance.exeSha256,o87.report.provenance.exeSha256].some(x=>x!==exeSha))throw new Error('O88 prerequisite executable identity mismatch');
 const rows=[
  {k:'hh0' as const,pass:'O76' as const,r:o76.report,z:o76.zipBytes,path:'packages/slot_00_HH0_RGBA.zip',scope:'HH0_ONLY_NOT_WHOLE_HH_FAMILY'},
  {k:'lk0' as const,pass:'O77' as const,r:o77.report,z:o77.zipBytes,path:'packages/slot_01_LK0_RGBA.zip',scope:'LK0_ONLY_NOT_WHOLE_LK_FAMILY'},
  {k:'jc0' as const,pass:'O74' as const,r:o74.report,z:o74.zipBytes,path:'packages/slot_02_JC0_RGBA.zip',scope:'JC0_ONLY'},
  {k:'ba0' as const,pass:'O79' as const,r:o79.report,z:o79.zipBytes,path:'packages/slot_03_BA0_RGBA.zip',scope:'BA0_ONLY_NOT_WHOLE_BA_FAMILY'},
  {k:'fn4' as const,pass:'O81' as const,r:o81.report,z:o81.zipBytes,path:'packages/slot_04_FN4_RGBA.zip',scope:'FN4_ONLY_NOT_WHOLE_FN_FAMILY'},
  {k:'fn6' as const,pass:'O83' as const,r:o83.report,z:o83.zipBytes,path:'packages/slot_05_FN6_RGBA.zip',scope:'FN6_ONLY_NOT_WHOLE_FN_FAMILY'},
  {k:'nj7slot8' as const,pass:'O87' as const,r:o87.report,z:o87.zipBytes,path:'packages/slot_08_NJ7_RGBA.zip',scope:'NJ7_SLOT8_ONLY_NOT_WHOLE_NJ_FAMILY'},
  {k:'fn4slot16' as const,pass:'O85' as const,r:o85.report,z:o85.zipBytes,path:'packages/slot_16_FN4_RGBA.zip',scope:'FN4_SLOT16_ONLY_NOT_WHOLE_FN_FAMILY'},
 ];
 const fixtures:MK2VerifiedFighterRgbaBundleO88Report['fixtures']=[];
 for(const row of rows){const e=EXPECTED[row.k],h=await sha256(row.z);if(h!==e.zipSha||row.r.package.sha256!==e.zipSha||row.r.package.pngEntryCount!==e.pngs)throw new Error(`O88 prerequisite package identity mismatch ${row.k}`);fixtures.push({identitySlot:e.slot,resourceName:e.resource,fixturePass:row.pass,fixtureVerdict:row.r.decision.verdict,nestedPackagePath:row.path,nestedPackageSha256:h,nestedPackageByteLength:row.z.length,nestedEntryCount:e.entries,pngCount:e.pngs,paletteSemanticContexts:['DEFAULT_CHARACTER_PALETTE','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE'],scope:row.scope});}
 const stableManifest={format:'mk2_o88_verified_identity_resource_rgba_manifest_v1',exeSha256:exeSha,fixtureCount:8,totalPngCount:734,nestedLogicalEntryCount:774,fixtures,boundaries:{newPaletteOwnershipPromoted:false,siblingResourceOwnershipPromoted:false,canonicalGeometryPromoted:false,humanFighterNamesPromoted:false,playerNumberLabelsPromoted:false,mode4MeaningPromoted:false,mk1AssumptionsImported:false}};
 const readme=`# MK2 O88 verified identity/resource RGBA bundle\n\nThis archive integrates exactly eight already independently verified MK2 identity/resource fixture contracts: HH0.GRA (slot 0), LK0.GRA (slot 1), JC0.GRA (slot 2), BA0.GRA (slot 3), FN4.GRA (slot 4), FN6.GRA (slot 5), one connected NJ7.GRA contract under slot 8, and FN4.GRA again under the separately proven slot-16 palette contract. It does not recompute or strengthen palette/resource ownership. Each nested ZIP is preserved byte-for-byte at its accepted deterministic SHA-256. O87 explicitly does not establish NJ7 as the complete or canonical slot-8 geometry because the slot-8 root graph has additional NJ-family branches. No sibling resources, whole resource families, human fighter names, Player 1/Player 2 labels, mode-4 meaning, canonical-geometry designation, or MK1-derived assumptions are promoted by O88.\n`;
 const files=[...rows.map(x=>({name:x.path,bytes:x.z})),{name:'manifest/verified_identity_resources.json',bytes:encoder.encode(JSON.stringify(stableManifest,null,2))},{name:'README.md',bytes:encoder.encode(readme)}].sort((a,b)=>a.name.localeCompare(b.name));
 const zipBytes=buildStoredZip(files),zipSha=await sha256(zipBytes);
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,p:boolean,d:string)=>checks.push({id,passed:p,detail:d});
 ck('fixture_count',fixtures.length===8,String(fixtures.length));
 ck('slot_set',fixtures.map(x=>x.identitySlot).join(',')==='0,1,2,3,4,5,8,16',fixtures.map(x=>x.identitySlot).join(','));
 ck('resource_set',fixtures.map(x=>x.resourceName).join(',')==='HH0.GRA,LK0.GRA,JC0.GRA,BA0.GRA,FN4.GRA,FN6.GRA,NJ7.GRA,FN4.GRA',fixtures.map(x=>x.resourceName).join(','));
 ck('accepted_nested_hashes',fixtures.every(x=>{const k=x.identitySlot===16?'fn4slot16':x.identitySlot===8?'nj7slot8':x.resourceName==='HH0.GRA'?'hh0':x.resourceName==='LK0.GRA'?'lk0':x.resourceName==='JC0.GRA'?'jc0':x.resourceName==='BA0.GRA'?'ba0':x.resourceName==='FN4.GRA'?'fn4':'fn6';return x.nestedPackageSha256===EXPECTED[k].zipSha;}),'all eight accepted hashes');
 ck('total_pngs',fixtures.reduce((n,x)=>n+x.pngCount,0)===734,'72+72+70+88+54+92+232+54=734');
 ck('nested_logical_entries',fixtures.reduce((n,x)=>n+x.nestedEntryCount,0)===774,'77+77+75+93+59+97+237+59=774');
 ck('outer_entries',files.length===10,String(files.length));
 ck('no_semantic_promotion',stableManifest.boundaries.newPaletteOwnershipPromoted===false&&stableManifest.boundaries.siblingResourceOwnershipPromoted===false&&stableManifest.boundaries.canonicalGeometryPromoted===false&&stableManifest.boundaries.humanFighterNamesPromoted===false,'all integration-only boundaries false');
 const failed=checks.filter(x=>!x.passed);if(failed.length)throw new Error(`O88 validation failed: ${failed.map(x=>x.id).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_verified_identity_resource_rgba_bundle_o88');
 const report:MK2VerifiedFighterRgbaBundleO88Report={format:'mk2_verified_identity_resource_rgba_bundle_o88_v1',timestamp,operationId,provenance:{sourceKind:'verified-prerequisite-packages',synthetic:false,exeSha256:exeSha},fixtures,package:{downloadFileName:'MK2_O88_VERIFIED_IDENTITY_RESOURCE_RGBA_BUNDLE.zip',outerEntryCount:10,nestedPackageCount:8,nestedLogicalEntryCount:774,totalPngCount:734,byteLength:zipBytes.length,sha256:zipSha,zipEncoding:'ZIP_STORE_ONLY'},decision:{eightIndependentIdentityResourceContractsIntegrated:true,newPaletteOwnershipPromoted:false,siblingResourceOwnershipPromoted:false,canonicalGeometryPromoted:false,humanFighterNamesPromoted:false,mk1AssumptionsImported:false,verdict:'MK2_EIGHT_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION',narrative:'O88 integrates the exact deterministic O74 JC0, O76 HH0, O77 LK0, O79 BA0, O81 FN4/slot4, O83 FN6/slot5, O87 NJ7/slot8 bounded connected contract, and O85 FN4/slot16 packages under one browser-downloadable outer archive. The nested package bytes and hashes are preserved exactly. O88 adds distribution/provenance only: it does not extend palette ownership to sibling resources or whole families, does not promote NJ7 as the complete/canonical slot-8 geometry, and does not assign human fighter names.'},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return {report,zipBytes};
}
export function createMK2VerifiedFighterRgbaBundleO88Export(r:MK2VerifiedFighterRgbaBundleO88Result){if(r.report.status!=='SUCCESS'||!r.report.validation.allChecksPassed)throw new Error('O88 verified report required');return r.report;}
