# MK DOS Archive — O96N Process Callback Scheduler Dispatch

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** BOUNDED VERIFIED / MK2 STILL OPEN

## Authority

Begins from O96M source ZIP (SHA-256 `722df223105af511d37d07100d33ac807cdf727d6719e1782178c8f715d9e781`). Authentic `mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, read-only.

## Result: the callback field has an executable dispatch consumer

O96L proved two Type-7 relocation-backed Object-1 offsets `0x1FF44` loaded into EDX and passed to process constructor `0x67222`. This process entry maps to physical `0x81B98`, which calls eight-row list producer `0x81BB3`, yields via `0x6710F`, and loops.

O96N authenticates the **receiving dispatch mechanism**, rather than assuming a constructed process entry will execute:

- At `0x67248`, constructor `0x67222` writes EDX to `[EAX+0x1C]` of the allocated process and links that process through the active list (`0x67235..0x67239`).
- At `0x6710F`, yield logic captures the near-call return address into EDX; at `0x67114` it writes EDX to `[ESI+0x1C]`, the same process resume field. This is a structural return-to-resume contract, not a timing unit.
- Scheduler `0x67108` sets its sentinel pointer, then `0x67152` iterates linked processes; `0x67158` decrements a 16-bit process count, and only the nonpositive path advances through restored state.
- At `0x6715E..0x67182`, the scheduler restores base pointer, globals `0x75A80` / `0x75A7C` / `0x75A78` from process fields `+0x0C / +0x10 / +0x14`, plus EDI from `+0x18`.
- Finally, **`0x67185: FF 66 1C`** executes `JMP DWORD PTR [ESI+0x1C]` — an authenticated consumer of the same pointer field seeded by `0x67222`.

Thus the executable contains a coherent **conditional process creation → callback-field storage → scheduler selection → indirect callback dispatch → producer/yield/repeat mechanism** for the O96L process entry. This is stronger than an isolated callback pointer and closes its static dispatch-consumer linkage.

## Hard limits

No actual runtime scheduling trace was recorded. This pass does **not** establish that either particular creation site is reached in gameplay, that a particular scene owns this process, that every producer iteration runs, or that the values 5 and 8 have clock-time units. Complete stage rendering, palette binding, animations, and MK2 closure remain unproven.

## Verification

- Independent O96N raw-machine verifier: **37 checks, zero failures**.
- O96L/M independent verifier: **54,181 checks, zero failures**.
- O96K / O96I/J / O96H regressions: **54,157 / 54,443 / 27,414 checks respectively, all zero failures**.
- Negative-control falsifications rejected: O96L/M three; O96N three (wrong callback field, fabricated observed gameplay, falsified global-restore address).

Evidence: `mk2_process_callback_scheduler_dispatch_o96n_2026-10-08.json`; producer `scripts/run-mk2-o96n-process-callback-dispatch.mjs`; separate verifier `scripts/verify-mk2-o96n-process-callback-dispatch.py`.

## Next bounded direction

**O96O**, if continued, should look for authenticated runtime gates that lead from the callers at `0x8236B` or `0x86070` to scene setup, or establish scene-independent sprite/stage exportability from the newly proven processor. Do not repeat broad address occurrence scans without a causal question. Otherwise prioritize remaining MK2 palette, GRA, non-MID audio, stage composition and animation closure blockers.

MK2 remains **OPEN**. Mandatory project sequence **MK2 → MK1 → MK3 → user-led UI/usability discussion → extractor**.
