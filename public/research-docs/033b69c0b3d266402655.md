# MK DOS Archive — O95Q and O95R Joint Checkpoint

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED STRUCTURAL / INDEX-EXTENT EVIDENCE — MK2 RESEARCH OPEN

## Why two passes were grouped

Both passes use the identical authenticated `MK2.EXE`, relocation-backed O95B root table evidence and O95P five proven stream witnesses. O95Q expands the per-root relocation map; O95R independently indexes all adjacent-literal lookup calls against the **proven contiguous root extents**, not against invented runtime identity states. Each remains separately consumable in its own JSON report, and both are checked by a separate Python verifier that re-parses source fixups and rel32 call bytes.

## Canonical sources

- Authoritative preceding source: `MK-DOS-Archive-2026-10-08-O95P-source.zip`, SHA-256 `cf7c9ed88a8d4e9188bf02841bcd5468ea10029fd2434ec1ce0d8e021497a360`.
- Original authentic `mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- O95B root report and O95P exportability ledger byte-hash pinned in O95Q and O95R.

## O95Q — Per-root entry relocation-provenance census

The complete LE relocation list was freshly reconstructed from the genuine MK2 executable. Both 17-slot lookup tables, each root's contiguous entries, and all five previously proven runtime selected-pointer witnesses are linked back to the actual relocation bytes.

| Measure | Result |
|---|---:|
| Family A unique roots | 11 |
| Family B unique roots | 15 |
| Family A root-entry instances | 670 |
| Family B root-entry instances | 255 |
| Combined family-root entry instances | **925** |
| Distinct Object-2 entry offsets within those instances | **789** |
| Distinct first-hop target Object-2 offsets | **725** |
| Known one-hop descriptor witness instances | **117** |
| Distinct underlying known-descriptor entry locations | **85** |
| Authenticated fixed-numeric identity/index witness streams | **5** |
| Root-entry instances without a fixed-numeric witness | **920** |

Why counts differ: root aliases and overlapping contiguous root ranges cause the same underlying Object-2 locations to be enumerated more than once. **925 is not the number of unique animations, independent streams, or exportable assets.** The five fixed witnesses remain the only exact runtime identity/index/selected-pointer/qualified consumer sequences inherited from O95C–G. Unassigned first-hop targets are not automatically animation streams, and one-hop descriptor matches are not a complete animation grammar.

This pass **does not introduce new full-stream witnesses**. It provides a machine-checkable entry-by-entry provenance ledger that can be used to select tightly bounded follow-up routes without losing alias identity.

## O95R — Adjacent literal index and root-extent compatibility

The independent whole-executable scan found all 253 authenticated direct lookup callsites. The immediate-form classifier recognizes only two code-verified forms immediately preceding a lookup call: `C7 05 78 5A 07 00 <imm32>` and `B8 <imm32> A3 78 5A 07 00`. All other index origins remain unqualified by this narrow pass.

| Measure | Result |
|---|---:|
| Direct lookup calls | **253** (144 A / 109 B) |
| Calls with an adjacent literal index | **228** (125 A / 103 B) |
| Dynamic/nonadjacent index cases | **25** |
| Literal calls whose index is within all 17 same-family root extents | **162** |
| Literal calls within some but not all same-family root extents | **66** |
| Literal calls beyond every same-family root extent | **0** |

For each of the 228 literal calls the report records compatible/incompatible numeric slots **only as structural length comparisons**. The runtime value of object `+0x46` is still UNKNOWN unless separately qualified by executable data flow. This is **not** a legitimate identity × index cross-product producing selected streams. An index outside a root's certified *contiguous fixup run* is not, by itself, proof that the runtime ever accesses invalid memory or that the root has no other possible data.

## Validation

- O95Q/R producer against authentic MK2 fixture: **SUCCESS**.
- Separate original-executable Python verifier: **37,639 checks / 0 failures** (independently reconstructs 27,004 raw fixup records, checks all 925 entry instances, all 228 adjacent-literal callers, 25 remaining calls, and all five exact fixed-identity witness joins).
- Ten duplicate fixup source keys occur in the executable relocation census; as in O95B, final relocation mapping uses the last record for a key. The verified root-entry evidence remains consistent with O95B.
- Negative control: altered reported O95Q target, with cross-report hash updated, **REJECTED** at authentic pointer-provenance check.
- Negative control: fabricated O95R slot-extent compatibility, **REJECTED**.
- Negative control: fabricated runtime identity assignment, **REJECTED**.
- O95P independent regression: **877 / 0 failures**.
- O95O independent regression: **152 / 0 failures**.

## Explicitly unchanged research limits

- 210/253 terminal-qualified, 239/253 strong consumer-qualified, 14 held selected-pointer routes.
- Five bounded fixed numeric-identity stream witnesses; this pass has **zero additional full-stream witnesses**.
- No newly authenticated fighter/move/effect names; no playback FPS or scheduler timing; no additional palette ownership; no universal Family A/B grammar; no unsupported binary writes.
- MK2 closure obligations AN02–AN08 (O95P), plus stage, non-MID music, graphics and other exporter-relevant unknowns, remain OPEN.

## Next planned bounded research — O95S

**Executable-path identity/index-to-consumer joins** at callers with explicit literal indices and specific known root extents. Prioritize caller neighborhoods offering independently bounded identity provenance; test actual selected pointer and consumer grammar before promoting even one new complete sequence. Use O95Q entry offsets and O95R index compatibility only as navigation aids, not evidence of execution. If the joins cannot be proven, pivot to another outstanding MK2 closure domain rather than multiplying ungrounded combinations.

The user-defined order is unchanged: **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → then implement the extractor.**
