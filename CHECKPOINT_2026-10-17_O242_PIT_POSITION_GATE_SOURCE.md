# O242 — MK2 Pit II object-position integration gate writers

**Status:** VERIFIED original-executable direct stores and gate-copy path. Strictly additive after O241. No runtime gate value, direct fatality-specific writer path, or complete game-frame trajectory proven.

O241 identified that the original object-walker at `0x931E4` integrates 16.16 positions only when global `0x75A88` is zero. In the original frame composition at physical `0x9353A..0x93540`, global `0x762DE` is copied to that position-integration gate.

## Authenticated original direct writers

The bounded literal-write census finds ten original direct writes to global `0x762DE`. Seven store constant **1** (`0x70BF2`, `0x766A2`, `0x768B8`, `0x77100`, `0x77621`, `0x77644`, `0x77E40`); three store constant **0** (`0x7092C`, `0x77635`, `0x77E4F`). This is a census of authenticated **direct `A3` store shapes with immediate EAX-setting**; other indirect or aliased writes are not ruled out. The original executable contains 28 literal four-byte appearances of `0x762DE`, including other code and data uses that are NOT classified as direct stores.

Two clusters show local control state switching: `0x77621/0x77635/0x77644` have source writes 1/0/1, and `0x77E40/0x77E4F` write 1/0. Whether those source paths actually execute during Pit II stage fatality remains **unknown**. The static source does not establish a permanent state of 0 or 1 for a live falling-object update.

## Research conclusion

The original executable **can** suppress normal object position additions, and original source contains both on and off state writes. It would be unjustified to assume 50 actor movement updates per second, or that the gate is open throughout the Pit fatality, based only on the 50fps Portal presentation witness. Required next: identify the source path that sets the gate for the Pit fatality and the object-list membership of the owner's actor. A runtime trace or new targeted executable instrumentation may ultimately be necessary, but no write is authorized by this research milestone.

## Validation

`python scripts/verify-o242-pit-position-gate-writers.py --game-zip <canonical MK2.zip> --out <fresh directory>` checks original EXE/PIT/FALL SHA-256, all ten store sequences, independent reader, copy destination and integrator branch. Two reruns reproduced the same JSON byte-for-byte (SHA-256 `02b8992cc93a4528173c04f717e81caaa6a35573536cc60d3f86fe940a040930`) and rejected **27/27 source mutations**. Original game bytes unchanged; no UI work.
