# MK DOS Archive — O97P–O97S — Directional Arithmetic Selection and Process Dispatch

**Date:** 2026-10-09  · **Game:** authentic DOS MK2  · **Scope:** static executable evidence  · **MK2 status:** OPEN

## Purpose

Follow O97O's eighteen nine-DWORD arithmetic routines into their putative Object-2 profile-selection table. The O97P–S passes establish the table's typed relocation records, the conditional chooser's actual comparison semantics, upstream scalar mutation, and a scheduler-installable callback. These findings do not prove observed stage scrolling or frame timing.

## O97P — two nine-entry directional tables, all 18 transforms authenticated

- Positive table: Object-2 `0x15F90` through `0x15FD7`, followed by a zero terminator at `0x15FD8`. Code `0x82178` installs its relocated base pointer.
- Negative table: Object-2 `0x15FDC` through `0x16023`, followed by a zero terminator at `0x16024`. Code `0x821AA` installs its relocated base pointer.
- Each table contains nine `(threshold DWORD, function pointer DWORD)` pairs, with **18 authentic Object-1 LE relocation entries** leading to **all 18 O97N arithmetic routines**, exactly once across the two tables.
- Both tables share the threshold order `0x10000, 0x20000, 0x28000, 0x30000, 0x40000, 0x60000, 0x70000, 0xA0000, 0x80000`. **This is not monotone**. Profile functions at table ordinals 8 (profile indices 7 and 16) cannot be selected by the specific first-greater-or-equal scan in O97Q. They remain valid executable functions, and other invocations are not ruled out.
- The code-loaded fallback functions are profile indices 2 (positive) and 11 (negative). Do not interpret the thresholds as percentages, velocities, pixels/frame, or a universally valid mapping.

## O97Q — qualified conditional threshold selector

- The code at `0x82178` or `0x821AA` selects one of the two tables under separate actor-dependent branch tests; these are **conditional**, not proof of observed scene execution.
- `0x821B9..0x821F7` loads scalar globals `0x75FDA` and `0x7615E`, negates negatives subject to 32-bit wrap behavior, then selects the larger magnitude by unsigned comparison. Signed INT_MIN requires separate boundary analysis.
- With nonzero magnitude, the `0x8220D..0x8224D` loop finds the **first table threshold >= magnitude** (unsigned) and calls its relocated function indirectly at `0x8224B`.
- At zero, the code uses the preloaded fallback function (profile 2 or 11). 46 representative probe cases, covering zero, exact boundaries, just-over-boundary and overrange, are recorded and independently verified. They are test inputs, *not* runtime observations.
- Because `0xA0000` occurs before `0x80000`, the latter's two functions are bypassed by this path for every positive magnitude. For magnitudes **above `0xA0000`**, a zero table terminator reaches the `0x82317` zero-divisor error path rather than clamping safely; no assertion is made that gameplay supplies such input.

## O97R — runtime scalar source boundary

- The executable block `0x755CF..0x7562B` zeros 18 globals from EAX, including both selector inputs `0x75FDA` and `0x7615E`.
- `0x633C9..0x63403` conditionally clears one of these actor-associated scalars. The source routine is **not** an unconditional double-clear.
- `0x7CD08..0x7CD43` selects both global destinations based on actor pointer identity and assigns a value sourced from a stack-pop through global `0x75A70`; therefore the selector inputs have a nonliteral **runtime mutation path**.
- Current scalar values at battle-plan activation are unknown, and the zero fallback cannot be assumed active.

## O97S — scheduler callback reaches chooser

- At Object-1 file positions `0x645AC` and `0x84B60`, code loads the relocated Object-1 callback offset `0x2038A` (physical `0x81FDE`), EBX=4, and directly calls process constructor `0x67222`. Both pointer immediates have authentic typed LE relocations.
- The constructor writes the callback to process field `+0x1C` (`0x67248`); scheduler dispatch jumps through the same field (`0x67185`). This independently agrees with the O96N process contract.
- Callback `0x81FDE` initializes the base accumulator, calls selector `0x82003` at `0x81FF2`, yields to `0x6710F`, and loops. `0x82003` contains the conditional direction-table chooser described in O97Q.
- This is an executable-qualified **conditional constructor → scheduler → callback loop → directional profile chooser** mechanism. It does **not** tie a specific construction site to an observed battle-plan frame, a selected speed, or a particular transform during the Mountain configuration.

## Rejected and unresolved hypotheses

| Hypothesis | Outcome |
|---|---|
| Two nine-entry tables contain relocated Object-1 arithmetic functions | **Supported** |
| Threshold arrays sorted in ascending order | **Rejected** |
| All 18 routines are selectable via this specific first-GE table walker | **Rejected:** two tail entries bypassed |
| Values above 0xA0000 clamp safely in this walker | **Rejected:** zero-sentinel / divide-by-zero branch |
| Both runtime scalar inputs always remain zero | **Rejected:** dynamic conditional store path |
| Two sites can install the profile-update callback in the process scheduler | **Supported conditionally** |
| A particular direction, profile or magnitude runs during Mountain/battle-plan screen | **Unproven** |
| Arithmetic outputs are verified pixels per frame, time units or camera offsets | **Unproven** |

## Independent verification

| Pass | Source producer | Separate verifier | Checks / failures |
|---|---|---|---|
| O97P | `scripts/run-mk2-o97p-directional-threshold-tables.py` | `scripts/verify-mk2-o97p-directional-threshold-tables.mjs` | 27,332 / 0 |
| O97Q | `scripts/run-mk2-o97q-threshold-dispatch.mjs` | `scripts/verify-mk2-o97q-threshold-dispatch.py` | 151 / 0 |
| O97R | `scripts/run-mk2-o97r-directional-scalar-ancestry.py` | `scripts/verify-mk2-o97r-directional-scalar-ancestry.mjs` | 48 / 0 |
| O97S | `scripts/run-mk2-o97s-transform-process-dispatch-join.py` | `scripts/verify-mk2-o97s-transform-process-dispatch-join.mjs` | 27,144 / 0 |
| **Total new** | | | **54,675 / 0** |

All four report-falsification negative controls were rejected, restored original reports passed. Prior O97L/O97M/O97N/O97O independent regressions passed (44 + 77 + 247 + 317 = 685 checks, zero failures).

Reproduce from the extracted source root using `$FIXTURE/mk2.exe`:

```bash
python scripts/run-mk2-o97p-directional-threshold-tables.py "$FIXTURE" .
node scripts/verify-mk2-o97p-directional-threshold-tables.mjs "$FIXTURE" .
node scripts/run-mk2-o97q-threshold-dispatch.mjs "$FIXTURE" .
python scripts/verify-mk2-o97q-threshold-dispatch.py "$FIXTURE" .
python scripts/run-mk2-o97r-directional-scalar-ancestry.py "$FIXTURE" .
node scripts/verify-mk2-o97r-directional-scalar-ancestry.mjs "$FIXTURE" .
python scripts/run-mk2-o97s-transform-process-dispatch-join.py "$FIXTURE" .
node scripts/verify-mk2-o97s-transform-process-dispatch-join.mjs "$FIXTURE" .
python scripts/test-mk2-o97p-o97s-negative-controls.py "$FIXTURE" .
```

## Next authorized investigation

**O97T:** trace the branch predicates and lifecycle of the callback-creating routines, and determine whether the selected Mountain/battle-plan configuration can be connected to either without assuming process co-activation. If the reachability evidence plateaus, pivot to unresolved MK2 resources/palettes/audio rather than repeatedly promoting indirect paths as observed gameplay.

Previously qualified boundaries are preserved: 95/124 exact-full graphics resources (including `MOUNTAIN.GRA`); seven bounded fixed-identity animation witnesses; palette identity slot and strong-consumer counts unchanged. Continue MK2 → MK1 → MK3; defer extractor/UI decisions until research passes are complete.
