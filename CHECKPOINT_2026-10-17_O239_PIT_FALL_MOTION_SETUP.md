# O239 — Pit II falling fighter source motion initialization

**Status:** VERIFIED SOURCE PARAMETER VALUES AND WRITES; NOT a complete executed physics simulation.

Following the same `EDI` owner object's task registration described by O238, the original Pit fatality setup sets `EBX=0xFFF70000` (signed 16.16 **−9.0**) at physical `0x801D0`, global `[0x75A64]=0x4800` (16.16 **+0.28125**) at `0x801D5`, then jumps through `0x801F8` to shared source movement initialization at `0x63940`. There `0x6395C` writes `EBX` to owner object `[EDI+0x14]` and `0x6396F` writes the `0x75A64` value to `[EDI+0x0C]`, subject to sentinel checks that both actual values pass.

O237 already verified that the camera task reads original owner `+0x14`, skips negative values, enforces the `ownerY − stageY >= 96` gate, then copies that motion to stage velocity `[0x842E4]`. Combined with O238's task-local owner pointer restoration, the initializer and follow path are now connected by independent source instructions.

**Important limits:** the second parameter is plausibly gravity/acceleration but the field's updating consumer and sampling cadence have not been verified; its units and 50fps timing should not be used to predict a final trajectory without that evidence. This pass does not establish actual runtime velocities, the original initial camera state, or whether FALL.GRA graphic 58 is presented.

Reproducer: `scripts/verify-o239-pit-fall-object-motion-initialization.py --game-zip <original MK2 fixture> --out <fresh empty result directory>`.
Two independent identical JSON reports SHA-256 `61282169ff42a56d5fc38d7d0c1042402316f4f3831f34c4cb76548a445de45b`, **20/20 source corruption controls rejected**. No original binary or app UI altered.
