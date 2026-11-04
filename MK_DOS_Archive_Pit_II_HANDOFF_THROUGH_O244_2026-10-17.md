# MK DOS Archive — Pit II master handoff through O244 (2026-10-17)

**Authoritative current checkpoint:** O244, strictly additive over O243. The new source result verifies that the original fatality switches renderer command streams from a 10-entry upper/pillar list to a 4-entry lower/rock list. It does not solve live animation/frame timing, fatality owner identity or FALL graphic 58 display. Keep Portal ~50fps game presentation distinct from timer interrupts and recording sampling.

**New O244 checkpoint:** `CHECKPOINT_2026-10-17_O244_PIT_RENDER_LIST_TRANSITION.md`; independent verifier `scripts/verify-o244-pit-scene-command-stream-switch.py`; report `research_outputs/O244_PIT_FATALITY_RENDER_LIST_PHASE_SWITCH.json`.

The entire inherited O243 handoff follows unmodified.

---

# MK DOS Archive — Handoff through O243 (2026-10-17)

**New checkpoint:** O243 research only, additive after O242. This handoff prepends the new findings to the full O242 record below. The original game files and app UI are unchanged.

# O243 — Pit II fighter source slots, object-list membership, and position-gate boundary

**Status:** VERIFIED original source graph and conditional update ordering. **Not** a verification of the runtime gate value or owner equality. Strictly additive after O242, with no modifications to original game binaries or product UI.

## Key source-authenticated relationships

1. Fighter-object allocation in the original MK2.EXE at physical `0x77A62` creates an object returned in `EDI`, writes that pointer to player-one global `0x75FC2` at `0x77A67`, and inserts the object through `0x77ACE -> 0x646B4 -> 0x665EB`.
2. The second actor is allocated at `0x77AF3`, written to `0x76146` at `0x77AF8`, and inserted through `0x77B4E -> 0x646B4 -> 0x665EB`.
3. The shared composition routine reads those exact two slots at `0x9340D` and `0x93420` and invokes the same acceleration consumer `0x93884` via `0x9341B` and `0x9342E` when nonnull. Acceleration arithmetic is `object+0x14 += object+0x0C`, established previously in O240.
4. The same composition updates the stage's vertical position accumulator at `0x93433` and `0x934D1` **before** loading `0x762DE` into the position gate `0x75A88` at `0x9353A..0x93540`. Thus, a nonzero gate directly skips the normal object-list position additions (`0x93202–0x9320D`), **not** the preceding acceleration or stage-camera accumulator additions. Do not infer resulting on-screen movements without live object/list state.
5. Pit fatality code registers a camera-follow callback at `0x801B8` and saves its incoming `EDI` object pointer to task `+0x0C` at `0x801BD` (from O238). The source does **not** prove the saved `EDI` equals the contents of either fighter global at the exact fatality invocation time, or that the object survives all following changes.
6. The original gate writers inventoried in O242 remain ten direct A3 stores. Two regions establish on/off behavior around task yields (`0x77621/0x77635/0x77644` and `0x77E40/0x77E4F`). There is **no direct A3 store** to gate source `0x762DE` in the bounded original fatality code region `0x80137..0x80460`; other callers and indirect writes are not excluded. This is negative evidence with a narrow scope, not proof of the live gate setting.

## Implication

The previous gap 'are the normal fighter globals ever linked to the ordinary object-list walker?' is closed for the source initialization path: both fighters share original object allocation, main actor slots, and list-insertion code. Whether the *particular* owner of the Pit fatality task is the same pointer at runtime—and whether it receives uninterrupted position integration—remains unknown.

The next useful test is a dynamic, read-only trace of the original DOS executable's actor pointer, gate `0x762DE`, and camera accumulator during the fall, or an independently justified source-level proof of the incoming fatality owner's identity plus gate state. Do not patch a fatality dispatcher or manufacture a trace. The Portal-stage observed ~50fps presentation baseline is retained separately from timer interrupts and object updates.

## Reproduce and negative controls

`python scripts/verify-o243-pit-fighter-list-gate-qualification.py --game-zip <original owner mk2 ZIP> --out <fresh destination>`

Both independent runs against canonical original EXE, PIT.GRA and FALL.GRA returned an identical JSON report (`SHA-256 962854f219a8567af140a363b79155e10581975ae55bd3b72ab3cb3100486670`). 31/31 direct byte mutation controls were rejected. The checksum guards reject noncanonical fixture bytes before research output is produced. This verifier certifies exactly the instruction and edge subset it checks; it does not execute the original game.

---

## Preserved O242 handoff

# MK DOS Archive — Pit II continuation through O242

Inherit O241 and all earlier source and research without modification. The original game fixture remains untouched.

**O242 result:** original physical frame-composition code `0x9353A..0x93540` copies global `0x762DE` to `0x75A88`, the movement gate found in O241. Ten original immediate-to-`A3` direct stores set `0x762DE`: seven stores of 1 and three stores of 0; nearby code includes sequences of 1/0/1 and 1/0. The fatality-specific runtime state is UNKNOWN. This is not an exhaustive alias/dataflow analysis. Two independent byte-identical reports; 27/27 mutations rejected. Source reproduction: `scripts/verify-o242-pit-position-gate-writers.py` and `CHECKPOINT_2026-10-17_O242_PIT_POSITION_GATE_SOURCE.md`.

**Next:** narrow the fatality-specific gate writer and actor-list membership, then only derive source-driven Y trajectory if the update cadence and runtime gate are established. Do not declare sprite 58 presented, infer the original fatality dispatcher, or claim actual VGA synchronization from these static results.

---

# Preserved handoff through O241 (unaltered)

# MK DOS Archive — Pit II authoritative continuation through O241

O241 is strictly additive after the original O240 source checkpoint. All O210–O240 prior records and caveats continue to apply.

**Latest verified result:** original object position integrator at physical `0x931E4`, guarded by global `0x75A88`, advances `[EBP+0x18] += [EBP+0x10]` and `[EBP+0x1C] += [EBP+0x14]` at `0x93202–0x9320D`. Actor acceleration inside shared composition at `0x933C2` precedes the list-walker integration on eligible execution paths. The runtime state of the gate, object-list membership, exact update cadence and live Y position remain unknown. Video GIF ~50fps from Portal testing is an independent observation, not proof of one integrator call per presentation.

**Reproducer:** `scripts/verify-o241-pit-fall-position-integrator.py`, report `research_outputs/O241_PIT_FALL_FIXED_POINT_POSITION_INTEGRATOR.json`, and dedicated checkpoint `CHECKPOINT_2026-10-17_O241_PIT_FALL_POSITION_INTEGRATOR.md`. Two identical reports, 25/25 source mutations rejected; original binaries were not modified.

**Next:** inspect original gate source `0x762DE`, actor membership and cadence, then derive a *source-driven* camera model only if execution-specific values are established. Graphic 58's actual framebuffer visibility, original fatality dispatcher, and unresolved impact spray compositing remain open.

---

# Inherited handoff through O240 (unaltered)

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
