# MK DOS Archive — Checkpoint — Pass 1E.3O.69 MK2 Broad Indexed GRA Corpus Census

## Status

**VERIFIED / BROAD LOSSLESS INDEXED-GRAPHICS SURFACE ESTABLISHED / INDEPENDENT 217/217 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O69 broadens the independently qualified O68 MK2 indexed decoder without importing MK1 palette, animation, stage, or semantic assumptions. The pass deliberately remains indexed-only and does not guess palette ownership or runtime meaning.

## Method

O69 rescans only the O67-bounded `UNRESOLVED_POST_LE_OVERLAY` on 4-byte alignment for the same 12-byte record shape first closed by O68. A record becomes a structural candidate only when:

- its high resource byte indexes an O67 executable filename-pool `.GRA` entry;
- dimensions are within 1..640 × 1..480;
- signed placement values are within -1000..1000;
- the low 24-bit GRA offset is in range; and
- the referenced stream decodes completely under the MK2-derived O68 transparent-skip / indexed-RLE / aligned-literal grammar.

A GRA resource is promoted to `EXACT_FULL_RESOURCE_TILING` only when all discovered unique offsets are unambiguous, the first stream starts at resource offset 0, every stream ends exactly at the next discovered offset, and the last stream ends exactly at resource EOF.

Partial coverage is not promoted merely because individual descriptors decode.

## Result

Authentic MK2 root graphics surface:

- installed root `.GRA` files: **124**
- executable filename-pool `.GRA` entries: **123**
- pooled resources with at least one grammar-valid overlay candidate: **109**
- exact-full resources: **94**
- partial or ambiguous candidate resources: **15**
- pooled GRA resources with zero qualifying overlay candidates: **14**
- installed out-of-pool root GRA resources: **1** (`MONKS.GRA`)

Descriptor / stream surface:

- grammar-valid candidate records: **4,225**
- exact-full qualified descriptor records: **3,790**
- exact-full unique streams: **3,790**
- authentic encoded GRA bytes tiled exactly: **11,385,532**
- decoded indexed pixels: **15,953,739**
- opaque pixels: **6,437,823**
- transparent pixels: **9,515,916**
- literal commands: **506,161**
- indexed-RLE commands: **120,349**
- transparent-skip commands: **656,897**
- opaque index union across the exact-full surface: **1..175**, all 175 values observed

Qualified resource-list identity SHA-256:

`9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c`

The much broader 1..175 index domain further disproves any attempt to generalize MK1's observed 1..23 animation palette-index surface to MK2.

## Resources intentionally not promoted

The 15 candidate-bearing resources that fail the exact-full gate are:

`PLAYSTA.GRA`, `FONTS.GRA`, `LOGO.GRA`, `PLAYSEL.GRA`, `PORTAL.GRA`, `ARMORY.GRA`, `FOREST.GRA`, `TOMB.GRA`, `TOWER.GRA`, `ARENA.GRA`, `PIT.GRA`, `STONE.GRA`, `MOUNTAIN.GRA`, `TITLE.GRA`, `VFRAME.GRA`.

They remain `PARTIAL_OR_AMBIGUOUS`, not rejected. Some contain coherent subranges, but O69 does not infer missing descriptors or claim whole-resource coverage.

The 14 pooled GRA resources with zero qualifying overlay candidates are:

`STORY.GRA`, `IMAGES.GRA`, `DEDPOOL.GRA`, `CAVE.GRA`, `BATTLE.GRA`, `KONTIN.GRA`, `BIO.GRA`, `PROBE.GRA`, `ACCLAIM.GRA`, `T1HDRS.GRA`, `T2HDRS.GRA`, `ENDH.GRA`, `ENDV.GRA`, `COPY.GRA`.

Absence from this overlay census is not evidence that they are unused or undecodable by another mechanism.

## Independent validation

A separate Python reconstruction passes **217/217 checks**. It independently reparses the MK2 LE boundary and filename pool, performs its own broad overlay scan and decoder, reproduces the 109/94/15 resource classification, reproduces all aggregate counts and the exact resource-list hash, and reconciles every qualified resource summary plus first/last stream boundaries against the O69 report.

Source/UI integration audit passes **23/23** checks. The MK2 panel now executes O67→O68→O69 and exposes the O69 JSON while preserving the O68 JC0 indexed package download. The existing MK1 workflow remains separate.

Targeted TypeScript checking of the O67/O68/O69 core and `MK2FoundationPanel.tsx` passes with the same archival React/lucide/Node shims used elsewhere. The O69 Node runner and Python audit scripts are syntax-clean.

## Mandatory unresolved boundaries

O69 does **not** establish:

- palette ownership for any newly qualified stream;
- correct-colour RGBA/PNG rendering;
- runtime consumers for the unresolved post-LE descriptor corpus;
- a semantic classification of that overlay;
- completeness for the 15 partial/ambiguous resources;
- any descriptor mechanism for the 14 zero-candidate pooled resources or `MONKS.GRA`;
- gameplay names for resource stems beyond authentic internal filenames;
- a shared MK1/MK2 implementation abstraction.

## Verdict

`MK2_BROAD_INDEXED_GRA_CORPUS_CENSUS_ESTABLISHED`

Per the user's revised timeout discipline, the project pauses after this **single major pass**. O70 has not started.
