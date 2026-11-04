// Uses the authenticated O67–O89 MK2 chain without broadening palette claims.
import { DirectorySource } from '../filesystem/DirectorySource';
import { executeMK2FixtureResourceExecutableTopology, MK2FixtureResourceExecutableTopologyReport } from '../../games/mk2/research/fixtureResourceExecutableTopology';
import { executeMK2IndexedGraphicsDecodeFoundation, MK2IndexedGraphicsPackage } from '../../games/mk2/research/indexedGraphicsDecodeFoundation';
import { executeMK2BroadIndexedGraphicsCorpusCensus, MK2BroadIndexedGraphicsCorpusCensusReport } from '../../games/mk2/research/broadIndexedGraphicsCorpusCensus';
import { executeMK2BrowserIndexedGraphicsExportBundle, MK2BrowserIndexedGraphicsExportBundleResult } from '../../games/mk2/research/browserIndexedGraphicsExportBundle';
import { executeMK2BrowserIndexedGraphicsExportBundleValidation, MK2BrowserIndexedGraphicsExportBundleValidationReport } from '../../games/mk2/research/browserIndexedGraphicsExportBundleValidation';
import { executeMK2PaletteStorageSelectionReconnaissance, MK2PaletteStorageSelectionReconnaissanceReport } from '../../games/mk2/research/paletteStorageSelectionReconnaissance';
import { executeMK2LEFixupPointerProvenanceQualification, MK2LEFixupPointerProvenanceQualificationReport } from '../../games/mk2/research/leFixupPointerProvenanceQualification';
import { executeMK2CharacterResourcePaletteSlotJoin, MK2CharacterResourcePaletteSlotJoinReport } from '../../games/mk2/research/characterResourcePaletteSlotJoin';
import { executeMK2JC0PaletteContextRgbaFixtures, MK2JC0PaletteContextRgbaFixturesResult } from '../../games/mk2/research/jc0PaletteContextRgbaFixtures';
import { executeMK2PaletteSelectorGameplaySemantics, MK2PaletteSelectorGameplaySemanticsReport } from '../../games/mk2/research/paletteSelectorGameplaySemantics';
import { executeMK2HH0PaletteContextRgbaFixtures, MK2HH0PaletteContextRgbaFixturesResult } from '../../games/mk2/research/hh0PaletteContextRgbaFixtures';
import { executeMK2LK0PaletteContextRgbaFixtures, MK2LK0PaletteContextRgbaFixturesResult } from '../../games/mk2/research/lk0PaletteContextRgbaFixtures';
import { executeMK2VerifiedFighterRgbaBundle, MK2VerifiedFighterRgbaBundleResult } from '../../games/mk2/research/verifiedFighterRgbaBundle';
import { executeMK2BA0PaletteContextRgbaFixtures, MK2BA0PaletteContextRgbaFixturesResult } from '../../games/mk2/research/ba0PaletteContextRgbaFixtures';
import { executeMK2VerifiedFighterRgbaBundleO80, MK2VerifiedFighterRgbaBundleO80Result } from '../../games/mk2/research/verifiedFighterRgbaBundleO80';
import { executeMK2FN4PaletteContextRgbaFixtures, MK2FN4PaletteContextRgbaFixturesResult } from '../../games/mk2/research/fn4PaletteContextRgbaFixtures';
import { executeMK2VerifiedFighterRgbaBundleO82, MK2VerifiedFighterRgbaBundleO82Result } from '../../games/mk2/research/verifiedFighterRgbaBundleO82';
import { executeMK2FN6PaletteContextRgbaFixtures, MK2FN6PaletteContextRgbaFixturesResult } from '../../games/mk2/research/fn6PaletteContextRgbaFixtures';
import { executeMK2VerifiedFighterRgbaBundleO84, MK2VerifiedFighterRgbaBundleO84Result } from '../../games/mk2/research/verifiedFighterRgbaBundleO84';
import { executeMK2FN4Slot16PaletteContextRgbaFixtures, MK2FN4Slot16PaletteContextRgbaFixturesResult } from '../../games/mk2/research/fn4Slot16PaletteContextRgbaFixtures';
import { executeMK2VerifiedFighterRgbaBundleO86, MK2VerifiedFighterRgbaBundleO86Result } from '../../games/mk2/research/verifiedFighterRgbaBundleO86';
import { executeMK2NJ7PaletteContextRgbaFixtures, MK2NJ7PaletteContextRgbaFixturesResult } from '../../games/mk2/research/nj7Slot8PaletteContextRgbaFixtures';
import { executeMK2NJ4Slot9PaletteContextRgbaFixtures, MK2NJ4Slot9PaletteContextRgbaFixturesResult } from '../../games/mk2/research/nj4Slot9PaletteContextRgbaFixtures';
import { executeMK2U8SampleStartCallerTrace } from '../../games/mk2/research/u8SampleStartCallerTrace';
import { executeMK2U8EndFieldLifetime } from '../../games/mk2/research/u8EndFieldLifetime';
import { executeMK2U8TailRoleAudit } from '../../games/mk2/research/u8TailRoleAudit';
import { executeMK2U8PcmExportQualification, type MK2U8PcmExportQualificationResult } from '../../games/mk2/research/u8PcmExportQualification';
import { executeMK2VerifiedFighterRgbaBundleO88, MK2VerifiedFighterRgbaBundleO88Result } from '../../games/mk2/research/verifiedFighterRgbaBundleO88';
export async function runMK2Pipeline(source:DirectorySource, progress:(s:string)=>void=()=>{}, signal?:AbortSignal) {
signal?.throwIfAborted(); progress('MK2 evidence chain'); const a=await executeMK2FixtureResourceExecutableTopology(source);signal?.throwIfAborted(); progress('MK2 evidence chain'); const b=await executeMK2IndexedGraphicsDecodeFoundation(source,a);signal?.throwIfAborted(); progress('MK2 evidence chain'); const c=await executeMK2BroadIndexedGraphicsCorpusCensus(source,a,b.report);signal?.throwIfAborted(); progress('MK2 evidence chain'); const d=await executeMK2BrowserIndexedGraphicsExportBundle(source,c);signal?.throwIfAborted(); progress('MK2 evidence chain'); const e=await executeMK2BrowserIndexedGraphicsExportBundleValidation(source,c,d);signal?.throwIfAborted(); progress('MK2 evidence chain'); const f=await executeMK2PaletteStorageSelectionReconnaissance(source,a,b.report);signal?.throwIfAborted(); progress('MK2 evidence chain'); const g=await executeMK2LEFixupPointerProvenanceQualification(source,a,b.report,f);signal?.throwIfAborted(); progress('MK2 evidence chain'); const h=await executeMK2CharacterResourcePaletteSlotJoin(source,b.report,c,g);signal?.throwIfAborted(); progress('MK2 evidence chain'); const i=await executeMK2JC0PaletteContextRgbaFixtures(source,b,f,h);signal?.throwIfAborted(); progress('MK2 evidence chain'); const j=await executeMK2PaletteSelectorGameplaySemantics(source,h,i.report);signal?.throwIfAborted(); progress('MK2 evidence chain'); const k=await executeMK2HH0PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const l=await executeMK2LK0PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const m=await executeMK2VerifiedFighterRgbaBundle(i,k,l);signal?.throwIfAborted(); progress('MK2 evidence chain'); const n=await executeMK2BA0PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const o=await executeMK2VerifiedFighterRgbaBundleO80(i,k,l,n);signal?.throwIfAborted(); progress('MK2 evidence chain'); const p=await executeMK2FN4PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const q=await executeMK2VerifiedFighterRgbaBundleO82(i,k,l,n,p);signal?.throwIfAborted(); progress('MK2 evidence chain'); const r=await executeMK2FN6PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const s84=await executeMK2VerifiedFighterRgbaBundleO84(i,k,l,n,p,r);signal?.throwIfAborted(); progress('MK2 evidence chain'); const t85=await executeMK2FN4Slot16PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const u86=await executeMK2VerifiedFighterRgbaBundleO86(i,k,l,n,p,r,t85);signal?.throwIfAborted(); progress('MK2 evidence chain'); const v87=await executeMK2NJ7PaletteContextRgbaFixtures(source,c,f,g,h,j);signal?.throwIfAborted(); progress('MK2 evidence chain'); const w88=await executeMK2VerifiedFighterRgbaBundleO88(i,k,l,n,p,r,t85,v87);signal?.throwIfAborted(); progress('MK2 evidence chain'); const x89=await executeMK2NJ4Slot9PaletteContextRgbaFixtures(source,c,f,g,h,j);
// Extractor integration only: reuse the EXISTING O94A–O94D authenticated
// sound pipeline. A failed qualification never turns unverified U8 bytes into WAV.
// It also must not prevent the independently qualified graphics/music collection.
let u8: MK2U8PcmExportQualificationResult | undefined;
let u8Failure: string | undefined;
try {
  signal?.throwIfAborted(); progress('MK2 qualified sound effects (O94D)');
  const o94a = await executeMK2U8SampleStartCallerTrace(source,a);
  signal?.throwIfAborted();
  const o94b = await executeMK2U8EndFieldLifetime(source,a,o94a);
  signal?.throwIfAborted();
  const o94c = await executeMK2U8TailRoleAudit(source,a,o94a,o94b);
  signal?.throwIfAborted();
  u8 = await executeMK2U8PcmExportQualification(source,a,o94a,o94b,o94c);
} catch (error) {
  if (signal?.aborted) throw error;
  u8Failure = error instanceof Error ? error.message : String(error);
  progress(`MK2 sound effects not qualified: ${u8Failure}`);
}
return {a,b,c,d,e,f,g,h,i,j,k,l,n,p,r,t85,v87,w88,x89,u8,u8Failure};
}
