# MK DOS Archive — Pit II master handoff through O257

**Date:** 2026-10-18. **Current latest checkpoint: O257**, inheriting every member of O255 source unchanged. Read original O255 handoff further below for the accumulated history.

## Summary

- **O256 SOURCE VERIFIED:** The game's 60-entry palette cache and separate **32-entry / 256-byte** VGA DAC command queue are original, distinct mechanisms. A cache miss sets the palette-pending flag, clears the alternating-presentation toggle, and queues DAC work. Controller logic can then force composition, DAC flushing, and video transfer. This is not a measured runtime trace.
- **O257 SOURCE VERIFIED:** A palette-cache miss can **reposition later live palette-cache entries** and queue additional DAC updates. Hence **32 conditional cache misses do not imply exactly 32 DAC commands or transfers**. Dynamic occupancy and ordering are necessary to count them.
- **O256/O257 verifications:** 53 exact original opcode anchors and 12 original direct-call targets; **66 hostile mutations rejected**; each output reproduced byte-identically on an independent second run against canonical original MK2.EXE and FALL.GRA. Existing original game files unchanged.
- **Evidence boundary:** This environment contains no DOSBox / DOSBox-X emulator or debugger. There is no runtime evidence establishing live cache occupancy, queue command count, DAC write count, or transfer history on O245/O247 clips.

## Portable source research

- `scripts/verify-o256-pit-palette-queue-presentation.py`
- `scripts/verify-o257-pit-palette-reflow.py`
- `research_outputs/O256_PIT_PALETTE_QUEUE_PRESENTATION_SOURCE.json`
- `research_outputs/O257_PIT_PALETTE_REFLOW_SOURCE.json`
- `CHECKPOINT_2026-10-18_O256_O257_PIT_PALETTE_QUEUE_REFLOW.md`
- `O256_PIT_RUNTIME_TRACE_FIELD_GUIDE.md`

## Next operational dependency

To distinguish O254's conditional cache-occupancy models, collect a single **read-only, event-ordered debugger trace** during a Pit II fatality. The trace should include wall selector steps, cache release/acquire hit/miss and reference counts, DAC queue writes/drains, palette-pending flag, frame branch and video transfer. Consult the trace guide, and first resolve Object-1's actual runtime loaded base. The already proven F9 menu edit can be used for stage selection but no new in-game instrumentation patch has been qualified.

**Do not:** confuse original EXE physical offsets with loaded runtime addresses; equate queue append to DAC hardware write; infer 50fps = 60Hz timer cadence; or claim the conditional 32 misses actually occurred in the owner's run.

---

# MK DOS Archive — Consolidated Pit II handoff THROUGH O255

**Date:** 2026-10-17. **Current new authoritative research checkpoint: O255.** Inherits unchanged O251 source plus O252–O255. Original game binaries unchanged.

## Major O252–O255 findings

1. **O252 — Wall palette lifetime:** Original tagged wall deletion releases palette references, and its regeneration acquires fresh references through the shared allocator. Every one of 32 selector steps rebuilds the group; source grid sizes predict **500 new tile objects** over the complete sequence.
2. **O253 — Double reset:** The camera-to-lower-scene transition calls palette cache initialization twice through its reset chain, also clearing stage-object heads and rebuilding the free-object pool. Previously cached upper-stage palettes should not be presumed retained. An intervening scheduler yield means new allocations can still occur.
3. **O254 — Conditional frame behavior:** With no other palette owners, full wall replacement creates **32 palette cache misses** and 468 cache hits across 500 acquisitions, potentially queueing a palette upload on every selector step. With an independent persistent owner, it instead creates **0 misses**. Both are **conditional source models**, not measurements of live state. A pending DAC flag selects a forced-transfer frame path; actual per-frame branch activation is unmeasured.
4. **O255 — Actor color ownership:** The lower fighter's two 17-entry character palette tables contain no `0x27958` pointer. Its ordinary palette allocation does not explain the wall palette being retained; other tasks remain possible. A separate palette adjustment helper can also queue a DAC operation.

## Why this is foundational

This resolves the O251 missing source connection between object destruction and palette reference release. The game's displayed frame behavior cannot be reconstructed from the texture selector alone: there are separate object lifetime, palette-cache, pending-DAC, compositor and video-transfer events. Even repeated entries for the same sprite may incur object regeneration and palette misses.

## Evidence and limits

- Original canonical `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original `FALL.GRA` SHA-256: `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`.
- **90 independently rejected original-byte mutations**: 73 in joint O252–O254 and 17 in O255. Every produced JSON reproduced byte-for-byte in an independent second run.
- The two Python reproducers fresh-read and hash-check originals and the exact inherited O251 report. Neither contains original game files.
- No byte modifications to game EXE or `.GRA`, no assertion of actual runtime palette slot occupancy, exact presented frames, exact task scheduling rate, or full final renderer. The source-only question of **whether the lower scene has ANY other live `0x27958` holder** is not resolved by the bounded O255 table checks. Live RAM/DAC/branch telemetry would determine that fact.

## Next recommended research

1. Without binary modification, use a DOSBox debugger or instrumented read-only emulator to trace `0x80721` selector index, `0x86C7D` palette release, `0x7B439` cache hit/miss, `0x563E0` pending, `0x6708C` frame branch and `0x65420` transfer count, with monotonic timestamps.
2. Distinguish actual palette uploads from identical-color retransmissions and time the observed transitions against nominal 50 fps frame presentation and the separate ~60Hz task timer.
3. Only then promote a deterministic renderer cadence from conditional source model to runtime verified. Do not fit a universal uniform selector rate to the 30 fps clips (O248 already falsified that shortcut).

## Checkpoint documents

- `CHECKPOINT_2026-10-17_O252_PIT_TAGGED_WALL_PALETTE_LIFETIME.md`
- `CHECKPOINT_2026-10-17_O253_PIT_LOWER_PHASE_DOUBLE_RESET.md`
- `CHECKPOINT_2026-10-17_O254_PIT_PALETTE_PRESENTATION_CONDITIONAL_MODEL.md`
- `CHECKPOINT_2026-10-17_O255_PIT_LOWER_ACTOR_PALETTE_TABLES.md`

## Full inherited O251 handoff retained below verbatim

---

# MK DOS Archive Pit II — handoff through O251 (2026-10-17)

**Current authoritative checkpoint:** O251. Source/evidence O250 inherited byte-for-byte; no original game binaries altered.

## New verified O251 result

Original 16-byte descriptor records for `FALL.GRA` graphics **54–60** share the identical original Pit palette pointer `0x27958` (original physical palette record `0x895AC`). Original palette allocator `0x7B439` has a pointer-equality cache-hit branch that increments a reference count without enqueuing new DAC palette work or setting pending flag `0x563E0`. Cache misses do set the pending flag at `0x7B48F` and enqueue a palette update at `0x7B4A3`. Releasing a cache reference can eventually clear the slot, so live wall replacement behavior remains unknown. **Do not infer that switching between every one of the six wall textures entails a palette upload or forced video transfer.**

Verifier: `scripts/verify-o251-pit-palette-cache.py`; report: `research_outputs/O251_PIT_FALL_SHARED_PALETTE_CACHE.json`; checkpoint: `CHECKPOINT_2026-10-17_O251_PIT_SHARED_PALETTE_CACHE.md`. Original source verified in two byte-identical reproductions; 27 deliberate mutations rejected.

**Next:** follow the `0x70B` wall object replacement path into palette reference lifetime; qualify whether the shared Pit palette remains retained. O248 timing mismatch still unresolved. Preserve user's approximately 50fps gameplay presentation evidence as distinct from roughly 60Hz timer and 30fps video capture.

---

# Inherited O250 handoff (preserved verbatim)

# MK DOS Archive Pit II — handoff through O250 (2026-10-17)

**Current authoritative checkpoint:** O250. Inherit all O249 source/evidence byte-for-byte, original game files untouched.

## New O250 verified finding

- Original MK2 frame controller’s `0x563E0` special branch is directly linked to queued palette operations: queue record creation via `0x7B2D0`, real VGA DAC port writes at `0x7B30B`, and pending-flag clearing after queue processing at `0x7B3ED`. Palette update paths set `0x563E0=1`; frame controller can use that to force a video-transfer call.
- `0x75CF2` render enable is writable; `0x3014C` mode is explicitly initialized to 2 in one routine but temporarily set to 3 and restored in two state wrappers. Neither is proven constant for the Pit fatality.
- `0x562D4` also gates compositor and object-walker operations, not just video transfer.
- These **source facts do not solve** the O248 unequal-hold discrepancy or prove any particular branch active during the user's 30 fps recordings.
- Reproducer: `scripts/verify-o250-pit-palette-frame-gates.py`; output `research_outputs/O250_PIT_PALETTE_FRAME_GATE_SOURCE.json`; source checkpoint `CHECKPOINT_2026-10-17_O250_PIT_PALETTE_PRESENTATION_GATES.md`. Two independent runs reproduced identical JSON, with 53 deliberately corrupted source checks rejected.

**Next:** qualify Pit scene palette-queue call sites, then consider a minimal read-only runtime-state witness if required. The source-preserving research method and 50 fps presentation baseline remain authoritative.

---

# Inherited O249 handoff (preserved verbatim)

# MK DOS Archive Pit II — handoff through O249 (2026-10-17)

**Current authoritative checkpoint:** O249. Inherit **all O248 source and evidence unchanged**; newer source ZIP supersedes numeric archive suffix conventions. No original game binary edits.

## O249 new verified result

The original MK2 controller at `0x67050` has a **conditional video-transfer gate**, distinct from composition at `0x933C2`. Its normal rendering branch (`0x75CF2 != 0`, `0x3014C != 3`, `0x563E0 == 0`) XORs flag `0x562D4` and conditionally omits transfer wrapper `0x65420` despite calling the compositor. Other branches explicitly force transfer. Source-level counter sampling and one task countdown decrement per visited task corroborate O168. This proves a mechanism for composition/presentation decoupling, **not** that this branch was active during Pit II, and it does **not** resolve all O248 video timing contradictions. See `CHECKPOINT_2026-10-17_O249_PIT_FRAME_TRANSFER_GATES.md`.

Source verifier: `scripts/verify-o249-pit-frame-presentation-gates.py`. Output: `research_outputs/O249_PIT_FRAME_CONTROLLER_PRESENTATION_BRANCHES.json`. Two identical runs, 23 deliberate corruptions rejected. No new Vite or UI build is claimed.

## Inherited facts

- O210–O247: source-authenticated Pit bridge geometry and character animations; `FALL.GRA` textures 60,59,58,57,56,55 in that order; original palette and texture pointer relationships; falling poses and motion primitives; blood effects and camera/linkage evidence.
- O245/O246: real DOSBox controlled runtime shows graphic 58 on-screen in striped diagnostic test.
- O247: **original untouched graphic 58** independently matches the graphic-59 positive-control recording.
- O248: captured frame runs differ in duration in the two separate recordings; the simple constant-selector-rate immediate-presentation model is refuted, without proving why.
- O249: distinct source composition and video-transfer branches can be called conditionally, corroborating the need to keep source selector steps separate from presented captures.

## Open investigative goals, highest first

1. Recover actual render-gate and task-to-transfer state during the fatality (ideally a narrowly scoped read-only runtime trace, not an unverified patch).
2. Reconcile clock: original approximately 50fps presentation observation, programmable timer near 60Hz, actual task yields, and video-capture timing.
3. Establish fatality-specific live falling-object slot/gate, camera trajectory and final effect compositing; obtain better evidence only if source/available recordings cannot settle it.
4. Preserve source-authentic original graphics and negative control outputs, avoid visually fitted new mechanics becoming source claims.

## Preservation rule

Inherit the complete O248 source, adding only O249 verifier/report/checkpoint/handoff. Do not overwrite the O248 handoff, original fixture, or either user recording.
