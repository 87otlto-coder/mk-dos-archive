import { describe, it, expect } from 'vitest';
import {
  detectFileSignature,
  getExtendedHeaderOffset,
} from '../core/discovery/signatures';

function createSyntheticMzWithExtendedHeader(
  sig: 'LE' | 'LX' | 'NE' | 'PE',
  newHeaderOffset = 0x40,
): { initialSlice: Uint8Array; secondarySlice: Uint8Array; offset: number } {
  const initialSlice = new Uint8Array(64);
  // DOS MZ signature at offset 0
  initialSlice[0] = 0x4d; // 'M'
  initialSlice[1] = 0x5a; // 'Z'

  // Write new header offset at 0x3C (uint32LE)
  initialSlice[0x3c] = newHeaderOffset & 0xff;
  initialSlice[0x3d] = (newHeaderOffset >> 8) & 0xff;
  initialSlice[0x3e] = (newHeaderOffset >> 16) & 0xff;
  initialSlice[0x3f] = (newHeaderOffset >> 24) & 0xff;

  // Secondary slice containing extended header identifier
  const secondarySlice = new Uint8Array(8);
  secondarySlice[0] = sig.charCodeAt(0);
  secondarySlice[1] = sig.charCodeAt(1);

  return { initialSlice, secondarySlice, offset: newHeaderOffset };
}

describe('Signature Detection', () => {
  it('detects standard DOS MZ executable', () => {
    const mzHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const res = detectFileSignature(mzHeader, 'GAME.EXE', 'EXE');

    expect(res.classification).toBe('executable');
    expect(res.signature.kind).toBe('DOS MZ Executable');
    expect(res.signature.confidence).toBe('verified');
  });

  it('detects synthetic DOS MZ + LE executable (Watcom / DOS4GW) via two-stage bounded read', () => {
    const { initialSlice, secondarySlice, offset } =
      createSyntheticMzWithExtendedHeader('LE', 0x180);

    const extOffset = getExtendedHeaderOffset(initialSlice, 500000);
    expect(extOffset).toBe(0x180);

    const res = detectFileSignature(
      initialSlice,
      'MK2.EXE',
      'EXE',
      secondarySlice,
      offset,
    );

    expect(res.classification).toBe('executable');
    expect(res.signature.kind).toBe('DOS MZ / LE');
    expect(res.signature.confidence).toBe('verified');
    expect(res.signature.details).toContain('Linear Executable');
  });

  it('detects synthetic DOS MZ + NE executable (16-bit Protected Mode)', () => {
    const { initialSlice, secondarySlice, offset } =
      createSyntheticMzWithExtendedHeader('NE', 0x80);
    const res = detectFileSignature(
      initialSlice,
      'PROT16.EXE',
      'EXE',
      secondarySlice,
      offset,
    );

    expect(res.classification).toBe('executable');
    expect(res.signature.kind).toBe('DOS MZ / NE');
    expect(res.signature.confidence).toBe('verified');
  });

  it('detects synthetic DOS MZ + PE executable (32-bit Win/DOS Extender)', () => {
    const { initialSlice, secondarySlice, offset } =
      createSyntheticMzWithExtendedHeader('PE', 0x100);
    const res = detectFileSignature(
      initialSlice,
      'MK3.EXE',
      'EXE',
      secondarySlice,
      offset,
    );

    expect(res.classification).toBe('executable');
    expect(res.signature.kind).toBe('DOS MZ / PE');
    expect(res.signature.confidence).toBe('verified');
  });

  it('detects Miles AIL3 Digital Audio Driver (AIL3DIG) as support_driver', () => {
    const ailHeader = new Uint8Array([
      0x41, 0x49, 0x4c, 0x33, 0x44, 0x49, 0x47, 0x1a,
    ]); // 'AIL3DIG\x1A'
    const res = detectFileSignature(ailHeader, 'SB16.DIG', 'DIG');

    expect(res.classification).toBe('support_driver');
    expect(res.signature.kind).toBe('Miles AIL3 Digital Driver');
    expect(res.signature.confidence).toBe('verified');
    expect(res.signature.details).toContain('Miles Sound System');
  });

  it('detects Standard MIDI (MThd) vs non-standard/raw .MID file', () => {
    const smfHeader = new Uint8Array([
      0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
    ]); // 'MThd'
    const smfRes = detectFileSignature(smfHeader, 'SONG.MID', 'MID');
    expect(smfRes.classification).toBe('audio_candidate');
    expect(smfRes.signature.kind).toBe('Standard MIDI File (SMF)');
    expect(smfRes.signature.confidence).toBe('verified');

    // Raw/non-standard MID file without MThd prefix (must NOT be assumed to be Standard MIDI)
    const rawMidHeader = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const rawRes = detectFileSignature(rawMidHeader, 'SONG.MID', 'MID');
    expect(rawRes.classification).toBe('audio_candidate');
    expect(rawRes.signature.kind).toBe('Unknown Binary');
    expect(rawRes.signature.confidence).toBe('unknown');
  });

  it('detects RIFF WAVE audio', () => {
    const wavHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]); // 'RIFF....WAVE'
    const res = detectFileSignature(wavHeader, 'SAMPLE.WAV', 'WAV');
    expect(res.classification).toBe('audio_candidate');
    expect(res.signature.kind).toBe('WAV Audio');
    expect(res.signature.confidence).toBe('verified');
  });

  it('detects Ogg Container', () => {
    const oggHeader = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02]); // 'OggS'
    const res = detectFileSignature(oggHeader, 'TRACK01.OGG', 'OGG');
    expect(res.classification).toBe('audio_candidate');
    expect(res.signature.kind).toBe('Ogg Container');
    expect(res.signature.confidence).toBe('verified');
  });

  it('detects MK3 MFIL Fighter Container and FORM DATA.MK3 Container', () => {
    const mfilHeader = new Uint8Array([0x4d, 0x46, 0x49, 0x4c, 0x00, 0x00]); // 'MFIL'
    const mfilRes = detectFileSignature(mfilHeader, 'BLADE.FTR', 'FTR');
    expect(mfilRes.classification).toBe('data_candidate');
    expect(mfilRes.signature.kind).toBe('MFIL Container Candidate');
    expect(mfilRes.signature.confidence).toBe('inferred');

    const formHeader = new Uint8Array([0x46, 0x4f, 0x52, 0x4d, 0x00, 0x10]); // 'FORM'
    const formRes = detectFileSignature(formHeader, 'DATA.MK3', 'MK3');
    expect(formRes.classification).toBe('data_candidate');
    expect(formRes.signature.kind).toBe('FORM Container Candidate');
    expect(formRes.signature.confidence).toBe('inferred');
  });

  it('detects unknown binary files and classifies candidate extensions', () => {
    const rawData = new Uint8Array([0x00, 0x1f, 0x8b, 0x08, 0x00, 0x00]);
    const graRes = detectFileSignature(rawData, 'CAGE.GRA', 'GRA');
    expect(graRes.classification).toBe('graphics_candidate');
    expect(graRes.signature.kind).toBe('Unknown Binary');
    expect(graRes.signature.confidence).toBe('unknown');

    const sndRes = detectFileSignature(rawData, 'THEME.SND', 'SND');
    expect(sndRes.classification).toBe('audio_candidate');

    const datRes = detectFileSignature(rawData, 'CHARS.DAT', 'DAT');
    expect(datRes.classification).toBe('data_candidate');

    const unkRes = detectFileSignature(rawData, 'UNKNOWN.FOO', 'FOO');
    expect(unkRes.classification).toBe('unknown');
  });

  it('detects plain text documentation files', () => {
    const textData = new TextEncoder().encode(
      'README / INSTRUCTIONS\r\nVersion 1.0',
    );
    const res = detectFileSignature(textData, 'README.TXT', 'TXT');
    expect(res.classification).toBe('text_document');
    expect(res.signature.kind).toBe('ASCII Text Document');
  });
});
