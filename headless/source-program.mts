import { readFile } from 'node:fs/promises';
import { verified } from './engine.mts';
import { sourceSprites, spriteFamilies } from './source-sprites.mts';

export async function sourceProgram(root: string, resource: string) {
  if (!spriteFamilies.includes(resource)) throw new Error(`Unsupported source program resource: ${resource}`);
  const sprites = await sourceSprites(root, resource);
  const source = sprites[0].metadata.source;
  const exe = await verified(root, source.executable.file, source.executable.bytes, source.executable.sha256);
  const program = JSON.parse(await readFile(new URL(`./${resource.slice(0, -4)}-program.json`, import.meta.url), 'utf8'));
  const assets = new Set(sprites.map(sprite => sprite.metadata.id));
  const word = (offset: number) => exe.readUInt32LE(0xa0c54 + offset);
  for (const list of program.programs) {
    for (const entry of list.entries)
      if (!assets.has(entry.assetId) || word(entry.siteObject2) !== entry.descriptorObject2)
        throw new Error('Source-program descriptor reference mismatch');
    const terminal = list.rootObject2 + 4 * list.entries.length;
    if (word(terminal) !== list.control.sourceMarker ||
        (list.control.targetObject2 !== null && word(terminal + 4) !== list.control.targetObject2))
      throw new Error('Source-program control marker mismatch');
  }
  for (const anchor of program.paletteSourceAnchors ?? []) {
    const site = anchor.typedSourcePointerObject2 ?? anchor.typedPalettePointerSiteObject2;
    const record = anchor.sourceRecordObject1 ?? anchor.sourcePaletteRecordObject1;
    if (word(site) !== record) throw new Error('Source palette pointer mismatch');
  }
  for (const group of program.nestedGroups ?? []) {
    for (const entry of group.records)
      if (!assets.has(entry.assetId) || word(entry.tableEntryObject2) !== entry.commandRecordObject2 ||
          word(entry.commandRecordObject2) !== entry.descriptorObject2 || word(entry.commandRecordObject2 + 4) !== 0)
        throw new Error('Nested source-program command mismatch');
    if (word(group.zeroTerminatorObject2) !== 0) throw new Error('Nested source-program terminator mismatch');
  }
  for (const group of program.secondaryGroups ?? []) {
    for (const entry of group.records) {
      const physical = 0xa0c54 + entry.entryObject2;
      if (!assets.has(entry.assetId) || word(entry.entryObject2) !== entry.descriptorObject2 ||
          exe.readInt16LE(physical + 4) !== entry.signedRelativeXY[0] ||
          exe.readInt16LE(physical + 6) !== entry.signedRelativeXY[1])
        throw new Error('Signed-coordinate source-program record mismatch');
    }
    if (word(group.trailingZeroObject2) !== 0) throw new Error('Procedural source-program terminator mismatch');
  }
  for (const entry of program.singleDescriptorLookup ?? [])
    if (!assets.has(entry.assetId) || word(entry.sourceSiteObject2) !== entry.descriptorObject2)
      throw new Error('Single-descriptor lookup mismatch');
  if (program.entrySelector) {
    const {variantSelectorTableObject2, variantPointerDestinationsObject2} = program.entrySelector;
    for (const [slot, target] of variantPointerDestinationsObject2.entries())
      if (word(variantSelectorTableObject2 + slot * 4) !== target)
        throw new Error('Alternate entry-point selector mismatch');
  }
  for (const slot of program.selectorSlots ?? [])
    if (word(program.selectorTableObject2 + slot.selectorSlot * 4) !== slot.sourceGroupObject2)
      throw new Error('Nested source-program selector mismatch');
  return {
    schema: 1, resource, evidence: 'VERIFIED STATIC',
    source: { sha256: source.sha256, bytes: source.bytes, executable: source.executable,
      addressSpace: 'Object2 offsets are relative to executable physical base 0xA0C54' },
    runtime: { palette: 'UNKNOWN', timing: 'UNKNOWN', selectedVariant: 'UNKNOWN',
      activation: 'UNKNOWN', screenPlacement: 'UNKNOWN' },
    ...program
  };
}
