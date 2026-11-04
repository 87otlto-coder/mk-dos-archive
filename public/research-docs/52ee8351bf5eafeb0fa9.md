# MK DOS Archive — O96F Direct Caller and Immediate Numeric Input Qualification

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED CODE REFERENCES / MK2 RESEARCH OPEN

## Basis

Continuation of independently verified O96C–O96E, which establish unbacked Object-2 cursor targets, guarded renderer clipping, and a bounded nine-slot zero initializer. Original fixture only: `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. No game files modified.

## Result

A full exact `E8 rel32` byte-window search over the Object-1 63 file-backed pages, followed by independent verification of the original five-byte displacement encodings, finds:

| Target | Direct E8 references | File-physical callers |
|---|---:|---|
| O96E nine-slot zero initializer `0x81B18` | **7** | `0x6466F`, `0x66D76`, `0x707AF`, `0x707EB`, `0x86159`, `0x94C19`, `0x98A8D` |
| O96B index-source writer `0x82321` | **9** | `0x74D4D`, `0x758CC`, `0x771E6`, `0x77A08`, `0x77D8B`, `0x84D32`, `0x84EEE`, `0x85FAE`, `0x94965` |

Five of the nine index-writer callsites have **an immediately adjacent ten-byte `MOV DWORD PTR [0x75A80], imm32`** with no intervening instruction before the call:

| Direct callsite | Immediately assigned literal |
|---|---:|
| `0x771E6` | 7 |
| `0x77A08` | 6 |
| `0x77D8B` | 5 |
| `0x84EEE` | 30 |
| `0x85FAE` | 13 |

The adjacent literal is read by the authenticated O96B writer at `0x82321`, which copies `[0x75A80]` to index global `[0x7747F]` *on that local path*. This is a **bounded numeric producer relationship**. It does **not** prove whether that index value persists to the separately guarded O96A renderer or which O95Y table entry is actually used during gameplay. In particular, the literal 30 must not be assumed to index the observed nine physical words in the unrelated table, and no out-of-bounds game access is inferred.

Likewise, seven direct call encodings to initializer `0x81B18` demonstrate code-referenced reachability, but do not establish the runtime branch conditions, invocation cadence, or state of the slots after their zeroing.

The `E8` census covers the specified file-backed Object-1 byte region and exact rel32 instructions; it is not a whole-program control-flow proof, and not all possible indirect calls are included.

## Verification and limitations

- New report: `mk2_runtime_control_direct_callers_o96f_2026-10-08.json`.
- Producer: `scripts/run-mk2-o96f-direct-caller-census.mjs` — original MK2 fixture **PASS**.
- Independent Python verifier: `scripts/verify-mk2-o96f-direct-caller-census.py` — **34 checks / 0 failures**.
- Deliberately false `numericalWriterInputsAutomaticallyBoundToRenderer=true` report is **REJECTED**.
- O96C **27,170/0**, O96D **33/0**, O96E **27,174/0** independent verifiers freshly rerun clean. Total new O96C–F **54,411 independent checks / 0 failures**. O96A **27,170/0**, O96B **27,150/0**, O95Z **1,526/0** regression verifiers were also rerun clean at the O96E checkpoint. Four deliberate claim mutations rejected across O96C–F.

The earlier selected-pointer/graphics/palette/animation totals remain unchanged: seven bounded fixed-identity streams, 210/253 strict terminal lookup routes, 239/253 strong consumer-qualified, 14 held, 9/17 qualified correct-color palette slots, 94/124 exact-full GRA resources. **MK2 is NOT research-closed.**

## Next bounded pass

**O96G**: follow the five locally established writer callers through their actual guarded continuations and test whether *any* of those numeric indices can be proven to reach the separate indexed renderer `0x9E118`. Alternatively, trace nonzero writes to the virtual-unbacked control slots. Do not promote a static callsite census to a runtime stream or stage reconstruction. If stalled, prioritize other MK2 palette/GRA/audio closure obligations.

Mandatory sequence: **finish MK2 → finish MK1 → finish MK3 → user-led UI/usability discussion → extractor implementation**.
