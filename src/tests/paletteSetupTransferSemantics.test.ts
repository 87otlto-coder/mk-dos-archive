import { describe, expect, it } from 'vitest';
import { findRendererPaletteShiftBridge, parsePaletteTransferQueue } from '../games/mk1/research/paletteSetupTransferSemantics';
import { ResolvedWatcomCodeSymbol } from '../games/mk1/research/kanoPaletteSelectionSemanticsTypes';

function putU32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function codeSymbol(name: string, moduleIndex: number, watcomStart: number, codeBase: number, end: number): ResolvedWatcomCodeSymbol {
  return {
    name, moduleIndex, moduleName: 'GENERIC.ASM',
    watcomStartOffset: watcomStart, watcomStartOffsetHex: 'x',
    watcomEndOffset: end, watcomEndOffsetHex: 'x',
    physicalStart: codeBase + watcomStart, physicalStartHex: 'x',
    physicalEnd: codeBase + end, physicalEndHex: 'x', exactStartMatch: true,
  };
}

function rawCode(name: string, offset: number, moduleIndex = 1, globalIndex = offset) {
  return { valid: true, segment: 1, kindBits: { isCode: true, isData: false }, addressOffset: offset, moduleIndex, resolvedModuleName: 'GENERIC.ASM', globalIndex, name };
}
function rawData(name: string, offset: number, moduleIndex = 2, globalIndex = offset) {
  return { valid: true, segment: 2, kindBits: { isCode: false, isData: true }, addressOffset: offset, moduleIndex, resolvedModuleName: 'GENERIC.ASM', globalIndex, name };
}

describe('1E.3G generic palette setup/transfer mechanics', () => {
  it('derives a 32-entry transfer ring from PALSET-like stores without fixture constants', () => {
    const bytes = new Uint8Array(512);
    const physical = 32;
    const queueStart = 0x100, queueEnd = 0x200, producer = 0x204, changed = 0x208;
    bytes[physical] = 0x51;
    bytes.set([0x8b,0x0d], physical+1); putU32(bytes,physical+3,producer);
    bytes.set([0x89,0x01], physical+7);
    bytes.set([0x66,0x89,0x51,0x04], physical+9);
    bytes.set([0x66,0x89,0x59,0x06], physical+13);
    bytes.set([0x83,0xc1,0x08], physical+17);
    bytes.set([0x81,0xf9], physical+20); putU32(bytes,physical+22,queueEnd);
    bytes.set([0x7c,0x05,0xb9], physical+26); putU32(bytes,physical+29,queueStart);
    bytes.set([0x89,0x0d], physical+33); putU32(bytes,physical+35,producer);
    bytes.set([0x59,0xc3], physical+39);
    const permanent: any = {
      globalSymbols: { symbols: [rawData('CHANGED',changed,7)] },
      addressInfo: { segmentRecords: [{ segment:2, startAddressOffset:queueStart, entries:[{size:0x10c,moduleIndex:7,resolvedModuleName:'GENERIC.ASM'}] }] },
    };
    const palset = codeSymbol('SET',7,0x10,physical-0x10,0x10+41);
    const q = parsePaletteTransferQueue(bytes,palset,permanent);
    expect(q?.classification).toBe('VERIFIED_PALETTE_TRANSFER_RING');
    expect(q?.capacity).toBe(32);
    expect(q?.entryFields).toEqual({ colorsPointerOffset:0,startIndexOffset:4,colorCountOffset:6 });
    expect(q?.changedFlagSymbol?.name).toBe('CHANGED');
  });

  it('discovers a renderer shift bridge from PALRAM start-index use and a repeated-byte tuple table', () => {
    const bytes = new Uint8Array(0x3000);
    const codeBase = 0x100, dataBase = 0x1000, p = 0x200;
    const palStartAddr = 0x5006, dispatchOffset = 0x100, dispatchPhysical = dataBase + dispatchOffset;
    const rendererOffset = 0x300, rendererPhysical = codeBase + rendererOffset, tupleOffset = 0x800, tuplePhysical = dataBase + tupleOffset;
    bytes.set([0x0f,0xb7,0xe8,0xc1,0xe8,0x10,0xf6,0xc2,0x08,0x74,0x09,0x02,0x04,0xed],p); putU32(bytes,p+14,palStartAddr);
    bytes.set([0xeb,0x07,0x8a,0x04,0xed],p+18); putU32(bytes,p+23,palStartAddr);
    bytes[p+27]=0x48; bytes[p+28]=0x25; putU32(bytes,p+29,0xff);
    bytes.set([0x81,0xe2],p+0x36); putU32(bytes,p+0x38,0xff);
    bytes.set([0xff,0x24,0x95],p+0x47); putU32(bytes,p+0x4a,dispatchOffset);
    putU32(bytes,dispatchPhysical+2*4,rendererOffset);
    bytes.set([0x8b,0x1c,0x85],rendererPhysical+8); putU32(bytes,rendererPhysical+11,tupleOffset);
    bytes.set([0x8b,0x14,0x95],rendererPhysical+0x30); putU32(bytes,rendererPhysical+0x33,tupleOffset); bytes.set([0x03,0xd3],rendererPhysical+0x37);
    for(let i=0;i<256;i++) putU32(bytes,tuplePhysical+i*4,(i*0x01010101)>>>0);
    const permanent: any = {
      globalSymbols: { symbols: [
        rawCode('GENERIC_DMA',0x80,1,1), rawCode('GENERIC_SHIFT_WRITER',rendererOffset,2,2), rawCode('AFTER',0x400,3,3), rawData('TUPLES',tupleOffset,4,4),
      ] },
      addressInfo: { segmentRecords: [] },
    };
    const r = findRendererPaletteShiftBridge(bytes,permanent,codeBase,dataBase,palStartAddr);
    expect(r?.classification).toBe('VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE');
    expect(r?.dispatchTableOffset).toBe(dispatchOffset);
    expect(r?.wrtNonZeroEntries[0].index).toBe(2);
    expect(r?.tuplePatternVerified).toBe(true);
    expect(r?.literalByteShiftAddObserved).toBe(true);
  });
});
