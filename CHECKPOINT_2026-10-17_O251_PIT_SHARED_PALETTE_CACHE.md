# O251 — Pit II FALL special-graphics shared palette and cache-hit semantics

**Date:** 2026-10-17. **Inherited checkpoint:** O250. **Status:** independently repeated read-only original-executable source verification. No runtime gate trace is claimed.

## Result

Original `MK2.EXE` descriptor structures 54–60 at physical offsets `0xC3C40..0xC3CA0` (16-byte stride) each contain the **same** fourth DWORD palette pointer: Object-1 offset `0x27958`, mapping to the original Pit 81-color record at physical `0x895AC`. This agrees with independent O224 original typed LE relocations. Graphic 54 is the masked crack/decal candidate; graphics 55–60 are the rocky lower-environment textures.

The palette allocator beginning at original physical code `0x7B439` walks 60 palette-cache entries in `0x75B00`, comparing stored palette **source pointers** against the requested pointer in EAX. A cache hit branches from `0x7B445` to `0x7B4F7` and increments that entry's reference count at `0x7B4F9`; it does **not** run the palette enqueue helper or set `0x563E0`. On a cache miss, code at `0x7B48F` sets pending-palette flag `0x563E0=1`, resets alternating state bit at `0x7B499`, and enqueues via original `0x7B4A3 -> 0x7B2D0`. The allocator also supports release of a reference (`0x7B514`), clearing the slot on zero count (`0x7B52A`).

**Implication:** A transition between any of the six `FALL.GRA` wall textures uses the same palette pointer. **If the palette remains live in the allocator cache**, additional requests can be satisfied without triggering fresh DAC upload or the O250 pending-palette forced-transfer path. This is conditional, not an assertion about actual live cache occupancy. If object replacement drops the reference count to zero or other state resets the palette table, subsequent requests could take the miss path. The exact release/retain behavior for Pit fatality wall objects has not been proved.

The O248 unequal-hold video observation, O247 original graphic 58 live match, O249 conditional frame transfer, and O250 pending-palette connection all remain valid. The palette cache makes it *less safe* to assert that every wall texture transition caused a DAC update.

## Verification

Run `scripts/verify-o251-pit-palette-cache.py` against canonical original owner `mk2(2).zip` and inherited O250 source ZIP. Requires a new output directory.

- Guards canonical original MK2.EXE and FALL.GRA hashes and inherited O250 result hash.
- Checks 18 original instruction intervals, two exact rel32 call targets, and the seven original descriptor palette fields.
- Deliberately corrupts each of those 27 independent source relationships and rejects all 27 mutations.
- Two independent runs produce identical report SHA-256 `cc62364e19e4a01e1e21b6ee111fc1156ec4cb0e9fa8f802342f8a983ac8e1ec`.

No game binary patches, emulator telemetry, measured palette-cache occupancy, full pipeline implementation, new React/Vite build or DOSBox runtime tests are claimed.

## Next investigation

A bounded O252 should trace **palette cache reference release and retention specifically on the tagged wall object replacement path** (`0x70B` group), while carefully distinguishing source assumptions from runtime activity. Only then can palette-cache behavior be used to qualify original fatality frame selection. If source proves insufficient, a read-only RAM/DAC/callback trace is the appropriate next evidence input.
