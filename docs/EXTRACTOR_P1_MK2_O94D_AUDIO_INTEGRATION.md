# MK DOS Extractor — P1: Qualified MK2 Sound Effects in Asset Library

Status: **HEADLESS REAL-FIXTURE VERIFIED / FULL VITE BUILD AND UI VALIDATION PENDING**  
Date: 2026-11-03  
Starting source: user-supplied `MK_DOS_Archive_Source_O270_Pit_II_Framebuffer_2026-10-31(1).zip`  
Research custody: O282 cumulative archive remains unchanged. O283 is deferred pending an extractor-specific blocker.

## Product reason

The main MK2 Asset Library could already browse indexed graphics and a limited set of palette-bound sprites, plus music exports, but did not expose the 312 qualified `FX/*.U8` samples. The existing O94A/B/C/D research qualified source-domain mono PCM WAV export. P1 **integrates the existing authorized converter** rather than introducing a new interpretation or gameplay/audio-driver research.

## Changes

- `src/core/assets/mk2Pipeline.ts`: after the existing graphics chain, run the unchanged O94A → O94B → O94C → O94D qualification chain; propagate its verified WAVs and preservation ZIP, and keep a clear failure reason if a noncanonical corpus cannot qualify. Audio qualification failure does not discard independently qualified graphics.
- `src/core/assets/collection.ts`: expose the verified WAV outputs as 312 playable/downloadable `audio` assets in `MK2 original sound effects`, with original source byte interval and SHA metadata. Attach `MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip` in the existing evidence downloads. Report the exact O94D verdict or a non-qualification reason.
- `scripts/verify-extractor-mk2-audio.mjs`: dependency-free (apart from installed `tsc`) real-installation smoke check that compiles and runs the **actual updated collection/pipeline**, verifies 312 audio assets and their rates, the preservation ZIP, and selected-asset ZIP export of three WAVs.

No game binaries, original code research modules, O270 evidence, or O282 records were changed. No compiler/editor functions were expanded.

## Exact validation performed

1. Source archive ZIP integrity: PASS.
2. Original MK2.EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` (canonical).
3. O270 framebuffer research verifier independently matched archived output; 31 negative controls rejected.
4. O94D original-source Python verifier: PASS 19/19 checks.
5. O94D existing TypeScript compiler/runner produced the exact existing package hash `221d44171646075b6d13ed7de4dacd1854510718afd5fd33d5d91855b1ae51a3`, containing 312 original U8 files and 312 WAV files.
6. O94D independent ZIP verifier: PASS 23/23 checks, including exact WAV and original U8 byte comparisons.
7. Targeted TypeScript type check for both changed core modules and their import graph, using a minimal Node declaration for missing development-only `process`: PASS.
8. Integrated `scanAssets(source,'mk2')` real-installation headless smoke: PASS — 4,950 total assets, 312 playable WAV assets, 190 at 11,025 Hz and 122 at 22,050 Hz, O94D verdict SUCCESS, and selected three-WAV ZIP with manifest.

Run test locally:

```bash
node scripts/verify-extractor-mk2-audio.mjs /path/to/original/mk2-install /path/to/result.json
```

Windows example:

```bat
node scripts\verify-extractor-mk2-audio.mjs "C:\GAMES\MK2" "C:\TEMP\mk2-audio-smoke.json"
```

## Known validation gap

A full `npm ci`, `npm run build`, `npm run lint`, browser-level file-picker scan, audio playback and download UI exercise were **not** executed here because required npm registry dependencies were unavailable. The headless test exercises actual source pipeline integration and selected ZIP export; it does not establish a successful production web build or user-visible UI operation. Re-run the normal complete suite in a development environment with dependencies available before promoting to an application release.

## Qualification boundaries

- 312 canonical MK2 U8 samples only; original source audio bytes are signed 8-bit mono; WAV sample payload is unsigned bytes XOR 0x80, with source rate 11,025 Hz or 22,050 Hz.
- Only the authenticated mixer-readable `[start,end)` source interval is converted. Excluded trailing bytes remain preserved in original U8s in the separate O94D package. Unknown tail semantics remain unknown.
- The converted WAVs reproduce source-domain PCM, **not** the bit-exact runtime mixer output.
- No palette ownership, stage timing, fatality rendering behavior or gameplay semantics are asserted or changed.

## Next extractor action

After full UI validation, audit asset classification and integration pathways for MK2 animations/background layers. Consolidate known qualified exports into searchable, reusable assets; research new mechanisms only when the extractor demonstrably cannot provide a required view/export without them. Maintain coverage and extractor-readiness as separate scores across MK1/MK2/MK3.
