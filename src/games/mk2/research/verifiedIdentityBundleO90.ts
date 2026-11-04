import { MK2VerifiedFighterRgbaBundleO88Result } from './verifiedFighterRgbaBundleO88';
import { MK2NJ4Slot9PaletteContextRgbaFixturesResult } from './nj4Slot9PaletteContextRgbaFixtures';
import { parseAnimationStoreZip } from '../../mk1/research/browserAnimationExportBundleValidation';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { hash, utf8 } from '../../../core/assets/model';

/** Distribution only: preserve all nine accepted inner ZIP byte streams. */
export async function executeVerifiedIdentityBundleO90(o88: MK2VerifiedFighterRgbaBundleO88Result, o89: MK2NJ4Slot9PaletteContextRgbaFixturesResult) {
  if (!o88.report.validation.allChecksPassed || !o89.report.validation.allChecksPassed) throw new Error('O90 requires accepted prerequisites');
  if (await hash(o88.zipBytes) !== o88.report.package.sha256 || await hash(o89.zipBytes) !== '7bd6be4c260b83f4fb69a9b26734e3ad3a5bc0a3363bc302ecc8426281bf7a7a') throw new Error('O90 package identity mismatch');
  const old = parseAnimationStoreZip(o88.zipBytes);
  const files = o88.report.fixtures.map(f => {
    const entry = old.get(f.nestedPackagePath); if (!entry) throw new Error('Missing O88 fixture');
    return { name: f.nestedPackagePath, bytes: entry.bytes };
  });
  for (let i = 0; i < files.length; i++) if (await hash(files[i].bytes) !== o88.report.fixtures[i].nestedPackageSha256) throw new Error('O90 nested identity mismatch');
  files.push({ name: 'packages/slot_09_NJ4_RGBA.zip', bytes: o89.zipBytes });
  const fixtures = [...o88.report.fixtures, { identitySlot: 9, resourceName: 'NJ4.GRA', fixturePass: 'O89', nestedPackagePath: files.at(-1)!.name, nestedPackageSha256: o89.report.package.sha256, nestedEntryCount: 53, pngCount: 48, scope: o89.report.identityJoin.scope }].sort((a,b) => a.identitySlot-b.identitySlot);
  const manifest = { format: 'mk2_o90_verified_identity_resources_v1', exeSha256: o88.report.provenance.exeSha256, fixtureCount: 9, totalPngCount: 782, nestedLogicalEntryCount: 827, fixtures, boundaries: { newPaletteOwnershipPromoted: false, siblingResourceOwnershipPromoted: false, canonicalGeometryPromoted: false, humanFighterNamesPromoted: false } };
  files.push({ name: 'manifest/verified_identity_resources.json', bytes: utf8.encode(JSON.stringify(manifest, null, 2)) }, { name: 'README.md', bytes: utf8.encode('O90 integrates the eight exact O88 fixture packages and exact O89 slot-9/NJ4 package. Nine bounded identity/resource contracts; 782 PNGs. Shared NJ geometry is neither complete nor canonical for a slot. No new palette ownership, sibling/family ownership, human names, timing, animation or stage semantics are inferred by packaging.\n') });
  files.sort((a,b) => a.name.localeCompare(b.name));
  const zipBytes = buildStoredZip(files), sha256 = await hash(zipBytes);
  if (fixtures.reduce((n,f)=>n+f.pngCount,0)!==782 || fixtures.reduce((n,f)=>n+f.nestedEntryCount,0)!==827 || files.length!==11) throw new Error('O90 count mismatch');
  return { report: { ...manifest, status: 'SUCCESS', validation: { allChecksPassed: true, exactNestedHashes: true }, package: { downloadFileName: 'MK2_O90_VERIFIED_IDENTITY_RESOURCE_RGBA_BUNDLE.zip', outerEntryCount: 11, sha256, byteLength: zipBytes.length } }, zipBytes };
}
