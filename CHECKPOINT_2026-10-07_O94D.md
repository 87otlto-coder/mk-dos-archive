# MK DOS Archive — O94D MK2 bounded PCM/WAV export qualification

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-O94C-source.zip`  
**Status:** **AUTHENTIC-FIXTURE VERIFIED / INDEPENDENT AUDIT PASSED / BOUNDED SOURCE-DOMAIN WAV EXPORT AUTHORIZED**

## Question for this pass

O94C established the authenticated mixer-readable U8 interval and left timing/rate semantics unresolved. O94D asks only whether the runtime evidence is now sufficient to export that bounded source interval as PCM WAVE without guessing.

Required proof targets:

1. source signedness across the actual one-, two-, and four-channel software mixer paths;
2. the roles of U8 header words at `+0x10` and `+0x12` in pointer-step calculation;
3. whether direct sample playback uses a pitch ratio that preserves the source rate represented by `+0x10`;
4. whether a deterministic mono 8-bit WAVE transform can be reversed byte-exactly to the authenticated source span;
5. whether that authorization can remain explicitly narrower than a bit-exact emulation of runtime mixed output.

## Authentic fixture identities

- `MK2.EXE`: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `RM.DRV`: `87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546`
- `GMI.BIN`: `7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633`

## Signed PCM is established

The authenticated Sound Images software mixer kernels at:

- `GMI+0x0CF8` — four simultaneous voices;
- `GMI+0x0DE2` — two simultaneous voices;
- `GMI+0x0E68` — one voice;

all follow the same source-sample operation:

1. load one source byte into `AL` from `ES:[BX]`;
2. execute signed `IMUL r/m8` against the channel volume byte;
3. accumulate the signed product;
4. convert to unsigned 8-bit output around midpoint `0x80`.

Therefore the U8 source stream is **signed 8-bit PCM** for these authenticated mixer paths. The mixer-channel count refers to simultaneous mono voices, not interleaved stereo source channels.

For PCM WAVE, 8-bit samples are stored unsigned. The bounded source-domain adapter therefore uses:

`wavByte = sourceByte XOR 0x80`

Reversing the same transform recovers the original active U8 bytes exactly.

## `+0x10` / `+0x12` rate and pitch contract

The Sound Images pitch routine at `GMI+0x0AFD` is authenticated by exact machine-code signature.

Its 16.16 source-pointer step is proportional to:

`notePitch × U16(+0x10) / ( U16(+0x12) × mixerOutputRate )`

The direct U8 sample-start routine at `GMI+0x0F03` explicitly loads note **60 / 0x3C** before calling `0x0AFD`.

The driver note table at `GMI+0x102B` yields for note 60:

- table word 0 = `16777`;
- octave shift = 6;
- `16777 >> 6 = 262`.

Every one of the **312/312** authentic U8 files contains:

`U16(+0x12) = 262`.

Therefore, on this qualified direct sample path, the note-pitch/reference-pitch ratio is exactly unity before fixed-point quantization, and the step reduces to the relationship:

`U16(+0x10) / mixerOutputRate`.

This establishes U8 `+0x10` as the **source sample-rate term** for the direct sample path.

Corpus distribution:

- **190** files: 11025 Hz
- **122** files: 22050 Hz

The mixer output-rate state is independently connected to GMI API `AH=0x10`, dispatching to `0x0C5A`, which stores caller `CX` in state word `0x1302`. Initialization writes `16000` to that state. The output rate is therefore configurable; this does not weaken the identification of `+0x10` because it is the numerator/source-rate term in the ratio.

### Fixed-point quantization note

At the initialized 16000-Hz mixer rate, the authentic arithmetic produces:

- source 11025 -> step `0x0000B065` -> effective 11024.658203125 source samples/s;
- source 22050 -> step `0x000160CC` -> effective 22049.8046875 source samples/s.

This small discrepancy is the driver's 16.16 integer quantization. O94D therefore authorizes a **source-domain** WAV at the header source rate; it does **not** claim that the WAV is a bit-exact recording of the resampled/mixed runtime output stream.

## Export interval carried from O94C

O94D does not broaden the range claim.

The WAV contains only the authenticated mixer-readable interval:

`[ U32(+0x00), U32(+0x04) )`

with the canonical corpus satisfying zero high words, `+0x00 = 32`, and zero loop fields.

Unread-byte population remains:

- **308 files:** 33 bytes outside the active interval;
- **4 files:** 1 byte outside the active interval.

The purpose of those excluded bytes remains **UNKNOWN**. They are preserved only in the byte-exact original U8 copies and are not included in the WAV.

## Generated bounded package

`MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip`

Contents:

- 312 byte-exact original U8 files;
- 312 bounded mono 8-bit PCM WAV files;
- `manifest.json`;
- `README.md`.

Package results:

- entries: **626**
- bytes: **7,088,581**
- SHA-256: `221d44171646075b6d13ed7de4dacd1854510718afd5fd33d5d91855b1ae51a3`

Every WAV was parsed structurally and reverses exactly back to its authenticated active U8 byte span after XOR `0x80`.

A separate Python WAVE parser pass over the generated package reported:

- **312 WAVs**
- **0 invalid WAVs**
- rates: 190 × 11025 Hz, 122 × 22050 Hz
- mono, 8-bit PCM throughout

## Independent verification

Project implementation:

- `src/games/mk2/research/u8PcmExportQualification.ts`
- `scripts/run-mk2-u8-o94d-pcm-export-qualification.mjs`
- evidence: `evidence/mk2/mk2_u8_o94d_pcm_export_qualification.json`

Independent implementation that does not import the TypeScript pass:

- `scripts/verify-mk2-u8-o94d-pcm-export-qualification.py`
- evidence: `evidence/mk2/o94d-independent-audit.json`

Authentic-fixture result:

- TypeScript O94D: **SUCCESS**
- independent Python audit: **23 checks, 0 failures**
- source-rate distribution: **190 / 122**
- unread-byte distribution: **308 × 33 / 4 × 1**
- bounded source-domain WAV export: **AUTHORIZED**

## Development-gate corrections caught during this pass

Two self-checks failed during implementation and were corrected before any package was accepted:

1. the first verifier read the `0x3E80` initializer immediate two bytes too late; the gate rejected the result and the offset was corrected from `0x850` to `0x84E`;
2. the initial fixed-point acceptance tolerance was too strict for the authentic 11025-Hz quantized step (`11024.6582...`), so the check was changed to reflect the actual driver arithmetic rather than forcing an exact ideal ratio.

No failed intermediate package was promoted.

## O94D decision

**VERIFIED, bounded:**

- source encoding is signed 8-bit PCM on the authenticated software mixer paths;
- each U8 is a mono source stream;
- direct sample start uses note 60;
- note 60 resolves to 262, exactly matching U8 `+0x12` in all 312 files;
- U8 `+0x10` is the source-rate term and is 11025 or 22050 Hz;
- O94C's `[start,end)` active interval can be exported deterministically as mono 8-bit PCM WAVE by XORing each active byte with `0x80`;
- the generated WAV payload reverses exactly to the active source bytes.

**Still explicitly NOT claimed:**

- meaning of bytes outside `[start,end)`;
- why the two disk end conventions exist;
- bit-exact emulation/capture of the runtime resampler, mixer saturation/voice combination, hardware DMA cadence, or audible hardware output;
- gameplay event naming for individual sample files.

Verdict:

`O94D_BOUNDED_SOURCE_DOMAIN_WAV_EXPORT_AUTHORIZED`

## Next pass — superseded by the research-completion roadmap

The digital U8 source-domain export contract is closed enough for **later** product integration, but the user has explicitly deferred extractor/product work until MK2, then MK1, then MK3 are research-closed for extractor scope.

The former recommendation to proceed directly to **O94E browser integration** is therefore superseded.

Current next step:

**MK2 completion audit and remaining forensic closure.**

Read `MK_DOS_Archive_MASTER_HANDOFF_2026-10-07_FULL_PROJECT_THROUGH_O94D_RESEARCH_ROADMAP.md` before continuing. MK2 must not be called closed until its remaining animation, stage/background/dynamic, palette, graphics-coverage, music/audio and extractor-relevant unknown-resource gates are accounted for. After MK2 closure, return to MK1 and finish it; then finish MK3; only then begin extractor definition with a user-led UI/usability discussion.
