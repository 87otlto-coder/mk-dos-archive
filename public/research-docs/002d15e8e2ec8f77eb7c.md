# MK DOS Archive — O100X–O102A Thirty-Pass Ownership and Format Checkpoint

**2026-10-09 · Authentic DOS MK2 · 30/30 bounded investigations · MK2 OPEN**

## Test results

- **30/30** source reports produced from native DOS MK2 fixture; **109,898 independent checks, zero failures**, in separate Node verifier. All **27,004 LE relocations** were separately parsed.
- **30/30** deliberately corrupted *substantive evidence fields* rejected; each original report passed after restoration.
- O100D–O100W regression: **81,416/0**; O99J–O100C regression: **81,535/0**; O98P–O99I regression: **554,997/0**. **718,048 total regression checks**, zero failures.
- **110/124 exact-full indexed MK2 .GRA resources; 14 held**. No unjustified promotion, new bounded animation sequence, timing, stage runtime visibility or palette binding.

## Material findings and limitations

1. **VFRAME alternate-descriptor ownership:** File-backed Obj2 offset `0x1C760` contains a 256×100 descriptor; its packed source field at `0x1C768` has **four authenticated incoming relocations** (one executable `0x86164`, three Object-2). The verified local instruction sequence at physical `0x86163` loads that field, calls setup `0x81EB2` and producer `0x81BB3`. This does **not** prove every descriptor field is consumed or a final draw. Separately Obj2 offset `0x1C81C` is the ten-64×100-tile descriptor table, reached by **one** relocated Object-2 pointer. The overlapping 256×100 source decoding differs from four-tile decoding at 20,001 indexed and 12,178 mask positions; ownership remains conditional.
2. **CAVE:** Eight relocated Object-2 setup references target the 49-image descriptor table (Obj2 `0x18260`), with a second recurring pointer family. The 49 images continue from resource byte 120 through EOF. The 120-byte candidate `46×1` decoding remains **unowned** by an authenticated descriptor.
3. **BATTLE:** Two 20×8-byte descriptor tables at Obj2 `0x19380` and `0x19420` are byte-identical. Relocation-backed roots directly targeting the first table number **six**; none target the second table start under this exact-target test. No proof the second copy is never accessed by arithmetic or indexing. Source images remain ahead of the 35,840-byte packed suffix.
4. **FONTS/PLAYSTA:** The first Font indexed-suffix descriptor has **five** authenticated incoming relocations, but its 103,840-byte prefix is not classified. For PLAYSTA the overlapping source descriptors at offsets 0 and 8 have **0 and 1** exact incoming relocation respectively. These counts are not global runtime reachability verdicts.
5. **Other held formats:** Under 4-byte-aligned file-backed Object-2 scanning, `PROBE.GRA` and `ACCLAIM.GRA` have no plausible 8-byte or 12-byte packed indexed descriptor candidates within stated dimensions and resource-byte bounds. MONKS remains ten constant-value DWORD runs.
6. **Seven packed raw suffixes:** Independently rechecked each native packed reference, its complete 896-byte row sequence, per-row SHA-256 and 320-byte transfer versus 576-byte remainder. The code at `0x659C6` establishes a 320-byte copy with 896-byte source stride, **not** safe independent palette or completed scene output.
7. **Audio boundary:** `GMI.BIN` and `SCC.BIN` remain exactly byte-identical. No new music or driver decoding is claimed.

## Thirty independently checkable pass reports

| Pass | Bounded investigation | Classification |
|---|---|---|
| O100X | vframe-large-descriptor-code-owner | `FILE_BACKED_256X100_PACKED_FIELD_DIRECT_SETUP_REFERENCE` |
| O100Y | vframe-eight-tile-owned-table | `SEPARATE_RELOCATED_10_TILE_TABLE` |
| O100Z | vframe-two-metadata-pointer-routes | `DISTINCT_SERIALIZED_POINTER_PATHS_NO_RUNTIME_COACTIVATION` |
| O101A | vframe-competing-pixels-remain-distinct | `ALTERNATE_OWNED_DESCRIPTORS_DIFFERENT_SOURCE_PIXELS` |
| O101B | cave-descriptor-eight-incoming-owners | `EIGHT_FILE_BACKED_SETUP_REFERENCES_TO_49_IMAGE_TABLE` |
| O101C | cave-setups-double-pointer-families | `EIGHT_REPEATED_18_BYTE_TABLE_OWNERS` |
| O101D | cave-prefix-candidate-and-source-gap | `DECODE_CANDIDATE_NOT_AN_AUTHENTIC_OWNED_SPRITE` |
| O101E | battle-duplicate-tables-owner-asymmetry | `DUPLICATE_IMAGE_TABLES_WITH_DIFFERENT_OBSERVED_ROOTS` |
| O101F | battle-first-twenty-graphics | `TWENTY_INDEXED_IMAGES_BEFORE_PACKED_SUFFIX` |
| O101G | fonts-first-suffix-descriptor-provenance | `SOURCE_INDEXED_FONT_SUFFIX_OWNER_PREFIX_UNQUALIFIED` |
| O101H | fonts-prefix-candidate-diagnostics | `FONT_PREFIX_BYTE_PRESERVED_FORMAT_HELD` |
| O101I | playsta-overlapping-head-witnesses | `TWO_OVERLAPPING_AUTHENTIC_DESCRIPTIONS` |
| O101J | playsta-gapless-offset-eight-alternative | `CONTIGUOUS_OFFSET_EIGHT_SUFFIX_WITH_OVERLAPPING_HEAD` |
| O101K | monks-ten-constant-dword-runs | `TEN_CONSTANT_RUNS_NOT_PIXEL_GRAMMAR` |
| O101L | probe-resource-data-classification-boundary | `OPAQUE_GRA_RESOURCE_FORMAT_NOT_PROMOTED` |
| O101M | acclaim-resource-data-classification-boundary | `OPAQUE_GRA_RESOURCE_FORMAT_NOT_PROMOTED` |
| O101N | tomb-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101O | tower-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101P | forest-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101Q | armory-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101R | portal-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101S | arena-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101T | battle-packed-suffix-preservation | `LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE` |
| O101U | packed-row-copy-inner-loop-contract | `CODE_QUALIFIED_896_SOURCE_STRIDE_320_TRANSFER` |
| O101V | packed-suffix-eight-slot-reference-table | `SEVEN_RESOURCE_PACKED_POINTERS_WITH_EXECUTABLE_CONSUMER` |
| O101W | vframe-root-references-reconciled | `DISTINCT_RELOCATED_DESCRIPTOR_OWNER_PATHS_UNJOINED` |
| O101X | cave-forty-nine-indexed-byte-closure | `FORTY_NINE_QUALIFIED_IMAGES_LEADING_PREFIX_HELD` |
| O101Y | audio-exact-driver-deduplication | `DRIVER_DEDUP_PROVEN_NO_AUDIO_DECODER` |
| O101Z | held-resource-coverage-invariant | `NO_UNPROVEN_OWNERSHIP_BASED_PROMOTIONS` |
| O102A | relocation-reference-graph-summary | `MIXED_FORMAT_RELOCATION_GRAPH_WITH_RUNTIME_GAPS` |

## Reproduce

```sh
python scripts/run-mk2-o100x-o102a-thirty-pass-ownership.py "$MK2/mk2.exe" "$MK2" . evidence/mk2_o100x_o102a
node scripts/verify-mk2-o100x-o102a-thirty-pass-ownership.mjs "$MK2/mk2.exe" "$MK2" . evidence/mk2_o100x_o102a
python scripts/test-mk2-o100x-o102a-thirty-pass-negatives.py "$MK2/mk2.exe" "$MK2" . evidence/mk2_o100x_o102a scripts/verify-mk2-o100x-o102a-thirty-pass-ownership.mjs
node scripts/verify-mk2-o100d-o100w-twenty-pass-format-tests.mjs "$MK2/mk2.exe" "$MK2" . evidence/mk2_o100d_o100w
node scripts/verify-mk2-o99j-o100c-twenty-pass-closure.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o98p_o99i evidence/mk2_o99j_o100c
node scripts/verify-mk2-o98p-o99i-twenty-pass-graphics.mjs "$MK2/mk2.exe" "$MK2" docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json evidence/mk2_o98p_o99i
```

**Next high-impact target:** discriminate runtime consumers of 256×100 versus 64×100 VFRAME modes, understand Cave prefix ownership and Fonts prefix, and qualify actual packed-row output/palette hardware pipeline; divert research to remaining MK2 audio/animation blockers as needed. **Do not turn repetitive native-byte inventories into semantic claims.**

**Mandatory order: complete MK2 → return to MK1 → finish MK3 → UI/usability discussion → implement extractor.**
