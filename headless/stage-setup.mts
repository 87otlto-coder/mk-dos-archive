import { identify, sha, verified } from './engine.mts';

const object1 = 0x61c54;
const object2 = 0xa0c54;
const stages = { tomb: 1, portal: 7, tower: 3 } as const;
const modes = { '2': 0x15bec, '1': 0x15c68, other: 0x15ce4 } as const;
const paletteTables = new Map([[0x177d0, [0x893c6, 7]], [0x16538, [0x891e0, 9]],
  [0x2e848, [0x8cdbe, 9]], [0x2e784, [0x8cd1e, 9]]]);

export async function stageSetup(directory: string, stage: string, mode: string) {
  if (!Object.hasOwn(stages, stage) || !Object.hasOwn(modes, mode))
    throw new Error('Stage requires tomb, portal or tower and mode 2, 1 or other');
  const executable = await identify(directory);
  const exe = await verified(directory, executable.file, executable.bytes, executable.sha256);
  const u32 = (at: number) => exe.readUInt32LE(object2 + at);
  const s32 = (at: number) => exe.readInt32LE(object2 + at);
  const u16 = (at: number) => exe.readUInt16LE(object2 + at);
  const s16 = (at: number) => exe.readInt16LE(object2 + at);
  const index = stages[stage as keyof typeof stages];
  const rootSite = modes[mode as keyof typeof modes] + 4 * index;
  const root = u32(rootSite);
  const pool = exe.toString('latin1', 0xa0ef1, 0xa13a7).split('\0');
  const resourceId = u32(root) >>> 24;
  const destination = u32(root + 0x1c);
  if (destination !== 0x77453 || !pool[resourceId]) throw new Error('Invalid stage root');
  const headerSignedWords = Array.from({length: 6}, (_, i) => s16(root + 4 + i * 2));
  const initial = s16(root + 10);
  const channels = new Map(Array.from({length: 9}, (_, i) => [0x84310 + i * 4, initial]));
  const entries: Array<{entryObject2: number; setupObject2?: number; originSignedXY?: number[]}> = [];
  let cursor = root + 0x20;
  while (s32(cursor) !== -2) {
    const token = s32(cursor);
    if (entries.length >= 8 || token < 1) throw new Error('Invalid stage setup program');
    entries.push(token === 1 ? {entryObject2: cursor} : {
      entryObject2: cursor, setupObject2: token, originSignedXY: [s16(cursor + 4), s16(cursor + 6)]
    });
    cursor += token === 1 ? 4 : 8;
  }
  cursor += 4;
  const centerOverrides = [];
  while (u32(cursor) !== 0) {
    const setupObject2 = u32(cursor);
    const channelObject2 = u32(cursor + 4);
    const width = s16(setupObject2);
    if (centerOverrides.length >= 16 || !channels.has(channelObject2) || width < 0)
      throw new Error('Invalid stage center override');
    const initialInteger = (width >>> 1) - 159;
    channels.set(channelObject2, initialInteger);
    centerOverrides.push({setupObject2, channelObject2, initialInteger});
    cursor += 8;
  }
  cursor += 4;
  const bindings = Array.from({length: 8}, (_, channel) => {
    const entry = entries[channel];
    const row = 0x15b68 + 16 * channel;
    const slotObject2 = u32(row + 12);
    if (slotObject2 !== destination + 4 * channel) throw new Error('Stage channel slot mismatch');
    const channelsRef = {selectionMaskObject2: u32(row),
      verticalAccumulatorObject2: u32(row + 4), horizontalAccumulatorObject2: u32(row + 8),
      objectListHeadObject2: 0x84350 - 4 * channel};
    const base = {channel, slotObject2, ...channelsRef,
      initialHorizontalInteger: channels.get(channelsRef.horizontalAccumulatorObject2)};
    if (!entry) return {...base, kind: 'untouched_default'};
    if (entry.setupObject2 === undefined) return {...base, ...entry, kind: 'disabled_sentinel', value: 1};
    const setup = entry.setupObject2;
    const paletteTableObject2 = u32(setup + 14);
    const qualified = paletteTables.get(paletteTableObject2);
    const paletteSourcePointers = qualified ? Array.from({length: qualified[1]}, (_, slot) => {
      const pointerSiteObject2 = paletteTableObject2 + 4 * slot;
      const recordObject1 = u32(pointerSiteObject2);
      const recordPhysical = object1 + recordObject1;
      if (recordPhysical !== qualified[0]) throw new Error('Stage palette source pointer mismatch');
      return {slot, pointerSiteObject2, recordObject1, recordPhysical, colorWordCount: exe.readUInt16LE(recordPhysical)};
    }) : [];
    return {...base, ...entry, kind: 'setup_pair', size: [u16(setup), u16(setup + 2)],
      controlCount: u16(setup + 4), controlPointerObject2: u32(setup + 6),
      spriteTableObject2: u32(setup + 10), paletteTableObject2, paletteSourcePointers};
  });
  const drawStreamObject2 = u32(root + 0x18);
  let at = drawStreamObject2;
  const drawCommands = [];
  while (s32(at)) {
    const token = s32(at);
    if (drawCommands.length >= 128 || token < -2) throw new Error('Invalid stage draw stream');
    if (token === -1) {
      drawCommands.push({opcode: 'minus_one_draw', object2Offset: at, sourcePointerObject2: u32(at + 4),
        rawParameter2: u32(at + 8), rawParameter3: u32(at + 12)});
      at += 16;
    } else if (token > 0) {
      drawCommands.push({opcode: 'positive_pair', object2Offset: at, tokenPointerObject2: token,
        payloadPointerObject2: u32(at + 4)});
      at += 8;
    } else {
      drawCommands.push({opcode: 'other_negative', object2Offset: at, signedToken: token});
      at += 4;
    }
  }
  return {schema: 1, stage, mode, evidence: 'VERIFIED STATIC', executable, stageIndex: index,
    resource: {id: resourceId, name: pool[resourceId], packedRootWord: u32(root)},
    rootTableEntryObject2: rootSite, rootObject2: root, endExclusiveObject2: cursor,
    rootSpanSha256: sha(exe.subarray(object2 + root, object2 + cursor)), headerSignedWords,
    initialDefaultHorizontalInteger: initial, setupBindings: bindings, centerOverrides,
    drawStreamObject2, drawCommands, runtime: {camera: 'UNKNOWN', placement: 'UNKNOWN',
      activeObjects: 'UNKNOWN', palette: 'UNKNOWN', framebuffer: 'VALIDATION PENDING'}};
}
