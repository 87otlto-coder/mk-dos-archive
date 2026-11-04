# O197 — Five original MK2 Forest indexed setup-local layers

**Date:** 2026-10-15. **Base:** O196 original Forest packed floor and source-linked 80-word palette candidate. **Outcome:** All five separate original Forest setup canvases rendered by strict original indexed-command decoding. **Scope:** original source pixels, transparency masks, descriptor ordering and setup-local placements **verified**; EXE-linked colors **candidate**; final gameplay scene, runtime palette, inter-layer positions, camera, parallax and animation **unverified**.

## Source-authenticated results

The source-verified `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` and `FOREST.GRA` SHA-256 `8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9` contain five source-pointer-linked Forest setup canvases. The five 18-byte setup headers at Object-2 offsets `0x16F8C`, `0x16F9E`, `0x16FB0`, `0x16FC2`, `0x16FD4` refer to 60 original drawing-control records and 43 unique descriptor streams, every record bound to `FOREST.GRA` resource ID 27 and palette slot 2. The source-linked 80-word palette at physical `MK2.EXE + 0x89324` is used for *candidate RGB previews only*.

| Original setup (1-based) | Canvas | Placement records | Unique streams | Opaque output pixels | Clipped opaque writes | Opaque overdraw |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 968×184 | 18 | 14 | 56,497 | 4,080 | 0 |
| 2 | 728×160 | 10 | 10 | 29,650 | 0 | 0 |
| 3 | 640×112 | 13 | 9 | 16,525 | 0 | 0 |
| 4 | 616×96 | 15 | 9 | 13,577 | 0 | 0 |
| 5 | 384×56 | 4 | 1 | 7,996 | 6,144 | 0 |

Independent source decoding recovered **12,842 unique encoded graphics command tokens** across the 43 distinct streams. All 60 placements decoded without malformed runs. Original unpainted pixels are transparent and recorded in a separate mask; source `x/y` coordinates are the original per-setup placements (signed 16-bit). Canvas clipping is explicit (especially setup #5, whose source descriptor height exceeds its 56-row local canvas). No cross-layer transforms were synthesized.

The image outputs resemble foreground/background trees and foliage, but assigning a relative depth, on-screen stage placement, active gameplay timing, or a composite canvas is not yet source-justified. The native 896×32 indexed floor recovered in O196 is **preserved independently**; this checkpoint does not concatenate it or crop it to a screen.

## Source implementation

- `src/core/experiments/o197.ts`: read-only SHA-256-qualified O196/O195 inheritance; authentic indexed command grammar; 43-stream bounded decoder with skip/literal/RLE; exact signed source placements, source offsets, clipping statistics, alpha mask and candidate colors; deterministic five-layer PNGs; complete forensic ZIP with all 43 streams' source command traces.
- `src/components/O197ForestLayersWorkbench.tsx`: independent layer switching, candidate-color/index/opacity visualization, detailed source placement/record evidence, full export. Integrated under `Laboratory → Compile & hypotheses` without changing or displacing earlier O194/O195/O196 tools.
- `scripts/verify-o197-fixture.cjs`: dependency-light fixture runner for original EXE/GRA, full PNG/ZIP member integrity, original-source mutation and missing/duplicate rejection.
- `scripts/verify-o197-export.py`: **independent Python standard-library decoder** that parses original EXE placements and GRA commands, then verifies all five source planes, pixel masks, candidate PNGs, 60 placements, 43 streams, original trace tokens, metadata, hashes and ZIP CRC without importing TypeScript implementation.

## Forensic ZIP contract

`SUMMARY.md`, `MANIFEST.json`, `evidence/limitations.json`, `reproduce/parameters.json`, `reproduce/README.md`, and **seven entries per setup** (40 total): `source_indices.bin`, `opacity_mask.bin`, `candidate_color.png`, `source_indices_preview.png`, `opacity_mask_preview.png`, `descriptor_placements.json`, `indexed_stream_command_trace.json`. Traces include the physical `.GRA` byte offset, raw command, operation, decoded run length, row/column, and encoded end for every distinct sprite stream. `MANIFEST.json` records per-canvas hashes and clipped writes. Original complete commercial game files are **not** included in the source release or derived evidence ZIP.

## Verification and limitations

- O197 JavaScript fixture test: **PASS** all five canvases, 60 placement records, 43 streams and full 40-member forensic ZIP; tampered EXE/GRA, missing/duplicate GRA rejected.
- O197 **independent** standard-library ZIP verifier: **PASS** all five indexed planes and separate alpha masks, all 15 original-resolution PNG payloads, all 12,842 source command entries, 60 placement records, SHA hashes and ZIP integrity against the user's original MK2 files.
- O196, O195 and O194 regressions are maintained. No inherited research decoder implementation changed.
- Full browser React/Vite build is **pending** due to unavailable npm registry/archive (`yallist@3.1.1` not in offline cache). The independent tests do not establish end-to-end browser behavior.

## Next bounded experiments

1. Controlled runtime Forest palette witness (DOSBox screenshot comparison or reversible exact source-palette change) before promoting the candidate RGB.
2. Trace setup-selection and relative layer/camera placements from executable consumers or live RAM rather than composing the five local canvases arbitrarily.
3. Only after independently confirming relationships, introduce a clearly qualified assembled Forest scene and runtime comparison.
