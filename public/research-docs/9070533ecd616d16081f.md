# MK DOS Archive — O100D–O100W Twenty-Pass Format Research

**2026-10-09 · Original DOS Mortal Kombat 2 · 20/20 bounded passes · MK2 OPEN**

## Verification and integrity

- The independent Node verifier reconstructed **27,004 LE relocations** from the authentic DOS executable and passed **81,416 source checks with zero failures** across all 20 reports.
- The separate Python producer did not share decoding functions with the verifier.
- **20/20 deliberate report falsifications were rejected**, with each original report passing after restoration.
- Previous **O99J–O100C verifier: 81,535 checks, zero failures. O98P–O99I verifier: 554,997 checks, zero failures.**
- The historical **110/124 exact-full indexed resources** remain unchanged. **14 still held**; no semantic promotions without authenticated consumer paths.

## New high-value findings

### Cave: unique but unowned first-row decoding

- Native `CAVE.GRA` bytes **0–120** decode as a single **46×1** indexed row using the verified sprite command grammar: **36 opaque pixels**, ten transparent, with used source indices no greater than **3**.
- Exhaustive tested dimensions **1–320 width × 1–149 height** produce exactly one candidate terminating at byte 120: **46×1**. This is a *tested structural candidate*, not a validated in-game sprite.
- The authenticated 49-entry eight-byte descriptor array begins at offset **120**, then covers the rest of the file consecutively. **No eight-byte descriptor for offset 0** was found under the stated 4-byte-aligned executable scan; no promotion.

### VFRAME: competing descriptions produce different images

- The authenticated eight-byte table has ten **64×100** tiles spanning bytes **0–47,384**; twelve existing twelve-byte streams occupy **47,384–59,056**, giving a full alternative byte tiling.
- A separate authenticated twelve-byte witness interprets bytes **0–19,152** as **one 256×100 image**, whereas the first four 64×100 tiles cover exactly the same byte interval.
- Direct pixel comparison shows **20,001 indexed pixel differences and 12,178 transparency-mask differences** on a 256×100 candidate canvas. **They are not equivalent decompositions.** Both are retained pending consumer ownership evidence.

### PLAYSTA and FONTS: alternate starts are not resolved

- `PLAYSTA.GRA` has valid streams **0–76** and **8–4,408**, overlapping for **68 bytes**. The 90-witness alternative from byte 8 reaches EOF but is *not* unconditionally gap-free across the entire resource. The overlapping first stream is not silently discarded.
- `FONTS.GRA` has 172 previously authenticated source-indexed streams spanning **103,840–124,328**. No offset-zero eight-byte descriptor emerged from the bounded scan; its **103,840-byte prefix** remains opaque.

### Packed background suffix: transferred and remaining bytes

- Seven executable-referenced suffixes contain **320 × 896-byte rows = 286,720 bytes**. Every one of the 320 complete row SHA-256 values is distinct.
- The first **320 bytes/row total 102,400 bytes**; the remaining **576 bytes/row total 184,320 bytes**. Crucially **the remainder is not empty padding**. Both parts contain source byte values beyond 63 in several resources.
- Correction to an early observation: two resources, **ARMORY.GRA and ARENA.GRA**, each contain **one zero byte in each portion**; all other five resources have zero zero-bytes in both portions. Never assert every byte is nonzero.
- This establishes full byte preservation and stratified raw export data, **not** correct stage pixel geometry, palette, final draw order, or screen display.

### MONKS and audio binary evidence

- `MONKS.GRA` is **608 little-endian DWORDs**, precisely ten constant runs: `(83×63), (77×63), (75×63), (77×63), (79×63), (83×63), (85×63), (29×72), (27×23), (31×72)`. No inferred sprite/time grammar.
- Six native BIN driver files have **five distinct SHA-256 payloads**. `GMI.BIN` and `SCC.BIN` are **byte-for-byte identical, both 6,858 bytes**. `LAP.BIN` shares some header bytes but not its complete payload. This does not decode music or establish runtime driver equivalence.

## Twenty bounded passes

| Pass | Question | Verified conclusion |
|---|---|---|
| O100D | cave-prefix-unique-small-image | `UNIQUE_BOUNDED_DECODE_NO_AUTHENTIC_DESCRIPTOR` |
| O100E | cave-prefix-descriptor-ownership | `CAVE_ZERO_OFFSET_NO_8BYTE_DESCRIPTOR` |
| O100F | cave-forty-nine-image-chain | `PREFIX_CANDIDATE_PLUS_49_QUALIFIED_IMAGE_STREAMS` |
| O100G | vframe-competing-pixel-images | `NON_EQUIVALENT_GRAPHICS_INTERPRETATIONS` |
| O100H | vframe-mixed-tiling | `ALTERNATE_FULL_TILING_WITH_COMPETING_PREFIX` |
| O100I | vframe-descriptor-reference-family | `8BYTE_DESCRIPTOR_FAMILY_VERIFIED_12BYTE_CONFLICT_HELD` |
| O100J | playsta-overlap-reproduction | `TWO_VALID_OVERLAPPING_WITNESSES_NOT_COOWNED` |
| O100K | playsta-alternative-suffix-chain | `GAPLESS_SUFFIX_BUT_OVERLAPPING_PREFIX_CONFLICT` |
| O100L | fonts-prefix-descriptor-boundary | `FONT_PREFIX_STILL_UNQUALIFIED` |
| O100M | probe-raw-geometry-fingerprint | `RAW_RESOURCE_NOT_AUTHENTIC_INDEXED_DESCRIPTOR` |
| O100N | acclaim-header-byte-accounting | `UNQUALIFIED_HEADER_NO_8BYTE_DESCRIPTORS` |
| O100O | monks-constant-run-provenance | `EXACT_TEN_RUN_INTEGER_SEQUENCE` |
| O100P | monks-two-length-groups | `RUN_LENGTH_REGULARITY_NOT_ANIMATION_SEMANTICS` |
| O100Q | packed-rows-transferred-span | `TRANSFERRED_320_BYTES_ARE_NONZERO` |
| O100R | packed-rows-untransferred-span | `UNTRANSFERRED_576_BYTES_ARE_NOT_ZERO_PADDING` |
| O100S | packed-rows-cross-resource-integrity | `LOSSLESS_320_RAW_ROW_HASHES` |
| O100T | packed-rows-seven-slot-join | `SEVEN_PACKED_REFERENCES_CORRESPOND_TO_RAW_SUFFIXES` |
| O100U | audio-driver-byte-identities | `EXACT_BYTE_IDENTITY_NOT_DRIVER_EQUIVALENCE` |
| O100V | audio-driver-header-fingerprints | `DEVICE_DRIVER_BINARY_HEADER_EVIDENCE_NOT_MUSIC_DECODE` |
| O100W | conservative-held-resource-accounting | `CONSERVATIVE_COVERAGE_NO_UNPROVEN_PROMOTION` |

## Hypotheses and research boundaries

- **Supported:** a unique finite Cave prefix decode candidate; nonidentical competing VFRAME pixels; a preserved and mostly nonzero packed suffix remainder; a fixed ten-run MONKS word pattern; byte-identical SCC/GMI driver payloads.
- **Rejected:** competing VFRAME decompositions yielding the same image; the 576 source-row remainder being blank zero padding; a one-to-one mapping between unique alternative descriptor streams and uniquely owned assets.
- **Unresolved:** executable ownership of Cave prefix; which VFRAME interpretation active under which caller; PLAYSTA overlapping witness usage; meaning of Fonts prefix; source-pixel palette mapping and runtime packed-row compositor; MK2 hardware audio semantics.
- **No increase in coverage:** 110 of 124 exact-full indexed `.GRA` resources, 14 held. No new bounded animation witnesses.

## Reproduce verification

From this source root, with the native fixture extracted at `$FIXTURE`:

```sh
python scripts/run-mk2-o100d-o100w-twenty-pass-format-tests.py "$FIXTURE/mk2.exe" "$FIXTURE" . evidence/mk2_o100d_o100w
node scripts/verify-mk2-o100d-o100w-twenty-pass-format-tests.mjs "$FIXTURE/mk2.exe" "$FIXTURE" . evidence/mk2_o100d_o100w
python scripts/test-mk2-o100d-o100w-negative-controls.py "$FIXTURE/mk2.exe" "$FIXTURE" . evidence/mk2_o100d_o100w scripts/verify-mk2-o100d-o100w-twenty-pass-format-tests.mjs
node scripts/verify-mk2-o99j-o100c-twenty-pass-closure.mjs "$FIXTURE/mk2.exe" "$FIXTURE" evidence/mk2_o98p_o99i evidence/mk2_o99j_o100c
node scripts/verify-mk2-o98p-o99i-twenty-pass-graphics.mjs "$FIXTURE/mk2.exe" "$FIXTURE" docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json evidence/mk2_o98p_o99i
```

All claims refer to source bytes and bounded decoded relationships, not an observed gameplay emulator trace. **MK2 remains OPEN**. Preserve **MK2 → MK1 → MK3 → UI/usability → extractor**. The next high-value target is executable ownership of the competing sprite descriptions and `FONTS.GRA`'s substantial prefix; reduce marginal hashing/byte census passes and investigate actual packed-row compositor and hardware audio sequencing.
