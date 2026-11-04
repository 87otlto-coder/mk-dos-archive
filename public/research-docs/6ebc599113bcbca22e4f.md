# MK DOS Archive — O97I / O97J / O97K — Mountain Runtime Producer, Positive-Token Consumer, and Control-Word Accumulators

**2026-10-09 · Authentic DOS MK2 binary · independent verifiers PASS · MK2 RESEARCH OPEN**

## O97I — one producer pass can examine both installed graphics setups

The O97G bounded configuration installer writes Object-2 pointer-to-pointer values `0x1C306` and `0x1C312` into runtime slots `0x77453` and `0x7745B` and writes literal marker `1` into intervening slot `0x77457`. The authentic eight-row producer table at Object-2 `0x15B68` has 32 authenticated Type-7 relocations. The executable's `0x81BB3` row walker visits slots `0x77453 + 4*i` in row order and writes objects into list heads `0x84350 - 4*i`; the dereference at physical `0x81BD9` selects a setup or `1` skip or `0x30240` return sentinel.

For the three **bounded installed** slots, independent symbolic evaluation gives:

| Row | Slot | Installed value | Dereferenced target | Proven local path | List head |
|---|---|---|---|---|---|
| 0 | `0x77453` | `0x1C306` | `0x1C31E`, 39-piece battle-plan setup | conditional call `0x81BF2` | `0x84350` |
| 1 | `0x77457` | `1` | N/A | skip | `0x8434C` |
| 2 | `0x7745B` | `0x1C312` | `0x1C330`, ten-piece landscape setup | conditional call `0x81BF2` | `0x84348` |

**Qualification:** If the installer ran, producer was scheduled, and processing of row 0 returned, this one producer traversal can consider both setups with the intervening row suppressed. Actual object acceptance/allocations, rows 3–7, call/runtime scene, timing, and draw order are not demonstrated.

Source producer: `scripts/run-mk2-o97i-mountain-dual-setup-producer-join.py`. Independent Node verifier: `scripts/verify-mk2-o97i-mountain-dual-setup-producer-join.mjs`. Evidence: `mk2_mountain_dual_setup_producer_row_join_o97i_2026-10-09.json`. **27,192 independent checks, zero failures**, including 27,004 independently reparsed LE fixups.

## O97J — same installed positive cursor enumerates both producer list heads

The O97G installer supplies relocated pointer `0x15D60` into global `0x75CF6`. At `0x93500`, executable code copies this to active cursor global `0x75A98`. The source record is **ten positive pointer pairs** plus a zero DWORD terminator, with **20 authenticated Type-7 LE relocations**. The positive-token branch at `0x9358C` reads the second-pointer's word and calls the list walker at `0x93390` through EBP selected from the first pointer. The list walker advances through linked `+0` pointers to `0x931E4` when nonzero.

All **eight producer list heads** occur exactly once among the ten positive pairs; the additional two heads come from other authenticated insertion wrappers. Crucially, the Mountain setup row 0 list `0x84350` is **positive-pair 7** and row 2 list `0x84348` is **positive-pair 5**. The selected cursor record contains **no `-1` inline packed-row command**; negative-one direct packed-row drawing is a different grammar and must not be inferred here.

**Qualification:** This closes the *static* conditional chain from installer → eight-row producer → two named runtime list heads → the same positive-token list consumer. It does not observe nonempty lists or actual simultaneous frame rendering; callback/renderer scheduling and mutation conditions remain unqualified.

Source producer: `scripts/run-mk2-o97j-mountain-installed-positive-cursor-join.mjs`. Independent Python verifier: `scripts/verify-mk2-o97j-mountain-installed-positive-cursor-join.py`. Evidence: `mk2_mountain_installed_positive_cursor_join_o97j_2026-10-09.json`. **27,191 independent checks, zero failures**, with a separate full 27,004 LE fixup reparse.

## O97K — dynamic word source arithmetic feeding positive-token list control

The contiguous executable path `0x93433..0x934A8` has **ten** exact `MOV`-from-global then `ADD`-to-global instruction pairs. One updates accumulator `0x842E8` from `0x842E4`; nine update contiguous DWORDs `0x84310, 0x84314, ..., 0x84330` from `0x842EC, 0x842F0, ..., 0x8430C`. The selected ten-pair cursor record's second pointers target **eight upper-word addresses** `0x84312` through `0x8432E` (step 4), all matched to updated accumulator DWORDs. Pairs 7–9 share the last upper-word source `0x8432E`. At `0x9358C`, the executable reads the selected word to low SI and writes SI to global `0x75A68` before the linked-object consumer.

**Qualification:** The executable supports dynamic per-list coordinate/control offsets through additive globals; no verified units, initial accumulator state, direction, camera identity, wall-clock cadence, FPS, cropping, or runtime display. These are hypotheses only.

Source producer: `scripts/run-mk2-o97k-mountain-control-offset-accumulators.py`. Independent Node verifier: `scripts/verify-mk2-o97k-mountain-control-offset-accumulators.mjs`. Evidence: `mk2_mountain_positive_control_word_accumulators_o97k_2026-10-09.json`. **96 independent checks, zero failures**.

## Cross-pass validation and falsification

- O97I 27,192 + O97J 27,191 + O97K 96 = **54,479 independent checks, zero failures**.
- Six deliberate tamper tests rejected by the respective independent verifiers: fabricated row-1 allocation, fabricated same-frame drawing, altered positive cursor pair index, fabricated runtime entry, altered accumulator destination, fabricated FPS meaning. Untampered reports reverified.
- Frozen regression verifiers O97F **27,463**, O97G **27,185**, O97H **27,137** checks each PASS/zero failures.
- Reproducible runner: `scripts/test-mk2-o97i-o97k-negative-controls.py fixture_dir source_root`.

## Status and next target O97L

This is a material static pipeline closure for battle-plan and landscape object lists, **not** a validated gameplay screenshot or complete renderer/scroll simulation. Next target is the consumers of globals `0x75A68` / `0x75A6C` and runtime camera/clip calculation, and whether a concrete process schedule can authenticate a rendering pass for both lists. If runtime timing/visibility cannot be bounded, pivot to other remaining MK2 palette, background or audio blockers. No extra animation witness or correct-color identity-slot promotion. Preserve agreed **MK2 → MK1 → MK3 → usability/UI → extractor** order.
