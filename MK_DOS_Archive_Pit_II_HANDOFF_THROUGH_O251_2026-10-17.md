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
