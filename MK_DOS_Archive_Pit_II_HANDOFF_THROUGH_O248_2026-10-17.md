# MK DOS Archive — Pit II authoritative additive handoff through O248

## O248 result

**Verified from O224 source-selector evidence plus O246/O247 controlled runtime videos:** all six rock textures appear in the original sequence 60→59→58→57→56→55. Graphic 58 is no longer an uncertain on-screen sprite identity. The newly qualified issue is **duration/presentation**, not missing asset identity.

The graphic-59 positive-control video yields 58 for one 30fps capture and 56 for three; original source selector counts are 5 versus 3. A constant-rate, immediately and continuously presented interpretation is mathematically impossible in that recording (requires selector r>75 and r<=45 simultaneously). Source selector yields, game task scheduling, object-list replacement and actual video presentation are separate operations. O248 does not assign the missing cause.

O248 reproducer and proof: `scripts/verify-o248-pit-selector-presentation.py`, `research_outputs/O248_PIT_SELECTOR_PRESENTATION_FEASIBILITY.json`, `research_outputs/O248_PIT_TEXTURE_PRESENTATION_TIMELINES.png`, `CHECKPOINT_2026-10-17_O248_PIT_SELECTOR_PRESENTATION_LIMITS.md`.

**Validation:** canonical SHA guards for owner original `MK2.EXE`, `FALL.GRA`, both control recordings, and upstream O224/O246/O247 evidence; two independent byte-identical reports. Original game binaries and videos are not shipped; O247 ZIP is required by the reproduction script. O248 is strictly additive and preserves inherited O247 members unchanged.

## Next productive bounded pass

Trace the original task scheduler yield `0x6710F` to the frame loop and VGA presentation path, with explicit evidence at any conditional branch that may hold or replace a texture across multiple captured frames. Favor an instrumented local runtime trace over speculation where static disassembly cannot resolve active timing. Do not infer a new 50/60 fps rule from the O248 best-fit grid.

## Inherited O247

O247 original-texture witness and all earlier research, source, negative controls and caveats remain authoritative within the inherited project archive. Refer to `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O247_2026-10-17.md` and earlier additive checkpoints. O248 supersedes **only** any claim that the source-selector entry counts can be directly converted into unique durations on the recorded display.
