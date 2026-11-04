/** MK2 palette-selector gameplay semantics — Pass 1E.3O.75. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK2CharacterResourcePaletteSlotJoinReport } from './characterResourcePaletteSlotJoin';
import { MK2JC0PaletteContextRgbaFixturesReport } from './jc0PaletteContextRgbaFixtures';

const EXPECTED_EXE_SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const CREATE=0x85be3, UPDATE=0x85a6b;
const TABLE_A=0x1c1b8, TABLE_B=0x1c1fc;
const SIDE_INDEX=0x75a64, FIRST_IDENTITY=0x75fce, MODE=0x7650a;
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`;}
async function sha256(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function findEntry(es:SourceFileEntry[],wanted:string){const e=es.find(x=>x.path.toUpperCase()===wanted);if(!e)throw new Error(`Missing ${wanted}`);return e;}
function match(b:Uint8Array,o:number,hexBytes:string){const x=hexBytes.split(/\s+/).map(v=>parseInt(v,16));return x.every((v,i)=>b[o+i]===v);}

export interface MK2PaletteSelectorGameplaySemanticsReport{
 format:'mk2_palette_selector_gameplay_semantics_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';exeSha256:string;synthetic:false};
 prerequisite:{o73Verdict:string;o74Verdict:string;validationPassed:true};
 selectorMechanism:{creationRoutinePhysical:number;creationRoutinePhysicalHex:string;updateRoutinePhysical:number;updateRoutinePhysicalHex:string;sideIndexGlobal:number;firstSideIdentityGlobal:number;unnamedModeGlobal:number;objectIdentityField:'+0x46';objectPaletteHandleField:'+0x30';objectFlagsField:'+0x34';duplicatePaletteFlagMask:'0x40';tableAObject2Offset:number;tableBObject2Offset:number};
 creationRule:{tableA:'DEFAULT_CHARACTER_PALETTE';tableB:'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE';rules:Array<{priority:number;condition:string;selectedTable:'A'|'B';flag40:string}>;unnamedModeValue4SuppressesDuplicateOverride:true;playerNumberNamingEstablished:false};
 dynamicRule:{equalitySource:'object +0x46 compared with first-side identity global';whenIdentityBecomesEqual:'set flag 0x40 and select table B';whenIdentityStopsMatching:'clear flag 0x40 and select table A';established:true};
 sideOrderingEvidence:{firstCreation:{identityGlobal:number;sideIndex:0;callPhysical:number};secondCreation:{identityGlobal:number;sideIndex:1;callPhysical:number};secondIndependentPair:{firstCallPhysical:number;secondCallPhysical:number};boundedMeaning:'side index 0 is created first; side index 1 is created second and is the only side eligible for the same-character duplicate override';playerOnePlayerTwoLabelsEstablished:false};
 jc0Semantics:{identitySlot:2;structuralContextA:'selector_table_A_slot_02';structuralContextB:'selector_table_B_slot_02';contextASemanticAlias:'DEFAULT_CHARACTER_PALETTE';contextBSemanticAlias:'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE';tableAPaletteObject1Offset:number;tableBPaletteObject1Offset:number;o74RgbaAssetsPerContext:35;existingO74PackagePathsRenamed:false};
 decision:{tableADefaultSemanticsEstablished:true;tableBSameCharacterDuplicateOverrideSemanticsEstablished:true;playerNumberLabelsEstablished:false;unnamedMode4MeaningEstablished:false;o74PixelsChanged:false;verdict:'MK2_PALETTE_SELECTOR_DEFAULT_AND_SAME_CHARACTER_DUPLICATE_OVERRIDE_SEMANTICS_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2PaletteSelectorGameplaySemantics(source:DirectorySource,o73:MK2CharacterResourcePaletteSlotJoinReport,o74:MK2JC0PaletteContextRgbaFixturesReport):Promise<MK2PaletteSelectorGameplaySemanticsReport>{
 if(source.isSynthetic||o73.status!=='SUCCESS'||o74.status!=='SUCCESS')throw new Error('O75 requires authentic verified O73/O74 prerequisites');
 const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_palette_selector_gameplay_semantics');
 const entries=await source.listRecursive(),e=findEntry(entries,'MK2.EXE'),b=await source.readSlice(e.path,0,e.size),exeSha=await sha256(b);if(exeSha!==EXPECTED_EXE_SHA256)throw new Error('MK2.EXE identity mismatch');
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,p:boolean,d:string)=>checks.push({id,passed:p,detail:d});
 ck('create_default_table_A',match(b,0x85bfa,'b9 b8 c1 01 00'),hex(TABLE_A));
 ck('create_mode4_bypass',match(b,0x85bff,'8b 15 0a 65 07 00 83 fa 04 74 31'),'mode global 0x7650A; value 4 jumps to default table');
 ck('create_side_zero_default',match(b,0x85c0a,'f7 05 64 5a 07 00 ff ff ff ff 74 25'),'side-index zero bypasses duplicate override');
 ck('create_first_identity_compare',match(b,0x85c16,'52 8b 15 ce 5f 07 00 89 15 70 5a 07 00 5a 39 05 70 5a 07 00 75 0f'),'candidate identity compared to first-side identity');
 ck('create_duplicate_flag',match(b,0x85c2c,'c7 05 6c 5a 07 00 40 00 00 00'),'duplicate path supplies flag 0x40');
 ck('create_table_B',match(b,0x85c36,'b9 fc c1 01 00'),hex(TABLE_B));
 ck('identity_to_table_slot',match(b,0x85c3b,'c1 e0 02 03 c1'),'identity*4 + selected table');
 ck('object_identity_store',match(b,0x85c6c,'52 8b 15 78 5a 07 00 89 57 46 5a'),'identity -> object+0x46');
 ck('palette_handle_store',match(b,0x85c77,'8b 00 e8 bb 57 ff ff 66 89 47 30'),'selected record -> allocator -> object+0x30');
 ck('flag_store',match(b,0x85c82,'8b 47 34 83 c8 02 0b 05 6c 5a 07 00 89 47 34'),'temporary 0x40 merged into object+0x34');
 ck('first_side_creation',match(b,0x77a51,'a3 ce 5f 07 00 33 db c7 05 64 5a 07 00 00 00 00 00 e8 7c e1 00 00'),'first identity then side index 0');
 ck('second_side_creation',match(b,0x77ae2,'a3 52 61 07 00 33 db c7 05 64 5a 07 00 01 00 00 00 e8 eb e0 00 00'),'second identity then side index 1');
 ck('second_creation_pair',match(b,0x94979,'a3 ce 5f 07 00 bb 01 00 00 00 c7 05 64 5a 07 00 00 00 00 00')&&match(b,0x94a26,'a3 52 61 07 00 bb 01 00 00 00 c7 05 64 5a 07 00 01 00 00 00'),'independent side0/side1 pair');
 ck('update_identity_compare',match(b,0x85a6b,'a1 ce 5f 07 00 52 8b 57 46 89 15 74 5a 07 00 5a'),'runtime object identity vs first-side identity');
 ck('update_A_B_toggle',match(b,0x85a7b,'8b 57 34 f7 c2 40 00 00 00 75 10')&&match(b,0x85a8e,'83 ca 40 89 57 34 eb 15')&&match(b,0x85a9e,'83 e2 bf 89 57 34 b8 b8 c1 01 00 eb 05 b8 fc c1 01 00'),'flag/table toggle follows equality changes');
 ck('o73_jc0_slot2',o73.jc0Join.identitySlot===2&&o73.jc0Join.paletteSelectorSlot===2,'JC0 slot 2');
 ck('o74_two_contexts',o74.paletteContexts.length===2&&o74.assets.length===70,'35 x 2 O74 RGBA assets');
 if(checks.some(x=>!x.passed))throw new Error(`O75 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.id).join(', ')}`);
 return {format:'mk2_palette_selector_gameplay_semantics_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',exeSha256:exeSha,synthetic:false},prerequisite:{o73Verdict:o73.decision.verdict,o74Verdict:o74.decision.verdict,validationPassed:true},selectorMechanism:{creationRoutinePhysical:CREATE,creationRoutinePhysicalHex:hex(CREATE),updateRoutinePhysical:UPDATE,updateRoutinePhysicalHex:hex(UPDATE),sideIndexGlobal:SIDE_INDEX,firstSideIdentityGlobal:FIRST_IDENTITY,unnamedModeGlobal:MODE,objectIdentityField:'+0x46',objectPaletteHandleField:'+0x30',objectFlagsField:'+0x34',duplicatePaletteFlagMask:'0x40',tableAObject2Offset:TABLE_A,tableBObject2Offset:TABLE_B},creationRule:{tableA:'DEFAULT_CHARACTER_PALETTE',tableB:'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE',rules:[{priority:1,condition:'unnamed mode global == 4',selectedTable:'A',flag40:'not added'},{priority:2,condition:'side index == 0',selectedTable:'A',flag40:'not added'},{priority:3,condition:'side index != 0 AND candidate identity != first-side identity',selectedTable:'A',flag40:'not added'},{priority:4,condition:'side index != 0 AND candidate identity == first-side identity',selectedTable:'B',flag40:'added'}],unnamedModeValue4SuppressesDuplicateOverride:true,playerNumberNamingEstablished:false},dynamicRule:{equalitySource:'object +0x46 compared with first-side identity global',whenIdentityBecomesEqual:'set flag 0x40 and select table B',whenIdentityStopsMatching:'clear flag 0x40 and select table A',established:true},sideOrderingEvidence:{firstCreation:{identityGlobal:FIRST_IDENTITY,sideIndex:0,callPhysical:0x77a62},secondCreation:{identityGlobal:0x76152,sideIndex:1,callPhysical:0x77af3},secondIndependentPair:{firstCallPhysical:0x9498d,secondCallPhysical:0x94a3a},boundedMeaning:'side index 0 is created first; side index 1 is created second and is the only side eligible for the same-character duplicate override',playerOnePlayerTwoLabelsEstablished:false},jc0Semantics:{identitySlot:2,structuralContextA:'selector_table_A_slot_02',structuralContextB:'selector_table_B_slot_02',contextASemanticAlias:'DEFAULT_CHARACTER_PALETTE',contextBSemanticAlias:'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE',tableAPaletteObject1Offset:o73.jc0Join.tableA.paletteObject1Offset,tableBPaletteObject1Offset:o73.jc0Join.tableB.paletteObject1Offset,o74RgbaAssetsPerContext:35,existingO74PackagePathsRenamed:false},decision:{tableADefaultSemanticsEstablished:true,tableBSameCharacterDuplicateOverrideSemanticsEstablished:true,playerNumberLabelsEstablished:false,unnamedMode4MeaningEstablished:false,o74PixelsChanged:false,verdict:'MK2_PALETTE_SELECTOR_DEFAULT_AND_SAME_CHARACTER_DUPLICATE_OVERRIDE_SEMANTICS_ESTABLISHED',narrative:'MK2 creation code selects table A by default. It only switches to table B when an object is created on nonzero side index, the candidate character identity equals the already selected first-side identity, and an otherwise-unnamed mode global is not value 4; that path also adds object flag 0x40. A separate runtime update path toggles flag 0x40 and table A/B as object identity equality with the first-side identity changes. Therefore table A is qualified as the default character palette and table B as the same-character duplicate override palette. O73 joins JC0 to selector slot 2 and O74 already renders both records, so those 70 existing RGBA fixtures now gain semantic aliases without changing pixels or package paths. Numeric Player 1/Player 2 labels and the meaning of mode value 4 remain unpromoted.'},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK2PaletteSelectorGameplaySemanticsExport(r:MK2PaletteSelectorGameplaySemanticsReport){if(r.status!=='SUCCESS'||!r.validation.allChecksPassed)throw new Error('Verified O75 report required');return r;}
