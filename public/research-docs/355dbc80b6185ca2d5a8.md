# MK DOS Archive — O96I/O96J Runtime List Producer and Positive-Token Consumer Bridge

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** BOUNDED VERIFIED / MK2 RESEARCH OPEN

## Source and authentic fixture

- Starting source: `MK-DOS-Archive-2026-10-08-O96H-source.zip` SHA-256 `b96e8d6454c0fc7a1a9917028dcb563b676882d09b3b53cac0fea18577baf72b`.
- Authentic `mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Only the original fixture was inspected; **no original executable changes**. Source code and research reports were added to the research archive.

## O96I — Eight-row runtime linked-list producer table

Object-2 **file-backed** raw offset `0x15B68` (physical `0xB67BC`) contains **eight 16-byte rows**, all 32 DWORD fields authenticated against distinct Type-7 Object-2 LE relocations. A separate Type-7 Object-2 immediate relocation at physical `0x81BB7` binds the routine at physical `0x81BB3` to this table.

Each row has four relocation-backed runtime pointers. The row sequence follows the exact affine pattern:

| Row i (0–7) | Field 0 | Field 1 | Field 2 | Field 3 | Destination list head after EDI decrement |
|---|---|---|---|---|---|
| `i` | `0x767CF + i×0x190` | `0x842E8` | `0x8432C - 4i` | `0x77453 + 4i` | `0x84350 - 4i` |

All four fields point to valid **unbacked Object-2 virtual** addresses, not serialized assets. The bounded routine processes rows starting `EBX=0x15B68` and `EDI=0x84354`, increments EBX by 16 and decrements EDI by 4, and terminates at `EDI=0x84330`, establishing exactly eight runtime list head positions `0x84350..0x84334`.

Its conditional paths read a runtime sentinel (`1` or `0x30240`), load inputs through pointer dereferences at `0x81BF2`, set cursor/head global `0x75A98=EDI` at `0x81C48`, and call a linked-object removal helper at `0x81E16`. When subsequent record tests succeed, `0x81D77` allocates an object through `0x936D6`, fills bounded object fields, and calls `0x665D4` at `0x81E09`. `0x665D4` obtains the list head from `0x75A98`, and `0x665FF` performs conditional ordered linked-list insertion with comparison fields at object `+0x20` and `+0x1C` and pointer writes at `0x66631/0x6663A`.

This is a **genuine executable-backed conditional population mechanism**. It does not prove that any or all eight heads are nonzero during gameplay, or which scene causes it to run.

## O96J — Consumer and lifecycle bridge

O96H authenticated three positive-token static pointer-pair lists (10, 4, 10 pairs). Re-reading the original executable and exact record fields establishes **10 distinct positive-token first-pointer head addresses**. Exactly **eight** match the O96I producer heads; the additional `0x84358` and `0x84360` are not produced by that eight-row routine.

The positive control branch `0x9358C` reads a head-address token and a second pointer word, then calls `0x93390`. The latter reads the linked head's first DWORD and follows object `+0x00` linked-list next pointers in the bounded continuation back to `0x931E4`. This is compatible with the list nodes created by the O96I insertion path, and the eight exact head-address joins are independently proven.

A **separate** routine `0x93647` iterates and conditionally reorders runtime chains based on fields `+0x20` and `+0x1C`. Its caller addresses include `0x84358`, `0x84360`, and `0x84364`, rather than the eight-row list producer's exact sequence. Do not conflate this sorter with direct stage rendering or the eight-row producer.

The O96H `-1` packed-row renderer token remains a distinct grammar branch; nothing in O96I/J proves any specific runtime slot leads to the `-1` branch, a named stage, timing, palette, or pixel layout. The existence of a producer and consumer of the same head **does not establish co-execution in one scene**.

## Verification

- O96I/J producer against authentic fixture: **PASS**, relocation records parsed **27,004**, table rows **8**, matching producer/consumer heads **8**.
- Separate Python verifier re-parsed the complete authentic LE fixup population and all three O96H pointer-pair records: **54,443 checks / 0 failures**.
- Negative controls rejected: mutated producer-table field; fabricated guarantee all eight heads are populated; fabricated producer/consumer same-runtime-execution guarantee.
- Fresh regressions: O96H **27,414/0**, O96E **27,174/0**, O96G **65/0**.

Evidence files:
- `mk2_runtime_linked_object_producer_o96i_2026-10-08.json`
- `mk2_runtime_linked_object_consumer_o96j_2026-10-08.json`
- `scripts/run-mk2-o96i-o96j-runtime-list-lifecycle.mjs`
- `scripts/verify-mk2-o96i-o96j-runtime-list-lifecycle.py`

## Next bounded work: O96K

Investigate the distinct non-eight-row `0x84358/0x84360` lists and their actual producers, and the gated O96I/J runtime invocation relationship. Preserve observational uncertainty if static code cannot close it. Then prioritize remaining MK2 stage/layout, palettes, GRA and audio/music closure requirements. Do not prolong this line by relabeling structural relationships as end-user ready stages.

The MK2 gate remains **OPEN**; previous coverage metrics unchanged: **seven** bounded fixed-identity animation sequences, **210/253** strict terminal-qualified pointer routes, **239/253** strong consumer-qualified, **14** held; **9/17** correct-color palette slots, **94/124** exact-full `.GRA` resources.

Mandatory order **finish MK2 → finish MK1 → finish MK3 → user UI/usability discussion → implement extractor**.
