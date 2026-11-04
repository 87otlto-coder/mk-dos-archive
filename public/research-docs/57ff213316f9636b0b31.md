# MK DOS Archive — O97F — Index-13 Scene Configuration / Battle-Plan Provenance

**Date:** 2026-10-09 (SAST)  
**Status:** Authentic MK2.EXE / independent fixture verification PASS / MK2 RESEARCH OPEN  
**Parent:** `MK-DOS-Archive-2026-10-09-O97E-source.zip` (SHA256 `a13472ff8449714aee10c7ea38b5c664aaf7ad75f05a21d70528cb2346f23de4`)

## Question

The user proposed testing whether the configuration might relate to a fatality or a jump. Treat each as a **hypothesis**, not an attribution. Previous O97C–E independently decoded the 39-image “MORTAL KOMBAT BATTLE PLAN” artwork and demonstrated the perfect geometric fit of the 14 conditional portraits; however runtime activation was held.

## O97F — What is proven

1. At machine-code physical `0x85FA4` the executable **writes literal 13 to global `0x75A80`**, followed immediately at `0x85FAE` by a real direct near call to `0x82321`.
2. In `0x82321..0x82355`, the callee loads the global, stores that input into `0x7747F`, multiplies the input by four, chooses one of three relocation-backed Object-2 table bases (`0x15BEC`, `0x15C68`, `0x15CE4`) using global `0x3014C`, and **dereferences** the indexed DWORD to replace `0x75A80`.
3. All **three full 31-DWORD tables** have typed Object-2 relocations for their nonzero entries. In **all three**, **slot 13 = Object-2 offset `0x1C2E6`**, with exactly one such target per table. This selection is invariant across the three selector-table branches. This does **not** establish the dynamic global is always 13.
4. The selected Object-2 configuration beginning at `0x1C2E6` contains relocation-backed child pointers at `0x1C302 → runtime slot 0x77453`, `0x1C306 → 39-image setup 0x1C31E`, and `0x1C312 → 10-image setup 0x1C330`. The first row of the authenticated eight-row producer table has a matching relocated pointer to `0x77453`. Setup records retain their **320×768 / 39** and **320×200 / 10** source declarations and authenticated control, descriptor, and palette-table pointers.
5. After the table dereference, the bounded callee calls `0x81EB2`. Subject to that call returning and the later allocation conditions, its continuation can pass callback `0x1FF44` to process constructor `0x67222` (previously established O96L–N). This is a **conditional executable route** to scene-setup processing, not a gameplay trace.

### Hypothesis verdicts

| Tested claim | Verdict |
|---|---|
| Input 13 selects the same Mountain configuration across all three tables | **SUPPORTED** from exact typed fixups |
| The literal-13 writer executes a call into that selection routine | **SUPPORTED** as executable code path, contingent on entry |
| The config contains references to both 39-image tower and 10-image landscape setups | **SUPPORTED** as serialized pointers |
| Index 13 identifies a jump animation | **UNPROVEN**; neither instruction stream nor data references establishes jump semantics |
| Index 13 identifies a fatality | **UNPROVEN**; no kill/fatality-specific consumer or gameplay trace connected |
| Selection of configuration implies both graphic setups actually draw together | **UNPROVEN**; runtime head values / scheduling missing |
| Portraits and tower are always coactive in gameplay | **UNPROVEN**; geometry supports composition, not scheduler evidence |

This tightens the scene provenance materially without altering historical 7 animation witnesses / palette correct-color coverage / O96Y 95/124 exact-full resource count.

## Verification

- Separate Python producer **passed**, reparsing all **27,004** original LE fixups.
- Independently written **Node verifier passed 27,463 checks / 0 failures**, including all 93 selection slots, their fixup types, code-transfer bytes, setup dimensions, and producer-slot pointer identity.
- Existing O97E independent regression **818,531/0**, O97C/D **1,165,876/0**, O96X/Y **93,666/0**.
- Four falsifications independently **rejected**: altered selector-13 pointer, unsupported positive jump label, unsupported positive fatality label, incorrect 39-image setup count.

**Code:** `scripts/run-mk2-o97f-mountain-scene-index-join.py`, `scripts/verify-mk2-o97f-mountain-scene-index-join.mjs`.  
**Machine-readable evidence:** `mk2_mountain_scene_selector_13_o97f_2026-10-09.json`.

## Next — O97G

Follow how `0x81EB2` interprets the selected configuration; audit dynamic installation/population of `0x77453`, and search for an executable path that chooses between `0x1C31E` and `0x1C330`. If those cannot be closed with independent evidence, pivot to remaining MK2 palette/graphics/audio blockers. **Never infer labels such as jump, fatality, stage or verified in-game RGB from an attractive composite or a selector number.**

**Order:** finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → implement extractor.
