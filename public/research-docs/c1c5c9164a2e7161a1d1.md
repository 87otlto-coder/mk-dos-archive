# O198 — MK2 Forest's three conditional original setup-root graphs

**Date:** 2026-10-15. **Authoritative predecessor:** O197 Forest five separate original indexed setup-local layers. **Status:** original-file-verified *static* root-to-setup references, with source-authenticated LE relocations and an independent ZIP-pixel audit. **Not established:** selected live game mode, actual per-layer activation, final inter-layer coordinates/stacking, scroll/parallax, live palette or complete Forest gameplay scene.

## Most important new evidence

The three original conditional stage-root tables from O125, at Object-2 `0x15BEC` (`mode == 2`), `0x15C68` (`mode == 1`) and `0x15CE4` (fallback), identify Forest at stage index 4. Their type-7 relocated root pointers are respectively **`0x16B56`, `0x16BDA`, `0x16C46`**. The first root is 132 bytes long, the latter two are each 108 bytes. The latter two *byte sequences are identical*, despite occupying separate original source addresses. Distinct mode dispatch does **not** mean distinct Forest content in the mode-1 versus fallback case.

Within each root, both original relocated pointer groups identify local Forest setup records, and another original relocated pointer group targets the stage renderer's accumulator addresses.

| Root mode | Setup-local assets referenced in first source group | Setup-local assets referenced in second source group | Exact original roots |
|---|---|---|---|
| mode == 2 | 1, 2, 3, 4, 5 | 1, 2, 3, 4, 5 | Obj2 `0x16B56` |
| mode == 1 | 1, 2, 5 | 1, 2, 5 | Obj2 `0x16BDA` |
| fallback | 1, 2, 5 | 1, 2, 5 | Obj2 `0x16C46` |

The five source-local setup offsets remain O197's verified `0x16F8C`, `0x16F9E`, `0x16FB0`, `0x16FC2`, `0x16FD4` with canvas dimensions `(968×184, 728×160, 640×112, 616×96, 384×56)`. The original palette candidate at physical `0x89324` stays **candidate**, not runtime verified. All layer pixels/opacity masks are unchanged from O197. Neither absence of setup 3/4 pointers in the latter roots nor the presence of them in mode 2 proves what is drawn in a particular fight; runtime mode activation remains unobserved.

## Original numeric operands, not assumptions about render speed

For setups 1–5, the first root group pairs each source setup pointer with raw values: `0x00040000`, `0x00020000`, `0x00300000`, `0x00360000`, `0x00480000`. The second group pairs those setups with exact LE-relocated Object-2 destinations `0x84324`, `0x84320`, `0x84318`, `0x84314`, `0x84310` respectively. The mode 1 and fallback roots retain the subsets for setups 1, 2 and 5 in both groups. Every pair is reported with its own source Object-2 offset and physical EXE offset. The distinct groups are separated by an original `-2` marker and terminated by zero. **The first group's raw values are not asserted to be placements, parallax speeds, frame delays, or measured runtime coordinates.**

The second group's referenced accumulator addresses map to **renderer channels 5, 4, 2, 1, 0 for source setups 1–5**. Independently authenticated original stage-control positive commands at Object-2 `0x16CD8` reference the high 16-bit halves of each of those accumulators. The original Forest positive-command channel list is `[0,1,2,3,4,5,7,7,7]`; this is source-graph corroboration, **not** a measurement of the live camera or update transform.

All three root headers share an authenticated pointer to the original nine-word motion-input table Object-2 `0x16CB2`; its original signed 16.16 inputs are `0, 0.75, 0.9375, 1.125, 1.125, 1.5, 1.5, 1.5, 0`. Their stage-control-stream pointer is Object-2 `0x16CD8`, and their runtime-object-slot pointer is Object-2 `0x77453`. These correspond to O130/O133's *source-link contract*. They do **not** reveal which update transform is active or establish a specific live parallax rate.

## Source implementation and user-visible feature

- `src/core/experiments/o198.ts`: read-only O125→O197 source graph. Requires exact canonical original source hashes via O197/O196; checks the three original stage-table roots, bounded root images, both original reference groups, raw operand integrity, shared stage header pointers, motion-input words and fail-closed sentinels. Exports schematic SVG, original indexed and opacity planes, candidate-color PNGs, full trace metadata and reproduction instructions.
- `src/components/O198ForestModeWorkbench.tsx`: Laboratory → Compile & hypotheses → O198 Forest conditional configuration graph. Switches among conditional source-root modes and renders only the authentic independent setup canvases each original root points to; **no synthetic placement or finished-scene composite**. Exports the 24-member O198 forensic ZIP.
- `scripts/verify-o198-fixture.cjs`: dependency-light original EXE/GRA checks, byte-stable forensic ZIP, all 5 original source-layer outputs, altered-input/missing-input rejection.
- `scripts/verify-o198-export.py`: independent standard-library verifier parses **all 27,004 original LE relocation records**, checks **45 relevant typed source references**, original source pointer/operand positions and all 5 original indexed/mask/PNG planes using the independent O197 Python indexed graphics decoder. Does not import the browser implementation.

## Verification

- O198 JS fixture tests and O198 independent Python forensic verifier: **PASS**.
- Three source roots and all 22 source setup-reference fields authenticated; 11 accumulator-address pointer fields authenticated; 45 relevant relocation checks when stage dispatch and shared pointers are included. Original nine signed 16.16 input words authenticated.
- O194, O195, O196 and O197 original-fixture regression scripts: **PASS**, with the O194 case requiring uppercase filename aliases on Linux (the Windows installation is case-insensitive).
- No commercial MK2 source files included in the development source ZIP or O198 forensic archive. The O198 forensic export includes derived original indexed source layers and candidate RGB PNGs solely for user research, separately from the game installation.
- The full Vite browser build is **not yet established**; npm dependencies are unavailable in this container. Source transpilation and Python/Node provenance checks do not substitute for a real browser smoke test.

## Evidence-quality boundaries and research direction

1. **Supported:** mode-specific source setup references and original numeric / accumulator pairings. **Not supported:** the actual mode used for a live Forest fight.
2. **Supported:** five original indexed layers and palette-source association from O196–O197. **Not supported:** stacking them into a single verified scene, coloring the final screen, object parallax or frame rates.
3. **Next experiment:** instrument DOSBox to record selected root pointer / mode, the active setup pointer at `0x81C53` or `0x81DD5`, the nine accumulator globals near `0x84310`, and the actual palette bank. Compare same-stage before/after captures with the original source planes. A byte-exact reversible patch can independently test a particular layer when static analysis remains inconclusive.
4. A future scene compositor should present adjustable assumption overlays only if each guessed transform is serialized and exported as an unverified hypothesis, with control views preserved.
