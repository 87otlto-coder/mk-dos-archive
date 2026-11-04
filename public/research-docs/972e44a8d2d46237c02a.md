# MK DOS Archive — O96K Explicit Runtime-List Insertion Wrappers

**Date:** 2026-10-08 (SAST)  
**Status:** BOUNDED VERIFIED; MK2 RESEARCH REMAINS OPEN

## Source authority

O96K starts from O96J source (`MK-DOS-Archive-2026-10-08-O96J-source.zip`, SHA-256 `d17144293ea57dc6e7490018505ea77c64774b51aa975e0613c7c97d29187d83`), using original authentic `mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. No original game binary was changed.

## Result

O96I established conditional creation/insertion for eight runtime list head slots `0x84350..0x84334`. O96J proved these eight positions also appear in the positive-token control-cursor records, out of 10 distinct first-pointer head addresses.

O96K has now bounded three additional **explicit** runtime insertion wrappers that enter already-proven linked-list insertion routine `0x665FF`:

| Wrapper entry physical | Relocated `MOV EDX,imm32` physical | Head offset in Object 2 | Transfer |
|---|---|---|---|
| `0x665EB` | `0x665FA` | `0x84358` | fall through to `0x665FF` |
| `0x93709` | `0x93718` | `0x84364` | `E9 rel32` to `0x665FF` |
| `0x93722` | `0x93731` | `0x84360` | `E9 rel32` to `0x665FF` |

Each `MOV EDX,imm32` pointer operand has an independently authenticated Type-7 Object-2 relocation. All three wrappers preserve the shared call/stack shape and transfer to the same conditional linked-object insertion mechanism.

Thus all **10 unique positive-token first-pointer list head addresses** from O96H now have at least one authenticated *potential insertion path*: eight through the eight-row producer, and the remaining two (`0x84358`, `0x84360`) through explicit wrappers. The third wrapper for `0x84364` is an additional distinct head that does **not** appear in the 10-head O96H positive-token first-pointer set.

This closes a bounded **static producer-availability question**, not runtime presence. It does **not** establish that any wrapper executes in a given game state, that every head has live objects, that both producer and consumer run in the same frame, or that any stage, rendering geometry, palette, soundtrack, animation or screen mapping is complete.

## Validation

- Authentic executable parsed, with **27,004** LE relocation entries independently reproduced.
- O96K producer: **PASS**, 3 explicit wrappers, all 10 positive-token head addresses statically covered.
- O96K independent Python verifier: **54,157 checks / 0 failures**.
- O96I/J independent regression: **54,443 checks / 0 failures**.
- O96H regression: **27,414 checks / 0 failures**.
- Three deliberate O96K negative controls rejected: invented same-scene execution, incorrect wrapper target, and fabricated live-population proof.
- During verifier development, the independent test's final link-write slice was first one byte short; its byte bound was corrected before acceptance and clean rerun. This was a test implementation offset error, not game semantics evidence.

Evidence `mk2_explicit_runtime_object_list_insertion_o96k_2026-10-08.json`; producer `scripts/run-mk2-o96k-additional-list-insertion.mjs`; independent verifier `scripts/verify-mk2-o96k-additional-list-insertion.py`.

## Next pass / fallback

**O96L** should study actual callers and scene-condition continuity of the explicit wrappers and the eight-row routine only if bounded machine paths can join them. Otherwise shift to higher-impact MK2 closure obligations (palette binding, GRA formats, music and stage compositions). Explicitly keep runtime scene execution UNKNOWN absent actual evidence. Earlier selected-pointer, palette and graphics coverage metrics remain unchanged. MK2 research is still **OPEN**.

User-mandated sequence is unchanged: **MK2 → MK1 → MK3 → UI/usability discussion → build extractor**.
