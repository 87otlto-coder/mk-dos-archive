# O241 — MK2 Pit II original 16.16 object position integrator

**Status:** Independently VERIFIED original executable byte structure and control-flow edges; CONDITIONAL inference for execution count and falling fighter's exact run-time position. Additive after O240. No original game file patched.

## Original source results

The original MK2 executable's object-walker at physical `0x931E4` contains a gate reading global `0x75A88`. **When the gate is zero**, the original binary executes exactly:

```
0x93202 mov ebx,[ebp+0x10]     ; 16.16 object horizontal velocity
0x93205 add [ebp+0x18],ebx     ; object X += velocity X
0x93208 mov ebx,[ebp+0x14]     ; 16.16 object vertical velocity
0x9320B add [ebp+0x1C],ebx     ; object Y += velocity Y
```

When global `0x75A88` is nonzero, the conditional `JNE` at `0x93200` skips both additions. The frame-composition path loads `0x75A88` from global `0x762DE` at `0x9353A–0x93540`; the actual runtime value in the fatality remains **UNKNOWN**.

The same frame-composition entry `0x933C2` invokes the shared fighter acceleration consumer (`0x9341B` or `0x9342E` -> `0x93884`; `object+0x14 += object+0x0C`), advances the stage-camera position accumulators at `0x93433`, then reaches object-list dispatch at `0x935A3 -> 0x93390 -> 0x931E4` on qualifying linked-object paths. This **original instruction order** establishes actor-velocity update ahead of walker position update on that composition path. It does **not** establish that the fatality owner's pointer is guaranteed to appear as an actor in both places, that the gate is zero, that there is one such call per 50fps presented frame, or that every game tick is presented.

Under an **explicitly hypothetical** uninterrupted 32-update model starting from O239's -9.0 vertical velocity with +0.28125 per update and one matching object position addition per update, the possible accumulated displacement is -139.5 pixels if velocity is integrated before position or -148.5 pixels for the reverse order. These are arithmetic controls, **not measured or source-proven runtime trajectories**. The actual trajectory requires identifying live global state, actor list membership, and callback scheduling; the pillar asset's exact 96-row periodicity (O232) also makes unwrapped video Y inference difficult.

## Verification and inheritance

Reproducer: `python scripts/verify-o241-pit-fall-position-integrator.py --game-zip <untouched owner MK2 ZIP> --out <fresh unused directory>`. Verifies hashes for the owner EXE/PIT/FALL source files, source instruction bytes, branch and call targets, and source gating. Both independent runs generated **byte-identical** JSON (SHA-256 `d56cb95762493c13c597b09a3ee786940ad59bbab9c7884e443d2ad9f28c9ec1`) and rejected **25/25 deliberate source mutations**. No app UI changed, no new Vite build asserted. Original owner game and footage are *not* in research evidence ZIP.

## Next work

Qualify `0x762DE` writes and fatality-specific state, object-list inclusion of the task's saved owner, and task/frame presentation synchronization. Do not assert a reconstructed camera or graphic-58 display behavior without the required evidence. Retain the Portal ~50fps observation independent of source timer interrupts and video 30fps sampling.
