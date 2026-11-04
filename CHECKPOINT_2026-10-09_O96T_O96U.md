# MK DOS Archive — O96T / O96U: MOUNTAIN.GRA Consumer-Joined Indexed Images and Conditional Arrangements

**Date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** INDEPENDENTLY VERIFIED / MK2 RESEARCH STILL OPEN

## Authority and scope

- Immediate parent: `MK-DOS-Archive-2026-10-09-O96S-source.zip`, SHA-256 `3ab3442d6052f7a3badd6f46204711a4ef53100a0439cafb3351079342997048`.
- Authentic `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Authentic `MOUNTAIN.GRA` SHA-256 `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6`.
- O96S's 15 pointer-table slots / 14 distinct target records, and O96R's six static word-stream variants, are prerequisites. Neither source has been changed.
- All activity is **read-only against fixture game files**. No gameplay execution or dynamic runtime trace is claimed.

## O96T — Actual indexed-pixel linkage

1. Every one of the 14 distinct O96S table-selected 16-byte records carries two little-endian words **35, 41**, a zero DWORD, a packed resource reference, and an unchanged trailing DWORD `0x0002B52A` whose role is **UNKNOWN**. The packed reference high byte **37** resolves through the authentic MK2 executable filename pool to `MOUNTAIN.GRA`.
2. Each of these 14 source offsets decodes without error under the independently qualified MK2 transparent-skip / indexed-RLE / aligned-literal command grammar. Each produces exactly **35 × 41 = 1,435 indexed pixels**, all opaque, with a fixture-reproduced pixel SHA-256.
3. An **adjacent 15th 16-byte record**, not targeted by the O96S 15-slot pointer table, contains another valid 35×41 packed reference to `MOUNTAIN.GRA`. Its decoded output is independently verified, but no O96S conditional object-selection route uses that record.
4. All **15** encoded streams join exactly end-to-start and tile `MOUNTAIN.GRA:0x29314..EOF` with no gaps, overlaps, or trailing unaccounted bytes: **23,024 encoded bytes** and **21,525 decoded indexed pixels**. The first 14 account for **22,196 encoded bytes / 20,090 pixels**; the adjacent fifteenth uses **828 encoded bytes / 1,435 pixels**.
5. The graphics commands across all 15 comprise **497 indexed-RLE**, **982 literal-index** and **0 transparent-skip** commands. Decoded source indices span **1..96**; even the 14 table-selected images reach 96. A direct 63-entry palette would not cover this entire source-index domain *without a separately proven remapping or alternative palette mechanism*.
6. All fifteen decoded pixel buffers have distinct SHA-256 values. This supports fifteen different decoded images, not their gameplay identity or correct-color appearance.

**Important reconciliation:** Earlier O69/O95W research already found 15 grammar-valid intervals covering the 23,024-byte `MOUNTAIN.GRA` suffix while the 168,724-byte prefix remained uncovered. The new advancement is **executable-selected object-descriptor/consumer provenance for 14 of those streams**, plus independently reproduced pixels and exact record boundaries. This is **not** a new exact-full-resource classification. The existing **94/124 exact-full GRA** total is unchanged.

Evidence: `mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json`.

## O96U — Six conditional arrangements joined to real decoded images

1. Each of the six authenticated O96R signed-word variants supplies **14 tokens** before the token `13` stop. These tokens are exactly the set **0..12 plus 14** in varying orders.
2. Each token selects its exact O96S pointer-table entry. Token `14` **aliases the record at token 13**; it does **not** select the adjacent fifteenth `MOUNTAIN.GRA` record found in O96T.
3. Each static variant therefore conditionally attempts to build objects using the **same 14 distinct decoded images**, each exactly once, but in a variant-dependent order. The 14 separate high-word inputs descend `771, 724, ..., 160` with a constant difference of `-47`; the low word is 197. These are verified object-field inputs, **not verified screen coordinates, frame durations, or a complete layout**.
4. The six choices yield **five distinct orders**: choices 2 and 3 have identical order. The runtime-selected choice, conditional override, helper return behavior and actual object spawning remain unobserved.

Evidence: `mk2_mountain_conditional_image_layouts_o96u_2026-10-09.json`.

## Tested interpretations

| Proposed interpretation | Result |
|---|---|
| Fourteen O96S object records refer to authentic decodable `MOUNTAIN.GRA` images | SUPPORTED by packed references and decoder |
| Fifteenth adjacent record is also decodable and completes the exact suffix | SUPPORTED structurally, no O96S pointer selection |
| Token 14 accesses the fifteenth adjacent record | REJECTED: it aliases token-13 record |
| Six alternatives reorder the same 14 selected images | SUPPORTED conditionally on the O96S consumer path |
| All images can directly use an unchanged 63-color palette | REJECTED by source index 96 (absent an unproven transform) |
| These sources establish RGB colors, named scene, pixel coordinates or timing | UNPROVEN |

## Independent validation / regression

- O96T **4,007 checks / 0 failures**; full independent Python re-decode of every sprite, record bytes, pool identity and complete suffix tiling.
- O96U **957 checks / 0 failures**; separate Python reconstruction of all six token streams, table selections, descriptor joins and object-field arguments.
- **4,964 new independent checks / 0 failures.**
- O96R regression **54,293 / 0**; O96S regression **54,611 / 0**. Both continue independently parsing all 27,004 LE relocation records.
- Four tampered reports correctly rejected: altered `.GRA` offset, invented palette proof, fabricated token-14 image mapping and fabricated screen-coordinate semantics.

## Research boundary and next work

These passes do not establish correct palette ownership, runtime spawn counts, world/screen coordinate units, layer ordering, the selection condition for a particular scene, or a complete reconstructed background. MOUNTAIN.GRA's earlier uncovered **168,724-byte prefix** still blocks exact-full classification. No MK2 gameplay asset was patched.

**Next research priority O96V:** trace the role and consumer of the common record `+0x0C` DWORD `0x0002B52A`, and test authentic palette lookup/transform provenance for the decoded 1..96 index range. Stop at UNKNOWN if executable consumption cannot qualify either. If this path stalls, move on to the remaining stage-geometry, non-`.MID` audio, other graphics resource, and MK2 closure obligations rather than repeating broad pointer scans.

**Required order unchanged:** finish MK2 → MK1 → MK3 → user UI/usability discussion → extractor implementation.
