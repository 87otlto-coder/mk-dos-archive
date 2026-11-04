import { describe, expect, it } from 'vitest';
import {
  findPaletteSelectionStateMachine,
  qualifyCodeImageBase,
  scanCodeContinuationAnchors,
} from '../games/mk1/research/kanoPaletteSelectionSemantics';

function putU32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function putI32(bytes: Uint8Array, offset: number, value: number) {
  putU32(bytes, offset, value >>> 0);
}

function emitContinuation(bytes: Uint8Array, p: number, storedOffset: number, rel32 = 0) {
  bytes.set([0x8d,0x6d,0xfc,0xc7,0x45,0x00], p);
  putU32(bytes, p + 6, storedOffset);
  bytes[p + 10] = 0xe9;
  putI32(bytes, p + 11, rel32);
}

function emitSelectionMachine(bytes: Uint8Array, p: number, alt: number, normal: number, callTarget: number) {
  const a11 = 0x2222;
  const p1 = 0x3333;
  const p2 = 0x4444;
  bytes.set([0xf7,0x05], p); putU32(bytes,p+2,a11); putU32(bytes,p+6,0xffffffff); bytes.set([0x75,0x40],p+10);
  bytes[p+12]=0xa1; putU32(bytes,p+13,p1);
  bytes.set([0x8b,0x1d],p+17); putU32(bytes,p+19,p2);
  bytes.set([0x3b,0xd8,0x75,0x20],p+23);
  bytes.set([0xc7,0x05],p+27); putU32(bytes,p+29,a11); putU32(bytes,p+33,1);
  bytes.set([0x8b,0x5f,0x48,0x8b,0x04,0x9d],p+37); putU32(bytes,p+43,alt);
  bytes[p+47]=0xe8; putI32(bytes,p+48,callTarget-(p+52));
  bytes.set([0xeb,0x05],p+52);
  bytes[p+54]=0xa1; putU32(bytes,p+55,p1);
  bytes.set([0x8b,0x1d],p+59); putU32(bytes,p+61,p2);
  bytes.set([0x3b,0xd8,0x74,0x10],p+65);
  bytes.set([0x8b,0x5f,0x48,0x8b,0x04,0x9d],p+69); putU32(bytes,p+75,normal);
  bytes[p+79]=0xe8; putI32(bytes,p+80,callTarget-(p+84));
  const reset = p-20;
  bytes[p+84]=0xeb; bytes[p+85]=(reset-(p+86)) & 0xff;
  bytes.set([0xc7,0x05],reset); putU32(bytes,reset+2,a11); putU32(bytes,reset+6,0);
}

describe('1E.3F generic selection-semantics mechanics', () => {
  it('qualifies a code file-image base only from repeated agreeing continuation deltas', () => {
    const bytes = new Uint8Array(512);
    const base = 0x20;
    const starts = [40,100,160];
    for (const p of starts) {
      const continuation = p + 15;
      emitContinuation(bytes,p,continuation-base);
    }
    const anchors = scanCodeContinuationAnchors(bytes,0,bytes.length);
    const q = qualifyCodeImageBase(anchors,0,bytes.length,3);
    expect(q.status).toBe('QUALIFIED_CODE_FILE_IMAGE_BASE');
    expect(q.qualifiedBase).toBe(base);
    expect(q.agreeingAnchorCount).toBe(3);
  });

  it('does not qualify when continuation-derived bases disagree', () => {
    const bytes = new Uint8Array(512);
    emitContinuation(bytes,40,20);
    emitContinuation(bytes,100,60);
    emitContinuation(bytes,160,100);
    const q = qualifyCodeImageBase(scanCodeContinuationAnchors(bytes,0,512),0,512,3);
    expect(q.qualifiedBase).toBeNull();
  });

  it('recognizes the complete edge-triggered equality palette state machine', () => {
    const bytes = new Uint8Array(600);
    const p = 200, alt=0x1111, normal=0x2220, callTarget=500;
    emitSelectionMachine(bytes,p,alt,normal,callTarget);
    const m = findPaletteSelectionStateMachine(bytes,150,350,alt,normal);
    expect(m?.classification).toBe('VERIFIED_EDGE_TRIGGERED_CHARACTER_EQUALITY_PALETTE_LATCH');
    expect(m?.commonCallTargetPhysical).toBe(callTarget);
    expect(m?.tableIndexObjectFieldOffset).toBe(0x48);
    expect(m?.normalPostCallClearsLatch).toBe(true);
    expect(m?.transitions.map(t=>t.action)).toEqual([
      'APPLY_ALTERNATE_AND_SET_LATCH',
      'NO_PALETTE_CHANGE',
      'NO_PALETTE_CHANGE',
      'APPLY_NORMAL_AND_CLEAR_LATCH',
    ]);
  });

  it('rejects a selector whose two palette paths call different targets', () => {
    const bytes = new Uint8Array(600);
    const p = 200, alt=0x1111, normal=0x2220;
    emitSelectionMachine(bytes,p,alt,normal,500);
    putI32(bytes,p+80,520-(p+84));
    expect(findPaletteSelectionStateMachine(bytes,150,350,alt,normal)).toBeNull();
  });
});
