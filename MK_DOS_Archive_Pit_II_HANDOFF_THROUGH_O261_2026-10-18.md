# MK DOS Archive — Pit II handoff through O261

Authoritative preceding source: `MK_DOS_Archive_Source_O257_Pit_II_2026-10-18.zip`.
This handoff is **additive** to `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O257_2026-10-18.md`; inherit its complete O1–O257 history and source-confidence discipline without rewriting it.

## O258/O259 runtime test context

An isolated F9 cheat-enabled O258/O259 DOSBox-X debugger test ran the original MK2 Pit II fatality. A debugger instruction-address mapping was authenticated by comparing original EXE physical `0x670E6` against live `0180:00205492`, yielding loaded Object-1 code base `0x200000` and source physical code file-image base `0x61C54`. The expected source static data operand `0x75B00` mapped to live virtual `0x002B5B00` (`+0x240000` data relocation). An early capture at `0x00275B00` was **wrong-address evidence** and must never be interpreted as the palette cache. DOSBox-X's correct executable breakpoint syntax for this build is `BP 0180:0021EACD`, not the earlier `BPM 0180 0021EACD` instructions.

## O260 runtime-verified palette cache result

The user reached after-removal breakpoint `0180:0021EAE9` (original physical `0x8073D`), where visible slots included only another palette `0x00228BBE`, refcount 1. The user then reached the after-build breakpoint `0180:0021EB42` (original physical `0x80796`) in the same operation, and the next empty cache slot held original Pit palette `0x00227958`, refcount 15, start index 64. Earlier screenshot sequences had also shown 15 references prior to wall removal. This strongly corroborates the original game's eviction/reacquisition model **for that observed operation**. It is not 32 consecutive measured events.

These three source-locked screenshots, an executable-source verifier and a machine-readable event report are preserved in O260. Avoid saying that screen image must visibly change between CPU breakpoints; composition/presentation are separate.

## O261 proposed live DAC locations

The two independent live source-operand mappings imply pending palette flag `0x002963E0`, queue cursors `0x002963D8` and `0x002963DC`, queue start `0x002962D8` and alternating toggle `0x002962D4`. These are **derived and not live observed**. Next challenge is measuring queue enqueue, drain and video-transfer branch while retaining the 50 fps vs 60 Hz distinction.

## Verified vs not

- **Runtime observed:** palette absence after a tagged removal and palette presence with 15 references after replacement, source-linked to exact code breakpoints.
- **Original source verified:** release to zero clears cache entry; cache miss sets pending, clears toggle, enqueues command; frame control has transfer branches.
- **Not observed:** exact pending flag, queue depth, number of reflow commands, VGA port writes, effective video-transfer call during the sampled replacement, and the user's final displayed frames.
- **Still open from earlier phases:** full fatality timing and camera scheduling, fine effect compositing, and product-level reconstruction/export; do not declare Pit II complete.

## Next steps

1. **If the DOSBox-X debugger session is still paused just after a wall rebuild**, first validate source relocation live at `C 0180 0021983B` (should be the `mov [002963E0],1` pending-flag source). Then read `DV 002963E0` and `DV 002963D8` to observe pending and queue pointers; the latter two are candidate mappings until validated.
2. To prove the cause of uneven texture hold durations, observe at least one actual queue drain and frame transfer with the frame controller state, rather than interpreting only the palette cache.
3. Reproduce source/evidence reports and keep original binaries immutable. Avoid stacking debugger kits or untested script assumptions; use one known-working launcher and a minimal validated command sequence when the user input is necessary.
