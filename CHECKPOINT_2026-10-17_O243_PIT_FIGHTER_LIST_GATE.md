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
