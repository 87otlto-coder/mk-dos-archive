# MK DOS Archive — source continuation checkpoint through O92

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-source.zip`  
**Continuation status:** source hardening implemented and mechanically targeted-tested; MK2 U8 research tightened but WAV export remains intentionally blocked.

This checkpoint is an addendum to `CHECKPOINT_2026-10-07.md` and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-07_FULL_PROJECT.md`. The earlier documents remain authoritative for the established MK1/MK2/MK3 forensic corpus. This file records only the takeover work performed after that package.

## O91 — browser source normalization and runtime hardening

### Source-root bug found

The fallback folder picker (`<input webkitdirectory>`) supplied paths such as `MK1/GRAPHICS/KANO.GRA`, while the native File System Access implementation supplied `GRAPHICS/KANO.GRA`. Exact resource joins therefore depended on which picker API had been used. A ZIP whose contents were wrapped in a single `MK1/`, `MK2/` or `MK3/` folder had the same mismatch.

### Fix

- `FileListDirectorySource` now strips the selected `webkitdirectory` root component so all paths are relative to the selected game directory.
- `ZipDirectorySource` now strips exactly one common wrapper directory only when every entry is under that wrapper **and** the wrapper contains a direct `MK1.EXE`, `MK2.EXE` or `MK3.EXE`.
- Root-level ZIPs are unchanged.
- Unsafe/duplicate ZIP checks remain active.
- Folder/ZIP file inputs reset after use so the same source can be selected again.

### Preserved mechanical test

`scripts/test-source-root-normalization.cjs` compiles only the filesystem source with the globally available TypeScript compiler, builds synthetic stored ZIPs and browser `File` objects, and checks:

1. root-level ZIP -> `MK1.EXE`, `GRAPHICS/KANO.GRA`;
2. wrapper-folder ZIP -> the same normalized paths;
3. `webkitdirectory` paths `MK1/MK1.EXE` and `MK1/GRAPHICS/KANO.GRA` -> the same normalized paths;
4. reads of normalized `MK1.EXE` resolve the expected MZ bytes.

Current result: **PASS**.

### Browser state hardening

`AssetBrowser.tsx` was tightened without changing forensic semantics:

- export queue entries now have occurrence keys, so a frame can intentionally appear more than once in a presentation chain;
- Ctrl/Command and Shift selection behavior remains available, while `Duplicate` explicitly adds another occurrence;
- removing a queued item removes that occurrence only;
- stale scan results are rejected with a run token + abort controller when the source/game changes;
- preview stops when the queue becomes empty;
- APNG/sheet actions fail closed when selected assets are not suitable graphics;
- numeric timing/column/canvas inputs are clamped/sanitized;
- the generic composition canvas now supports direct pointer dragging of existing opaque layers and explicit front/back reordering;
- total canvas pixel area is bounded before allocation.

`MidiPreview.tsx` was also hardened:

- a replacement soundbank is loaded into a fresh candidate engine first; the working engine is swapped only after the new bank succeeds;
- failed replacement does not destroy the previous usable engine;
- `songEnded` updates the UI when playback ends naturally;
- `midiError` is surfaced and stops the playing state;
- source changes pause playback;
- file input resets allow the same bank to be reselected;
- unmount disposal closes the sequencer/synth/audio context defensively.

Targeted TypeScript checks for the modified browser components passed using local declaration shims. A full Vite production rebuild was **not** possible in the takeover execution environment because the source archive intentionally excludes `node_modules` and the package transport timed out. Therefore the included prebuilt `dist/` still represents the earlier October 7 build; O91 is a **source checkpoint**, not a claim that the downloadable prebuilt UI contains these new changes yet.

## O92 — MK2 U8 digital-audio reconnaissance

### Canonical disk observations carried forward and formalized

The canonical MK2 installation contains **312** `fx/*.U8` files with a **32-byte** observed header.

Retained authentic-fixture observations:

- dword `+0x00` = 32;
- u16 `+0x10` = 11025 or 22050;
- u16 `+0x12` = `0x0106` / 262;
- other observed auxiliary header dwords are zero;
- 308 files satisfy `endField = (fileBytes - 32) - 1`;
- exactly four files instead satisfy `endField = fileBytes - 1`:
  - `gong.u8`;
  - `liu-kang.u8`;
  - `thunder.u8`;
  - `thundsht.u8`.

The inventory still independently reproduces the 308/4 split from each file size and first eight bytes. The four exceptional size/end pairs are:

| file | bytes | +4 field |
|---|---:|---:|
| `gong.u8` | 24,908 | 24,907 |
| `liu-kang.u8` | 17,046 | 17,045 |
| `thunder.u8` | 36,231 | 36,230 |
| `thundsht.u8` | 11,296 | 11,295 |

### Sound Images GMI runtime contract

The retained disassembly is tied to canonical `GMI.BIN` SHA-256:

`7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633`

Anchored routines establish the following runtime descriptor behavior:

- `0x0F03` sample start:
  - low word `+0x00` is added to the descriptor base -> runtime sample-start offset;
  - high word `+0x02` is skipped by this 16-bit path;
  - low word `+0x04` is copied directly into the mixer end/limit slot, with no descriptor-base addition here;
  - high word `+0x06` is skipped;
  - low word `+0x08` is zero-or-relative loop restart; nonzero is added to descriptor base;
  - pitch step is derived through `0x0AFD`.
- `0x0CF3` mixer:
  - reads while current offset `<` end/limit;
  - reads the sample byte directly and performs signed `IMUL` by channel volume;
  - advances the pointer with a 16.16 fixed-point step;
  - when the limit is reached it jumps to a nonzero loop restart or contributes no further sample;
  - mixed output is converted with `+0x80` before the unsigned 8-bit output byte is written.
- `0x0E9C` marks a non-looping channel complete once current reaches end.
- `0x0AFD` uses descriptor words at `+0x10` and `+0x12` in the pitch-step ratio. The driver defaults its output/mixer rate word to 16000 and direct sample start calls the pitch routine with MIDI note 60. The values 11025/22050 and 262 therefore strongly support `+0x10` as source sample rate and `+0x12` as a reference/base pitch near C4, but the human semantic name of `+0x12` remains **INFERRED**, not promoted as a universal file-format label.

### Critical unresolved join

The driver runtime structure and the disk header are **not yet proven to be byte-for-byte identical at playback time**. In particular, runtime `+0x04` is compared as the absolute end/limit while the canonical disk files contain two incompatible-looking `+0x04` conventions. The MK2.EXE bridge previously located around physical `0x815CE..0x81621` loads the file and hands state to the real-mode driver, but the complete mutation/fixup of the loaded descriptor has not been closed.

Therefore O92 explicitly keeps:

- exact disk PCM export range: **UNRESOLVED**;
- disk-to-runtime end-field transformation: **UNRESOLVED**;
- WAV adapter: **NOT AUTHORIZED**;
- raw U8 originals: preserve byte-for-byte.

New source: `src/games/mk2/research/u8DigitalAudioReconnaissance.ts` and `scripts/run-mk2-u8-digital-audio-reconnaissance.mjs`. The runner is designed to require the authentic O67 fixture, canonical MK2.EXE and canonical GMI.BIN identity, census all 312 headers, require the exact 308/4 partition, and still return `wavAdapterAuthorized:false` until a later loader pass establishes the disk-to-runtime transformation.

The authentic MK2 fixture bytes are not present in this takeover execution environment, so this new O92 runner has **not** been rerun against the 312 files here. Its TypeScript source compiles in a targeted check. This is deliberately recorded as a fixture-rerun boundary rather than silently upgrading retained evidence into a new independent validation.

## Current continuation state

O91 materially improves the source UX/reliability but awaits a fresh Vite build and real three-game browser regression on the user's fixtures. O92 narrows the MK2 U8 model and proves why a naïve `file+32 -> WAV` adapter would be premature.

### Next highest-value actions

1. On a machine with the MK fixtures and installed npm dependencies, run `npm run lint`, `npm run build`, `npm run smoke:source-root-normalization`, then exercise MK1/MK2/MK3 folder + ZIP paths through the browser and the new queue/canvas/MIDI state handling.
2. Run `npm run smoke:mk2-u8-recon -- <MK2 fixture directory>` to re-establish the full 312-file header census from bytes.
3. Continue the MK2 executable loader bridge from physical `0x815CE..0x81621`; identify every write/fixup to header/runtime fields before calling an exact PCM range.
4. Only after that join closes, add signed-PCM -> WAV export with originals retained and independent sample-count/range checks.
5. If the loader contradicts the retained header interpretation, stop and update the model rather than normalizing the four exceptions.

## Hard boundaries unchanged

No MK1 semantics are generalized into MK2/MK3. Palette compatibility is not ownership. Indexed decode is not color proof. Scheduler ticks are not milliseconds. Visual X/Y is not gameplay collision. Unknown bytes/resources remain preserved. No canonical source executable is overwritten.
