# MK DOS Archive — Joint O95U–O95X Research Checkpoint

**Authority date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED PASS RESULTS / MK2 RESEARCH OPEN

## Basis and source integrity

- Continued from O95T source `713ceed9b846414b9c76140e946523c8abd3eb5db0475b996014c67b7bd82e7c`.
- Authentic MK2 executable: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- O69 graphics census regenerated from the supplied MK2 fixture: 94 exact-full `.GRA` resources, 15 partial/ambiguous, 14 zero-candidate pooled, one out-of-pool, 3,790 exact qualified descriptor streams. Qualified-resource-list SHA-256 remained `9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c`.
- Original game files were used as read-only sources. Neither `MK2.EXE` nor its game resources were edited.

## O95U — Copy-identity sites and downstream lookup proximity

Machine-readable evidence: `mk2_animation_copy_identity_lookup_proximity_o95u_2026-10-08.json`.

All 12 O95T sites were checked against the 253 O95R authenticated lookup addresses in a fixed **128-byte forward physical window**. Of 10 object-field identity-copy sites, only **three** have a nearby subsequent lookup:

| Identity writer | Following lookup | Family | Literal index | Byte separation |
|---|---|---|---:|---:|
| `0x95237` | `0x9528F` | A | 65 | 88 |
| `0x95D57` | `0x95DAF` | A | 65 | 88 |
| `0x96228` | `0x96284` | B | 6 | 92 |

The other seven copy sites have no authenticated lookup within this window. The two global-scalar write sites are kept separate. **Physical proximity does not prove branch reachability, numerical identity provenance or consumer data flow**; none of these three routes is promoted to a new bounded sequence.

Independent Python verifier: **64 checks / zero failures**.

## O95V — Exact palette selector records for all 17 identities

Machine-readable evidence: `mk2_palette_held_selector_exact_record_provenance_o95v_2026-10-08.json`.

Independently reparses **27,004 authentic LE relocation records**. Every palette-table entry is a type-7 relocation to Object 1; 17 entries in table A `0x1C1B8` and 17 in table B `0x1C1FC` each target a bounded counted **63-color, 128-byte** palette record. The previously unresolved identity slots remain **6, 7, 10, 11, 12, 13, 14, 15**.

Of these eight unresolved slots:

- **6, 7, 10, 11:** A and B select distinct source record pointers.
- **12, 13, 14, 15:** A and B select the **same exact record pointer** per slot.

The O95S `GO.GRA` sequences use selector slot 12, and all seven known descriptor steps fall in the O69-qualified `GO.GRA` source-index domain **1–63**. However, those two animation call paths later change object identity to slot 6; a prior-or-later object's palette handle `+0x30` has **not** been proven to bind the slot-12 palette at render time. Therefore **zero new correct-color palette contracts** are promoted. The A/B pointer alias is structural, not proof of actual colors shown in every runtime circumstance.

Independent Python verifier: **27,380 checks / zero failures**.

## O95W — Exact partial-resource decoded-span and gap map

Machine-readable evidence: `mk2_partial_gra_exact_decode_span_gap_map_o95w_2026-10-08.json`.

An independent interval-union analysis of all O69 decoded spans in the **15 partial/ambiguous `.GRA` resources** finds:

- **694,340 bytes** in the union of known decoded-stream byte intervals;
- **1,233,988 bytes** across **20 disjoint uncovered intervals**;
- **14** resources with uncovered regions;
- `PLAYSTA.GRA` alone has a byte-interval union covering 100% of the resource, **but still has overlapping/ambiguous offsets and is NOT promoted to exact-full classification**.

Every uncovered span is recorded by exact start/end, SHA-256, and first 16 bytes to support future machine-consumer investigation. “Uncovered” means not reached by the qualified O69 span census; it does not prove missing image pixels or the content's type. No new `.GRA` resource is promoted; **94 exact-full / 30 other** remains.

Independent Python verifier: **601 checks / zero failures**.

## O95X — Six 1,024-byte-aligned uncovered suffixes

Machine-readable evidence: `mk2_partial_gra_aligned_uncovered_suffix_o95x_2026-10-08.json`.

Of the O95W gaps, six are strict resource-EOF suffixes starting after offset zero and having sizes exactly divisible by **1,024**:

| Resource | EOF suffix bytes | 1,024-byte blocks |
|---|---:|---:|
| `PORTAL.GRA` | 35,840 | 35 |
| `ARMORY.GRA` | 50,176 | 49 |
| `FOREST.GRA` | 28,672 | 28 |
| `TOMB.GRA` | 43,008 | 42 |
| `TOWER.GRA` | 57,344 | 56 |
| `ARENA.GRA` | 35,840 | 35 |

Total **250,880 bytes**. All six byte populations are bounded and hashed. **Five of six contain byte values above 63** (`PORTAL`, `ARMORY`, `FOREST`, `TOWER`, `ARENA`). Neither 1,024-byte divisibility nor byte-domain shape proves a raster layout, row width, palette mapping, stage identity, camera, or composition order. Preserve this as a candidate byte-family requiring actual executable-consumer evidence.

Independent Python verifier: **62 checks / zero failures**.

## Validation and falsification

Fresh O95U/V/W/X verifiers: **64 / 27,380 / 601 / 62 checks respectively, all zero failures**. Four deliberately altered reports were each **rejected** by their corresponding independent verifier: fabricated numeric identity, altered palette pointer, falsified gap length, falsified suffix byte maximum.

Fresh regressions:

- O95T: **242 checks / zero failures**;
- O95S regenerated from fresh O69 evidence and verified as a separately paired report: **27,245 / zero failures**;
- O95Q/R: **37,639 / zero failures**;
- O95P: **877 / zero failures**.

No historical O69/O95S frozen output was rewritten.

## Research boundaries and next action

- Bounded fixed-identity animation examples **7** (unchanged).
- Selected-pointer coverage **210/253 strict terminal**, **239/253 strong-consumer**, **14 held** (unchanged).
- Palette correct-color contract slots **9/17** (unchanged); all **17/17** table entries have authenticated physical record provenance.
- `.GRA` exact-full resource count **94/124** (unchanged).
- Stage/background composition, timing, runtime palette-handle binding, four non-`.MID` music-set independent verification, and other MK2 closure obligations remain **OPEN**.

**O95Y recommended:** bound the executable consumer(s) of the six exact uncovered suffix intervals and/or the palette-handle `+0x30` allocation/selection sequence around O95S's slot-12 to slot-6 identity changes. Prioritize an actual code/data-flow join; do not promote a 256-pixel row width, stage-layer interpretation, or GO runtime colors from alignments alone. If executable evidence stalls, move to a different outstanding MK2 closure blocker instead of repeating scans.

Mandatory project order stays **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability with user → implement extractor**.
