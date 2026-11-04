# MK DOS Archive — Verified O177–O181 original MK2 effect extraction and source-edit preflight

Date: 2026-10-13. Current source authority: **O181**. Primary objective remains MK2 extractor/compiler, followed by MK1 and MK3. All original `MK2.EXE`, `RM.DRV`, `.GRA` are user-supplied inputs only, and no original commercial binaries/resources are placed in the source release. User removed research pass-count limits; continue only while findings are independently verifiable, not to fill a quota.

## What changed

### O177: One-click original 43-frame effect archive

The O122/Tomb/Portal stage viewer now optionally loads **both** Tomb and Portal `.GRA` resources as well as Tower for six authenticated original effect sequences, and offers a single-click **all 43** export (disabled if any original resource is unavailable or fails verification). A standalone Node producer uses the same source-backed frame decoder. It outputs a STORE-only ZIP with 131 entries: 43 source-palette RGBA PNG previews, 43 raw indexed-pixel planes, 43 0/1 opacity masks, `manifest.json` and `README.md`. All frame dimensions, signed source X/Y offsets, source list/pointer origins, compressed-GRA offsets and loop/termination controls are retained. Source maps never become invented displayed screen coordinates.

Source code:
- `src/games/mk2/research/stageOriginalEffectArchiveO177.ts`
- `src/games/mk2/research/stageSourcePngO177.ts`
- `src/components/MK2IndexedStageMosaicsO122.tsx`
- `scripts/run-mk2-o177-original-effect-archive.mjs`
- `tools/mk2_o177/verify_original_effect_archive_independent.py`
- `tools/mk2_o177/test_o177_independent.py`

**Real-fixture proof**: ZIP exported from original 861,133-byte MK2.EXE and original Tomb/Portal/Tower `.GRA`; the standalone Python verifier independently parses all RGBA PNG scanlines and ZIP member CRCs, checks each original frame against O136 and O137 trusted Python manifests, and passes **988 assertions**. Nine forged ZIP cases are rejected. Twelve original O177 producer input-hardening tests passed, expanded to **15** after O181. Full React browser build remains unavailable (dependencies missing, npm registry unreachable); targeted TypeScript module type-check and JSX syntax transpilation passed. The extracted 43-frame ZIP is a **user-derived asset artifact**, kept separate from source distribution.

### O178: Source-encoded segment geometry and no-edit round trip

The 43 source frame streams occupy distinct, contiguous, gapless spans within their original resources, checked from original LE-backed EXE descriptor pointers, GRA bytes, and Python source-stream hashes:

| Stage | Frames | Original GRA byte range [start,end) | Span bytes |
| --- | ---: | --- | ---: |
| Tomb | 16 | `[0xD438,0xF920)` | 9,448 |
| Portal | 20 | `[0x8C48,0xDE54)` | 21,004 |
| Tower | 7 | `[0x9F48,0xDBCC)` | 15,492 |

(Note: hex range boundaries are displayed for readability; the authoritative decimal boundaries reside in `O178_REPORT.json`.)

The preflight copies each original encoded span into a whole-resource clone without changes and requires the SHA256 of **all original GRA bytes** to remain exact. It does **not** enable a variable-length reassembler, graphics relocation or game-authenticated source writing. Producer checked 215 facts, independent source verifier checked 236. Reports: `research_outputs/O178_REPORT.json`.

### O179: One-byte literal-index, one-pixel, same-length compiler experiment

For one frame each from Tomb, Portal, and Tower, the checked `RLE` decoder locates a literal palette-index byte inside an exact source descriptor's encoded span, changes that byte in a **private bytearray clone**, confirms exactly **one opaque indexed pixel changed**, that the original 0/1 mask and RLE command structure are unchanged, that the whole `.GRA` length is unchanged, and that reversing the sole byte recovers the full original source SHA256. Three independent verifications passed (21 explicit assertions per stage). User-owned modified test GRA bytes were used for local validation only and are not distributed in source or tool releases. Reports `O179_REPORT.json`, `O179_PORTAL_REPORT.json`, `O179_TOWER_REPORT.json` retain **hashes, indices, offsets and uncertainty**, no raw proprietary payload.

This is **STATIC AUTHORING RESEARCH**. A renderer-valid read-only re-decode is not game execution. Nothing establishes DOSBox acceptance of edited GRA, live sprite activation, in-game palette, or write safety beyond one equal-length literal byte. The compiler intentionally rejects modified/noncanonical authoring inputs and refuses overwriting requested outputs.

### O180: 43/43 static pixel-edit census

O179's source-reversible one-literal-pixel operation was repeated independently against **all 43 original source frames**, without writing a game-data file to the repository or editing the original resources. Each proof changes exactly one indexed opaque pixel, preserves all original RLE boundaries and opacity masks, then reverses the edited byte to the exact original GRA SHA256. Original stage counts: Tomb 16; Portal 20; Tower 7. Independent verifier re-parses EXE source list pointers and GRA bytes and checks all 43 altered decoded pixel arrays: **526 assertions passed**. Source report `O180_REPORT.json`. This is **not** general arbitrary per-pixel editing or variable-length compaction.

### O181: Cryptographic archive input hardening

The archive builder now hashes original **index, opacity and RGBA** planes and verifies exact original frame dimensions, signed descriptor coordinates, descriptor pointers and encoded byte ranges against a 43-frame immutable witness table independently constructed from the O136/O137 Python source audit. Thus post-decode in-memory alteration (including an otherwise valid indexed pixel or RGB pixel) no longer passes off altered assets as untouched original game graphics. Independent cross-audit checks **437 source witness assertions**. All 43 canonical frames and the 131-entry O177 ZIP still export successfully. O177 builder hardening now rejects **15** adversarial cases, including forged index and RGB pixel data.

### Adversarial source verification

`tools/mk2_o177/test_o178_o179_adversarial.py`: **14 rejected** tampered-source/report cases, including misrepresented runtime certainty, spans, hashes and pointer IDs, noncanonical GRA and missing tracks. `test_o177_independent.py`: 9 altered ZIP payload/metadata cases. O181 extension: 15 browser-builder negative cases.

## Regressions and prerequisites

- Inherited O139–O175 Python family: **235/235 tests passed across 14 test scripts** on the canonical original EXE/driver.
- Inherited O136 TypeScript/Python Tomb+Portal comparison: **423/423 checks**.
- Inherited O176 TypeScript/Python Tower comparison: **86/86 checks**.
- New O177 independent PNG/ZIP/source-manifest audit: **988 assertions**; nine hostile ZIPs rejected.
- New O178 independently checked source spans: **236 assertions**; producer 215 checks.
- New O179 3 independent single-frame verifications: **3 × 21 assertions**.
- New O180 independently audited 43-frame source edit census: **526 assertions**.
- New O181 43-frame original source-hash witness audit: **437 assertions**; 15 in-memory negative cases.
- O178/O179 adverse report tests: **14 rejected**.
- TypeScript pure O177/O181 modules type-check with global tsc; source JSX transpiles successfully with global TypeScript. **Full Vite/React build was not performed.** `npm view vite` returned `EAI_AGAIN` on registry lookup; no local `node_modules`.
- Earlier 24 source-repository PNGs remain byte-for-byte identical to O176; no original game source binary/GRA is included in this release.

## Reproducibility

```bash
cd MK-DOS-Archive
EXE=/original/MK2.EXE
TOMB=/original/TOMB.GRA
PORTAL=/original/PORTAL.GRA
TOWER=/original/TOWER.GRA
node --experimental-strip-types scripts/run-mk2-o177-original-effect-archive.mjs "$EXE" "$TOMB" "$PORTAL" "$TOWER" /new/MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip
python tools/mk2_o177/verify_original_effect_archive_independent.py /new/MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip research_outputs/O136_ORIGINAL_EFFECT_FRAME_SOURCES.json research_outputs/O137_TOWER_SOURCE_FRAMES.json
node --experimental-strip-types scripts/test-mk2-o177-original-effect-archive-hardening.mjs "$EXE" "$TOMB" "$PORTAL" "$TOWER"
python tools/mk2_o177/verify_o181_source_witnesses_independent.py src/games/mk2/research/stageOriginalEffectWitnessO181.ts research_outputs/O136_ORIGINAL_EFFECT_FRAME_SOURCES.json research_outputs/O137_TOWER_SOURCE_FRAMES.json
python tools/mk2_o177/verify_o178_encoded_frame_spans_independent.py --exe "$EXE" --tomb "$TOMB" --portal "$PORTAL" --tower "$TOWER" --report research_outputs/O178_REPORT.json
python tools/mk2_o177/verify_o180_all_frame_literal_census_independent.py --exe "$EXE" --tomb "$TOMB" --portal "$PORTAL" --tower "$TOWER" --report research_outputs/O180_REPORT.json
```

## Clear next input boundary

The original runtime's presentation-clock cadence, live sprite-object activations, frame transitions, final screen positions, stage palette and draw order remain **UNOBSERVED**. O175 provides emulator mapping-safe *relative* watchpoint locations; genuine loaded-memory mappings and an active fight recording are needed for runtime claims. Future full React build also requires app dependencies. No guessed FPS, no fabricated emulator observation, no original binary modification, and no broadened compiler promise is warranted here.
