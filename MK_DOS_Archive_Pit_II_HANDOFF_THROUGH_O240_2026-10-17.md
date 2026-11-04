# MK DOS Archive — Pit II authoritative continuation through O239

Inherit the preserved `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O237_2026-10-17.md` and all O210–O237 source/evidence **without alteration**. This handoff is additive, not a replacement of earlier caveats. Maintain distinction between original source facts, recorded 30 fps video evidence, approximately 50 fps DOS presentation from Portal testing, scheduler counts, and runtime-hardware interpretation.

## O238 — fall-camera task callback and object-pointer context verified

The Pit fatality setup at original physical `0x801A9..0x801C0` allocates/looks up a task, registers original callback logical `0x1E5AE` (physical `0x80202` under verified `+0x61C54` file-code offset mapping), and writes parent `EDI` into task slot `+0x0C`. The task initializer at `0x86AC3` stores callback in task `+0x1C`. The original task dispatcher saves/restores scratch global `0x75A80` via task `+0x0C`, then jumps to the callback. This establishes how O237's global `0x75A80` reads refer to the per-task registered owner object instead of to unrelated scratch numeric values. Parent `EDI` fighter identity and actual activated instance still need runtime evidence.

## O239 — original falling-object motion setup linked to follow field

In that same parent path, `0x801D0` sets initial `EBX=0xFFF70000` (signed 16.16 `−9.0`), while `0x801D5` sets `[0x75A64]=0x4800` (16.16 `+0.28125`). A direct jump from `0x801F8` to shared movement initializer `0x63940` writes those original values into owner `[EDI+0x14]` and `[EDI+0x0C]`. O237's camera follow path reads owner `+0x14` and conditionally copies it into stage vertical velocity `[0x842E4]` when nonnegative and >=96 native pixels below the stage origin. Field `+0x0C` is a second motion parameter; gravity/acceleration per tick remains *hypothetical* until its original code consumer is verified.

## Integrity and verification

Read-only original user fixture `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, `PIT.GRA` SHA-256 `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`, `FALL.GRA` SHA-256 `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`. Both O238/O239 reports reproduced byte-for-byte independently, rejecting 16 and 20 source corruption probes respectively. Original binaries and owner videos are not shipped in research archive; no executable patches or UI builds.

## Recommended next scoped source question

Qualify the original update/consumer for the object `+0x0C` motion parameter and `+0x14` velocity: determine whether `0x4800` is integrated into the signed velocity, at what task/timer cadence, and whether the corresponding actor position is advanced before/after the stage `0x842E4` copy. Only then produce an authentic fatality descent trajectory. Separately, remain unresolved on FALL.GRA graphic 58's displayed/not-displayed behavior without runtime presentation evidence, the exact fatality dispatcher and complete crack/spray draw order. Do not impose a 30fps sampling model on the ~50fps presentation, and do not confuse stage roots with the fatality dispatcher.

---

## O240 — Original vertical-velocity integrator (additive, 2026-10-17)

O239's `object+0x0C = 0x4800` is consumed by the original fighter updater (`0x93884`, tail `0x938B6..0x938C9`). The updater performs `object+0x14 += object+0x0C` when acceleration is nonzero. The original frame composition path (`0x933C2`) calls this updater once for each available main fighter object, via `0x9341B` and `0x9342E`, then updates stage 16.16 camera accumulators. The frame loop at `0x67050` reaches composition via multiple paths, not all of which result in the same display transfer. The immediate -9.0/+0.28125 values would reach zero velocity in exactly 32 updates *if unchanged*; 0.64 s at a hypothetical one-update-per-50fps-presentation rate is NOT verified live timing. Exact owner identity, update/presentation cadence and actor position integrator remain to qualify. Source pass reproduced byte-identically twice with 23 rejected byte mutations. See `CHECKPOINT_2026-10-17_O240_PIT_FALL_GRAVITY_SOURCE.md` and `scripts/verify-o240-pit-fall-gravity-consumer.py`.
