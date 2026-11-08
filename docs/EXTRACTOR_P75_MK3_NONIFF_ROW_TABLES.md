# P75 — MK3 DATA.MK3 source row-table reconstruction across 19 non-IFF graphics

**Date:** 2026-11-08. **Cycle:** P72–P76, fourth interim pass. **Branch:** develop. **Mode:** standalone source-fingerprinted original-DOS graphics extractor; NO application catalogue/UI change. **Authoritative original:** user's privately supplied original DOS mk3.zip, DATA.MK3 SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.

## OBSERVE — new source-row tables

The first compressed indexed stream previously decoded at P74 ends at `nonIffRegionOffset + 792 + originalHeaderU32LE20`. P75 identified two adjacent 32-bit arrays whose lengths equal the original image height. Each row has:

1. **Signed 32-bit row X value:** nonnegative values describe a source-consistent horizontal row offset; **-1** occurs exactly where a row has no packed command stream. No other negative row X values occur in the original 19 regions.
2. **Unsigned 32-bit first-stream row pointer:** byte offset relative to the beginning of the original RLE stream. Active-row offsets are strictly increasing, match the independently parsed compressed row starts, and the first active row always begins at zero; rows with X=-1 have a zero row pointer.

This repeated layout independently accounts for **every declared scanline across all 19 regions**. It resolves the five P74 first-stream “partial” interpretations as *source-row-table-sparse* canvases, without guessing where to insert rows or horizontally shift graphics:

| Region | Declared rows | Explicit packed rows | X=-1 rows |
|---|---:|---:|---:|
| 03 | 200 | 18 | 182 |
| 04 | 263 | 261 | 2 |
| 07 | 39 | 32 | 7 |
| 16 | 86 | 82 | 4 |
| 19 | 200 | 124 | 76 |
| **Other 14** | **2,227** | **2,227** | **0** |
| **Total** | **3,015** | **2,744** | **271** |

The per-row X offset also corrects **horizontal placement** for original rows in the fourteen already complete P74 graphics. P74 decoded valid packed row command bytes, but its previews placed each decoded row at X=0, and five earlier incomplete canvases lacked source-mapped Y coordinates. **P75 supersedes P74 as the correct source-table-guided visual interpretation.** Do not use the prior P74 preview PNGs as the final visual-position baseline. The offset/row association is directly constrained by repeated source record structure; the original EXE's renderer behavior is NOT yet separately verified.

## IMPLEMENT — independent, byte-preserving private extraction

- `scripts/mk3_p75_noniff_row_tables.py`: original-source fingerprint and 416-IFF / 20-gap check; bounded 19-region signed-16-bit RLE command parsing with source-positioned X and Y; strict per-row packed pointer limits, source sparse-row sentinel rules and original unparsed-byte retention.
- Each of the **19** reconstructed source-indexed canvases exports exactly **8** private ZIP entries: original compressed first stream, original per-row X i32LE table, original row compressed-offset u32LE table, adjacent unlabeled RGB8 candidate table, source-mapped indexed plane, source-mapped opacity mask, indexed grayscale/alpha PNG and explicitly labeled *experimental* source-adjacent RGB8 comparison PNG. `manifest.json` and `README.txt` bring the private ZIP to **154** entries.
- Original-derived source pixel canvas total: **2,050,843** index/mask positions, with **996,697 explicit painted indices**. Original sparse-row sentinel count: **271**. All 19 declared canvases now have a complete source-table-guided indexed/mask representation; rows without packed data are transparent **in this table interpretation**, not claimed to be an authenticated runtime renderer.
- **1,611,110 source bytes AFTER those row tables remain undecoded.** They are preserved by the existing app raw source fallback, not interpreted as animations, stages or additional image records.
- Every ZIP entry is private. No commercial game binary, original source compressed stream, palette bytes, indexed planes, opacity bytes, or PNG previews are committed to GitHub.
- **No change** to React/Asset Library/workbench, original MK1/MK2/MK3 decoders or accepted P71 application-catalogue count (**17,211**). Do not claim the 19 new standalone representations are integrated app assets.

## TEST / ACCEPTANCE

**Original private fixture:** the P75 exporter returned `pass:"P75",status:"PASS"` on the original user-supplied mk3.zip. The **independent** original-file source/ZIP oracle `scripts/verify_mk3_p75_noniff_independent.py` (does NOT import the P75 decoder) returned `pass:"P75_INDEPENDENT",status:"PASS"`. The oracle independently reparsed all 416 IFF FORM source boundaries, 19 non-IFF row-table layouts, every original row's signed-16 RLE command, 2,050,843 indices and mask bytes, all adjacent RGB8 source tables, the raw row X/pointer tables, and **38 PNG image RGBA pixel planes** with independent zlib/PNG/CRC checking. It also checked that all **154** archive members have unique names and valid ZIP CRCs.

**Synthetic refusal controls:** `scripts/test_mk3_p75_noniff_row_tables.py` **17/17 PASS locally**: exact source-index X/Y placement, -1 row omission, independent row oracle, falsified source SHA, out-of-bounds X, nonzero absent-row offset, unknown negative sentinel, duplicate/inaccurate row pointers, missing first offset, stream escaping source, invalid literal/skip commands, missing row terminator, more than one trailing byte, mid-stream trailing byte, masked opacity accounting.

**Committed code identities, independently compared with original-tested local files:**

- Exporter Git blob SHA-1: `cdd6ea6dd8dbea3743ab1076c74e027dbf7c3bdc`
- Independent verifier Git blob SHA-1: `717a54278fc873e7d850ccd562ade3070e49d8d2`
- Test suite Git blob SHA-1: `c54cb5dce10ad1d599168e2388081fd4d265cbeb`

**GitHub source-only CI:** added a P75 step to `.github/workflows/p11-build-smoke.yml`, including 17 tests, source-only syntax, inherited source guard, build, TypeScript and headless browser startup. Confirm exact CI conclusion and test SHA in PROJECT_STATUS before marking CI as passed.

**Limitations:** the original DOS renderer's control-flow interpretation of source row-X tables is **INFERRED**, not independently EXE-verified. Palette binding is UNKNOWN. Stage names, layering/camera, fighter affiliation, animation sequence and timing are UNKNOWN. The P72 original-directory and Chrome comparison acceptance gates remain pending.

## REPRODUCTION — Windows PowerShell

Run from a current `develop` checkout, with a new private output filename:

~~~powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
python scripts/test_mk3_p75_noniff_row_tables.py
python scripts/mk3_p75_noniff_row_tables.py "E:\GOG\Games\Mortal Kombat 3\mk3" "C:\Temp\mkdos-p75-row-mapped-private.zip"
python scripts/verify_mk3_p75_noniff_independent.py "E:\GOG\Games\Mortal Kombat 3\mk3" "C:\Temp\mkdos-p75-row-mapped-private.zip"
~~~

Alternatively supply a private original `mk3.zip` as the input path; the original `DATA.MK3` SHA-256 must match exactly. The output path must not exist: overwriting an earlier private evidence archive is refused. Never commit private ZIPs and copyrighted game files to Git.

## CLASSIFY / NEXT

**VERIFIED original byte facts:** two source arrays per image-height; row-offset equality across 19 sources; 271 source -1/zero-pointer rows; 2,744 source row streams; all original indexed literal data; complete byte-boundary/accounting; independent 38 PNG pixel-parity checks and 17 synthetic controls.

**INFERRED interpretation:** source X field meaning as left-of-row display offset and source -1 row meaning empty/transparent in the reconstructed canvas. This strongly fits every observed source interval but still needs native renderer corroboration.

**UNKNOWN:** exact palette ownership of source-local 768 bytes, original runtime placement into full stages or sequences, meaning of residual first-stream trailing byte, and 1,611,110 remaining source bytes beyond the row maps. These are not guessed.

**P76 consolidation:** integrate the 19 source-row-mapped graphics into the application under evidence-qualified separate collection entries while preserving indexed/mask provenance and raw fallback. Update cumulative fixture expectations explicitly (do not silently retain or falsely claim P71's historical catalogue count), run focused original-source/browser export validation and full regression where feasible, then checkpoint on `develop`; keep `main` unchanged until accepted. Prioritize completing P72 browser acceptance as part of this consolidation.