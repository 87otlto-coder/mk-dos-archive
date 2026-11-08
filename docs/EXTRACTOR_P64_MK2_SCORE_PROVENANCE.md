# P64 — MK2 score provenance, native termination evidence and MIDI export checks

Date: 2026-11-08. Third interim pass of the P62–P66 cycle. `develop` only; `main` stays at P16. Last complete original-MK1/MK2/MK3 acceptance remains P61 (17,211 asset representations), while P62 and P63 are accepted focused audio passes. This handoff records P64 **source-only CI PASS and independent original MK2 score-input inspection PASS; current full-collection MK2 P64 fixture runner VALIDATION PENDING**.

## OBSERVE

The existing MK2 extractor already exposes raw `SOUND/*.MID` Sound Images Gen2 source data and one-traversal driver-derived MIDI. `src/core/assets/mk2Music.ts` reconstructs note/controller events, decoded tempo instructions and the `0x91` stop vs `0x98` repeat boundary. It records an optional `0x9C` saved cursor (or track start when no saved cursor is present). It does **not** prove the runtime repeat duration, scheduler details or original instrument timbre. The original score archive was already independently researched in O109; new gameplay-driver research was not needed.

The catalogue's raw/MIDI assets and selected export manifests had original score paths and lengths but **no original byte SHA-256 or explicit source-track stop/repeat provenance**. As a result, it was harder to verify or reuse a MIDI export while maintaining the exact originating score identity.

A private, independent read of the user-uploaded `mk2.zip` found the canonical `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, **33 original `SOUND/*.MID` scores / 102,971 source bytes / 212 native track streams**. Exactly **82** streams terminate at `0x98` native repeat boundaries, **130** at `0x91` stop boundaries. Original sources yielded 96 ticks per quarter note throughout. This is original-file input verification, not a claim that the updated full extractor was run against a local original MK2 directory in this development session.

## IMPLEMENT

- `src/core/assets/mk2MusicProvenanceP64.ts` wraps the existing proven `decodeMK2Music` / `writeMidi` without changing the actual decoder or MIDI encoder. For every original score it adds `source.sha256`, exact original `[0,length)` byte range, and separate export SHA-256/length. The raw original bytes remain a separate downloadable `raw:` asset, and the generated one-traversal SMF remains the existing `midi:` asset. Filenames, source asset IDs and decoded MIDI remain unchanged.
- A `p64ScoreProvenance` object in both asset metadata records per-track original start/end byte offsets, terminal opcode offset, `0x91` stop or `0x98` repeat identity, the pre-existing saved cursor offset where applicable, and the **one-traversal** logical end tick. Each repeated stream explicitly flags **native repeat period and runtime repeat count UNVERIFIED**. Tempo scheduler and native synthesis are also unverified. These metadata fields flow into the existing selected-export `manifest.json` without requiring a new ZIP type.
- `src/core/assets/collection.ts` calls the helper for original MID files, retaining the same two assets per qualified score. Invalid scores preserve their raw original export with explicit `UNAVAILABLE` status/reason, **not** a speculative MIDI. Path/filename evidence mismatches raise an explicit error rather than silently joining unrelated files.

No source binary, original music, generated MIDI, sprite, screenshot or copyrighted artwork is committed to Git. The forensic workbench, P61 regression and existing graphics/audio adapters are preserved.

## TEST

**Source-only GitHub CI — VERIFIED.** [Run 42462511221](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42462511221) completed **SUCCESS** on source/workflow SHA `4155ffb8ee911b1ae5717e0ce6156036e88dddcc`. It syntax-checks the P64 source-only and original-fixture runners; `scripts/test-p64-mk2-score.cjs` exercises one synthetic score with both native termination types, SHA/source extents and original-versus-MIDI separation and rejects **eight** invalid source/decoder cases. All previous source-only controls, Git tracked-file guard, TypeScript, production build and offline headless Chrome startup passed. This source-only CI does not run original DOS installations.

**Independent original MK2 source-input readback — VERIFIED IN PRIVATE CONVERSATION RUNTIME.** User-provided original `mk2.zip` was read directly, with no checkout or saved media files. Original executable hash, all 33 source scores, 212 bounded native tracks, 82 `0x98` repeat boundaries and 130 `0x91` stops matched the expected evidence. This did not execute the P64 application code or test selected ZIP exports.

**Current P64 full-collection fixture acceptance — VALIDATION PENDING.** `scripts/verify-mk2-p64-scores.cjs` is committed and syntax-checked, but was **not run** against the complete current checkout + canonical original MK2 installation in this chat session. It independently parses every original stream into timestamped source events, checks all track boundaries, source hashes, event/tempo order, one-pass MIDI track format, 66 raw+MIDI selected ZIP payloads/manifest records and unchanged **5,369 MK2 assets**. It requires exactly 33 scores, 212 tracks, 82 repeat boundaries and 130 stops, and does not mistake the one-pass MIDI for faithful original looping audio.

Local original-file command:

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
node scripts/verify-mk2-p64-scores.cjs `
  "E:\GOG\Games\Mortal Kombat 2\mk2" `
  "C:\Temp\mkdos-p64-score-results.json"
```

**Expected fixture verdict (not yet observed):** `pass:"P64"`, `status:"PASS"`, `mk2Assets:5369`, `originalScores:33`, `originalStreams:212`, `repeatBoundaries:82`, `stopBoundaries:130`, `selectedZipScoreEntries:66`. A failure must be investigated and re-tested before claiming full P64 original-fixture acceptance.

## CLASSIFY AND CONTINUE

**VERIFIED:** Existing source-decoder approach retained; authentic original input census 33/212/82/130; SHA-bearing source and selected-MIDI provenance adapter passes synthetic controls; full GitHub source-only CI PASS.

**VALIDATION PENDING:** integrated original-file source, output MIDI event order and selected export manifest verified by newly committed full-collection runner; new original-browser source picking/music preview and interactive downloads; no fresh complete three-game regression.

**UNKNOWN:** actual runtime repetition count/duration, exact hardware tempo scheduler behavior, native instrument patch/timbre, meaning of individual music files beyond original filenames, and soundbank rendering fidelity.

**P65:** prioritize a bounded source-qualified animation ordering/export gap; preserve user-set presentation cadence vs native timing. **P66:** fifth-pass complete current original MK1/MK2/MK3 baseline and accepted P62–P65 focused fixture/negative tests, source audit and checkpoint. Keep `main` untouched until separately justified.
