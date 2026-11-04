# MK DOS Archive — Checkpoint 1E.3O.84

## MK2 six-fixture verified fighter-resource RGBA integration bundle

O84 is an integration/distribution pass only. It nests the exact accepted deterministic correct-colour fixture packages for:

- identity slot 0 / `HH0.GRA` — O76
- identity slot 1 / `LK0.GRA` — O77
- identity slot 2 / `JC0.GRA` — O74
- identity slot 3 / `BA0.GRA` — O79
- identity slot 4 / `FN4.GRA` — O81
- identity slot 5 / `FN6.GRA` — O83

No fixture is recomputed or semantically strengthened by O84. The exact nested package hashes are preserved byte-for-byte. The aggregate contains 448 already-verified PNGs across 478 nested logical entries.

Accepted O84 outer package:
- filename: `MK2_O84_VERIFIED_FIGHTER_RGBA_BUNDLE.zip`
- outer entries: 8
- nested fixture packages: 6
- nested logical entries: 478
- verified PNGs represented: 448
- byte length: 8,999,328
- SHA-256: `adb092f263f4fa0b7ede146b3f748a754ea1eb7919f95853f0d4112eed26ae1b`
- encoding: STORE-only outer ZIP

Validation:
- O84 implementation checks: 8/8
- independent Python integration audit: 109/109
- source/UI integration audit: 54/54
- second O84 regeneration: byte-for-byte identical
- targeted TypeScript/TSX: passed

Evidence boundaries remain unchanged:
- O84 adds no new palette ownership;
- O84 adds no sibling-resource or whole-family ownership;
- O84 adds no human fighter names;
- numeric side 0/1 is still not promoted to Player 1/Player 2 labels;
- unnamed mode value 4 remains semantically unresolved;
- MK1 assumptions are not imported into MK2;
- O81 remains the authority for slot 4 -> `FN4.GRA`;
- O83 remains the authority for slot 5 -> `FN6.GRA`;
- slot 16 remains unresolved at the connected-chain standard.

Verdict: `MK2_SIX_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION`.
