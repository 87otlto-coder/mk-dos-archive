# P74 — MK3 original DATA.MK3 source-constrained non-IFF first indexed graphics

**Date:** 2026-11-08. **Cycle:** P72–P76, third interim. **Branch:** develop. **Status:** original user-supplied DOS source and independent ZIP/PNG verification **PASS**; GitHub source-only CI recorded separately in PROJECT_STATUS once concluded. **Main** remains stable P16; P71 remains the latest accepted cumulative original-source/Chrome three-game application checkpoint.

## OBSERVE — direct original-data evidence

- Original source DATA.MK3: 9,015,508 bytes, SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.
- The 416 IFF FORM images and all 20 non-IFF source intervals are unchanged from P73. The first differently formatted 1,840,634-byte gap is left UNKNOWN.
- In the remaining 19 gaps, original bytes 0–1 and 2–3 form plausible little-endian width/height fields; bytes 20–23 give a **source-exact declared first-stream compressed length**; bytes 24–791 contain the same original 768-byte unlabeled candidate RGB table from P73; the first compressed stream begins exactly at region offset +792.
- Repeated signed-16-bit little-endian command grammar: positive N consumes N literal original palette indices, negative N skips -N pixels (explicit unpainted region), zero ends the row. Reject literal overflow, skip overflow, missing row terminators, out-of-range dimensions, foreign source identities and unexplained multi-byte stream suffixes.
- **14 first streams consume all header-declared image rows** and reach exactly the declared packed-stream boundary, allowing at most one residual original byte whose interpretation is **UNKNOWN** (not universally zero). They recover **1,715,412 indices and 1,715,412 opacity values**, including **856,485 explicit painted pixels**. The exact 14 ordinal IDs are **1, 2, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18**. This is a repeated, source-constrained *first-image* decoder, not a full non-IFF container decoder or native renderer attribution.
- **Five first streams decode fewer complete rows than the header dimensions:** ordinal **3: 18/200; 4: 261/263; 7: 32/39; 16: 82/86; 19: 124/200**. These are **PARTIAL**, not falsely exported as full image planes. Unknown trailing rows are not asserted transparent or populated with synthetic pixels.
- Beyond those first compressed streams, **1,635,230 non-IFF region bytes** remain undecoded. Those bytes are preserved by the existing application raw fallback; do not invent extra frame count, sequence, animation timing, stage relationships or native palette ownership.

## IMPLEMENT — bounded standalone extraction

- `scripts/mk3_p74_noniff_indexed_graphics.py` reads only the canonical, SHA-fingerprinted original DATA.MK3 via the existing P73 loader. It decodes the first signed-16-bit-RLE stream from all 19 source-candidate regions, recording full/partial status.
- For **14 fully row-qualified graphics**, the private ZIP exports: original indexed pixel bytes, binary opacity mask, exact compressed first-stream bytes, original neighboring 768-byte source RGB candidate table, PNG grayscale-index/alpha preview, and a **separately labeled comparison-only PNG** applying that source-local unlabeled RGB table.
- For **5 partial regions**, the ZIP preserves original compressed first-stream bytes, candidate RGB source bytes and exact partial-row provenance **without producing misleading full-size image/mask/color exports**.
- A manifest records source region/stream offsets and lengths, per-plane/source-table SHA-256, row and paint census, unknown trailing bytes and undecoded suffix lengths. No source commercial material is committed to Git.
- `scripts/verify_mk3_p74_noniff_independent.py` reopens the **original** DOS source and private P74 ZIP, uses a separate command/row parser, independently verifies compressed stream bytes, table bytes, all exported indexed and opacity planes, and decodes all **28 PNGs** using a separate PNG/deflate/CRC reader for exact source-index/RGBA parity.
- `scripts/test_mk3_p74_noniff_indexed_graphics.py` contains **17** source-only synthetic tests, including malformed RLE and ownership/mask/PNG/source-boundary false-claim refusals. Integrated into GitHub build-smoke workflow.
- **No application asset collection changes:** accepted catalogue count remains **17,211** (MK1 2,656 / MK2 5,369 / MK3 9,186); existing workbench, source decoders, browser/UI and all P71/P72 provenance remain intact.

## TEST — independently observed

1. On original private uploaded `mk3.zip`, the P74 exporter returned `{"pass":"P74","status":"PASS","firstStreams":19,"completeIndexedImages":14,"incompleteIndexedImages":5,"nativeFighterPaletteOwnershipVerified":false}`.
2. Independent reader returned `{"pass":"P74_INDEPENDENT","status":"PASS","fullyReconstructedIndexedImages":14,"partialFirstStreams":5,"independentlyCheckedPixelsPerPlane":1715412,"independentlyCheckedRGBAImageCount":28,"noNativePaletteOwnershipClaimed":true}`. All 96 ZIP entries had valid ZIP CRCs.
3. Local source-only suite returned **17/17 PASS**.
4. Exact original-test source identity: GitHub object SHA-1s for scripts are **f643726150931c533efa64066d750b5822eb2274** (exporter), **05a1538030330e4ed6671ac8512d6dc1c980d168** (tests) and **b89b6218ce8b3245c6b824c077bcf806331aefbb** (independent source oracle), each independently compared with local tested file `git hash-object`.
5. **CI result:** see PROJECT_STATUS status entry/linked run. No original DOS commercial binaries present in GitHub Actions. **Browser runtime acceptance:** NOT PERFORMED (new functionality is standalone CLI; no UI was modified).

## REPRODUCE — PowerShell, private output folder

~~~powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop

python scripts/test_mk3_p74_noniff_indexed_graphics.py

python scripts/mk3_p74_noniff_indexed_graphics.py `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p74-noniff-indexed-private.zip"

python scripts/verify_mk3_p74_noniff_independent.py `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p74-noniff-indexed-private.zip"
~~~

Output ZIP refuses an already existing destination; use a new private filename. Do not commit original inputs, extracted indices, candidate RGB bytes, screenshots, private ZIPs or derived media.

## CLASSIFY

- **VERIFIED original source and independent reconstruction:** exact source identity, 19 first-stream locations, 14 completely row-qualified indexed/opacity planes, 5 partially row-qualified streams, 28 exact PNG pixel readbacks.
- **INFERRED grammar:** the signed-16-bit positive-literal/negative-transparent-skip/zero-row interpretation is strongly reproduced across the 19 regions, but has not yet been tied to the original DOS renderer's executable control flow. Header width/height are source-consistent; no native runtime call-site claim.
- **UNKNOWN:** native source palette association for unlabeled RGB8 tables (despite visually meaningful colors), original stage names, stage compositing and camera origin, original sprite animation frame order/timing, meaning of some single trailing stream bytes, and the 1,635,230 bytes after all first streams.
- **VALIDATION PENDING:** P72 original complete-source comparison and real Chrome acceptance; independent DOS runtime debugger provenance for this non-IFF RLE grammar.

**P75 recommendation:** boundedly investigate subsequent source records **after** these first streams: establish whether the retained 1,635,230 bytes contain source-framed additional graphics before attempting animation playback or stage assembly. If source structure permits repeated independent frame decoding, add indexed/mask exports without inventing frame order/timing. Expose verified P74 graphics in the application in a regression-controlled manner at P75/P76; do not silently alter the P71 asset count or approved full checkpoint.
