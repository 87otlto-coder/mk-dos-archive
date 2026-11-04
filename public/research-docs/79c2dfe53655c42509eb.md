# MK DOS Archive — O99J–O100C Twenty-Pass Held-Graphics Closure

**2026-10-09 · original DOS Mortal Kombat 2 · 20 bounded passes · MK2 OPEN**

## Independent source verification

**20 / 20 passes; 81,535 source verification checks; zero failures; all 27,004 LE relocations independently reparsed.** **20 / 20 deliberately falsified source reports were rejected** and their unmodified originals passed. The original **O98P–O99I independent verifier also passed 554,997 checks** with no failures. Producer Python and verifier Node.js do not share executable decoding functions.

### Passes and source-backed classification

| Pass | Bounded question | Classification |
|---|---|---|
| O100A | monks dword content | DWORDED DATA UNKNOWN SEMANTICS |
| O100B | held coverage crosswalk | RESEARCH COVERAGE UNCHANGED |
| O100C | bounded row consumer fingerprint | EXISTING O96A CODE PATH RECHECK NOT RUNTIME DISPLAY |
| O99J | cave zero offset candidate | HEADER OR OTHER UNQUALIFIED |
| O99K | cave prefixed image chain | 49 IMAGES PLUS UNQUALIFIED 120 PREFIX |
| O99L | vframe two decodings | TWO VALID CONFLICTING DECODINGS |
| O99M | vframe alternative full tiling | FULL BYTE TILING CANDIDATE BUT CONFLICTS WITH O69 |
| O99N | battle duplicate descriptors | DUPLICATED PREFIX NOT FORTY INDEPENDENT IMAGES |
| O99O | battle packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99P | portal packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99Q | armory packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99R | forest packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99S | tomb packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99T | tower packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99U | arena packed row region | QUALIFIED PACKED REFERENCE STRIDED RAW REGION NOT INDEXED SPRITE GRAMMAR |
| O99V | seven region row reconciliation | LOSSLESS RAW ROW CENSUS ONLY |
| O99W | fonts indexed suffix boundary | INDEXED SUFFIX ONLY PREFIX UNQUALIFIED |
| O99X | playsta overlapping witnesses | COMPETING OVERLAPPING STARTS |
| O99Y | probe untyped content | UNCLASSIFIED FORMAT NO INDEXED CLAIM |
| O99Z | acclaim untyped content | UNCLASSIFIED FORMAT NO INDEXED CLAIM |

### Most useful resource results

**Seven packed-EOF regions** have exact executable-backed packed references. The independently re-read bytes were divided losslessly into 896-byte source-stride rows, with per-row, selected 320-byte span and remaining 576-byte span SHA-256 hashes:

| GRA | Start offset | Uncovered EOF bytes | 896-byte rows | 7168-byte units |
|---|---:|---:|---:|---:|
| `TOMB.GRA` | 63,776 | 43,008 | 48 | 6 |
| `BATTLE.GRA` | 59,436 | 35,840 | 40 | 5 |
| `TOWER.GRA` | 56,268 | 57,344 | 64 | 8 |
| `FOREST.GRA` | 198,116 | 28,672 | 32 | 4 |
| `ARMORY.GRA` | 126,336 | 50,176 | 56 | 7 |
| `PORTAL.GRA` | 56,916 | 35,840 | 40 | 5 |
| `ARENA.GRA` | 90,488 | 35,840 | 40 | 5 |

All seven total **286,720 raw bytes = 320 rows × 896 bytes = 40 × 7,168 bytes**. The previously authenticated O96A executable consumer contains the separate **320-byte inner transfer and 896-byte stride**. This pass inventories actual bytes, not a confirmed 896-pixel screen width, palette, or stage bitmap. The eight-slot reference table has a zero slot at index 5; the seven nonzero slots are 0–4 and 6–7.

**CAVE.GRA:** 49 consecutive indexed streams cover exactly offsets **120–57,312**. The first 120 bytes remain unqualified. An apparent zero-offset packed resource reference candidate, interpreted as a 12×78 sprite, **failed the authentic graphics decoder's row-bound checks**; that hypothesis is rejected. The 49 decoded images remain usable as source-indexed graphics without claiming the first 120 bytes are an image.

**VFRAME.GRA:** An eight-byte descriptor decoding begins at offset 0 and ends its first image at **6,484**, while a distinct twelve-byte descriptor yields a valid 0–**19,152** image. A ten-image 8-byte prefix plus twelve O69 12-byte suffix images also gives an exact EOF tiling. Both interpretations remain authenticated source-structural possibilities. **Do not promote** unique image ownership or exact-full unambiguous indexed coverage.

**BATTLE.GRA:** Two 20-entry Object-2 descriptor arrays are **byte-identical**, decoding the same 20 image streams from 0–59,436; the **35,840-byte suffix** belongs to the separate packed-EOF table. Count 20 distinct descriptor entries and two copies of the descriptor table; do not count 40 unique images.

**FONTS.GRA:** The 172 previously authenticated O69 streams tile exactly offsets **103,840–124,328**. The 103,840-byte prefix is not qualified by this indexed grammar.

**PLAYSTA.GRA:** Two O69 witnesses start at **0** (ending at 76) and **8** (ending at 4,408); the first overlaps the second by **68 bytes**. The complete-resource grammar cannot be promoted without selecting ownership through additional evidence.

**MONKS.GRA:** 2,432 original bytes independently partition into 608 little-endian DWORDs with eight distinct values. This is a structural description, not an inferred animation frame table. **PROBE.GRA** and **ACCLAIM.GRA** remain format-unqualified, with original byte/chunk SHA-256 inventories.

### Conservative graphics coverage

**110 / 124 exact-full indexed resources; 14 held. Zero promotions in this batch.** The fourteen held categories are included verbatim in `evidence/mk2_o99j_o100c/mk2_o100c_conservative_held_resource_ledger_2026-10-09.json`. O99I's 15 earlier promotions are retained unchanged. A raw-byte complete resource does not imply a fully indexed/palette-correct image resource.

### Verified reproducibility

With MK2 native fixture extracted as `$FIXTURE`, and from this source root:

```bash
python scripts/run-mk2-o99j-o100c-twenty-pass-closure.py "$FIXTURE/mk2.exe" "$FIXTURE" evidence/mk2_o98p_o99i evidence/mk2_o99j_o100c
node scripts/verify-mk2-o99j-o100c-twenty-pass-closure.mjs "$FIXTURE/mk2.exe" "$FIXTURE" evidence/mk2_o98p_o99i evidence/mk2_o99j_o100c
python scripts/test-mk2-o99j-o100c-twenty-pass-negative-controls.py "$FIXTURE/mk2.exe" "$FIXTURE" evidence/mk2_o98p_o99i evidence/mk2_o99j_o100c scripts/verify-mk2-o99j-o100c-twenty-pass-closure.mjs
node scripts/verify-mk2-o98p-o99i-twenty-pass-graphics.mjs "$FIXTURE/mk2.exe" "$FIXTURE" docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json evidence/mk2_o98p_o99i
```

**Research boundary:** A structural image decoder is not proof of gameplay color/palette ownership, screen composition, measured frame timing, universal graphics grammar, or full MK2 completion. Preserve **MK2 → MK1 → MK3 → UI/usability → extractor**. Next high-impact options: characterize 120-byte CAVE preamble with an independently demonstrated executable consumer; discriminate VFRAME competing descriptor consumers; reconstruct the seven raw tail render paths and placement/palette semantics; resolve the much larger unclassified FONTS prefix and PLAYSTA overlap; progress MK2 audio/remaining palette slots.
