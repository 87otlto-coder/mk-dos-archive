# P77 — MK3 source-chained non-IFF indexed images: 216 original records (197 new)

**Date:** 2026-11-08. **Cycle:** P77–P81, **first interim pass** following the accepted P76 original three-game/real-Chrome checkpoint. **Branch:** `develop`. **Scope:** original-source-indexed graphic extraction, independently tested private exports; **no application catalogue/UI change**, no complete source package or release. The P76 accepted source code and the original MK1/MK2/MK3 baselines remain intact.

## OBSERVE — P75 post-row-table source bytes are additional records

P75 decoded one first source-indexed image in each of 19 non-IFF source spans of the original `DATA.MK3`. P75 correctly preserved but had not interpreted **1,611,110 bytes** following those first record source-row tables. Direct inspection of the original fixture now finds the **same full source record layout repeats** immediately after each first record until the next IFF source FORM boundary:

- A source-local **24-byte header**, with width/height at offsets +0/+2 (u16LE) and first compressed stream length at +20 (u32LE).
- **768 original source-adjacent bytes**, an unlabeled RGB8 candidate (native palette ownership **UNKNOWN**).
- A bounded signed16 row-indexed RLE stream (positive literal indices, negative transparent skips, zero row terminators).
- A source height-sized **signed i32LE row-X array** and **unsigned u32LE compressed-row-pointer array**. `-1` row-X with zero compressed pointer denotes a source row without original packed bytes; interpreted as transparent only for these indexed preview canvases.
- Immediately after both row tables, either the **next complete image record** begins or the original non-IFF source span ends. The **19 independent source spans now tile exactly**, with no unassigned inter-record bytes. No EXE native rendering/timing/scene ownership is asserted.

**Original canonical data fingerprint:** `DATA.MK3` SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`. The original **416 embedded-palette IFF images** and **20 non-IFF spans** (19 fully chained, **one earlier 1,840,634-byte span remains UNKNOWN**) are preserved. Total source bytes covered by all 216 chained records: **2,692,152**. Original DOS commercial source remains **PRIVATE** and not committed.

**Per-source-region record counts (source encounter order only, NOT an animation sequence):**

`[2, 11, 50, 16, 5, 2, 6, 1, 4, 19, 4, 5, 5, 28, 2, 1, 4, 12, 39]`.

## Quantified extraction

| Original source property | All records | NEW records after P75 first image |
|---|---:|---:|
| Original source index/mask image records | **216** | **197** |
| Indexed pixel positions per plane | **8,667,438** | **6,616,595** |
| Original explicit painted indexed pixels | **2,164,384** | **1,167,687** |
| Source rows with X=-1/no compressed row | **8,746** | **8,475** |
| Full declared source rows | **24,811** | **21,796** |

All **216** source records have distinct index+opacity plane SHA pairs, although no claim of 216 independent native gameplay objects/animation sequences is made. There are **31 distinct adjacent unlabeled 768-byte RGB8 candidate values across the 216 source records**, but original runtime palette ownership cannot be inferred from adjacency/repetition.

**The original 1,611,110 P75 trailing bytes are now fully carved into additional graphics.** This does *not* mean the entire original `DATA.MK3` non-IFF content has been decoded: **1,840,634 original bytes in the first non-IFF source span remain UNKNOWN.** Every original raw fallback still exists in the unchanged application.

## IMPLEMENT — preserve accepted code, produce usable graphics

- [`scripts/mk3_p77_chained_source_export.py`](../scripts/mk3_p77_chained_source_export.py): SHA-fingerprinted original DOS source read; reuses the **already verified** P73 source-interval and P75 source-row decoders, iterates source-delimited records, exact byte accounting and strict 216 count. Creates a private **1,730-member ZIP** consisting of **8 records per original graphic** (original compressed stream, original signed row-X, unsigned row pointers, unlabeled comparison-only RGB8 bytes, indexed pixels, binary mask, grayscale original-index PNG, and *explicitly experimental* adjacent-RGB8 PNG) plus manifest and README. Original source byte offsets, lengths, dimensions, row/X provenance, SHA-256 per output and all native ownership UNKNOWN tags preserved. Refuses unknown source SHA, malformed chains and output overwrite. No deleted/replaced P75 research workbench.
- [`scripts/verify_mk3_p77_chained_source_independent.py`](../scripts/verify_mk3_p77_chained_source_independent.py): **does not import the new P77 extractor**; reuses the prior independently accepted P75 source FORM/row interpreter and P74 PNG/CRC readback to independently verify all original source record boundaries, 216 indexed/mask planes, both row tables, source streams, RGB candidates, **432 image PNG RGBA planes**, and previous independently verified **19 P75 first source records**. Requires the user's private original P75 archive to cross-check source parity.
- [`scripts/test_mk3_p77_chained_source_export.py`](../scripts/test_mk3_p77_chained_source_export.py): **9 synthetic cases** of two-record chained exports, grayscale index and mask coordinates, opaque index zero, experimental candidate without native assignment, malformed second record/size, duplicated row pointers, false source SHA, source group vs runtime animation separation. This runs in source-only CI with **no commercial original data**.
- `.github/workflows/p11-build-smoke.yml`: P77 syntax and source-only test step plus preexisting P72–P76 regression, tracked commercial-file safety guard, TypeScript, Vite and offline Chrome-boot smoke. Check precise successful workflow run before asserting CI PASS.

## TEST / EVIDENCE

**Original-source independent local PASS:** Source file `/mnt/data/mk3.zip` was read directly; a separately authored original-source P77 exporter produced **216** source records in **1,730** private ZIP members. An independently implemented original-data parser compared every source record boundary, **1,296 exact binary sidecars totaling 20,021,844 evidence bytes**, **432 PNGs pixel-for-pixel**, all **8,667,438** indexed/mask positions per plane and **114 exact first-record binary cross-checks against the accepted 19-record P75 archive**. It returned `pass:"P77_INDEPENDENT",status:"PASS"`, with **0 unassigned bytes across all 19 chained original non-IFF spans**. These tests used original user-provided private sources, **not** fabricated game bytes. This is original-archive verification, not an assertion of original EXE renderer behavior.

**New compact/reusable committed extractor source parity:** The tested compact P77 exporter produced a second 216-record private archive with the **same original indexed/row/P75 byte-level source acceptance**. It was tested locally with faithful P73/P74/P75 helper adapters mirroring the accepted helper contracts; the full new exact-source Python imports and synthetic cases are exercised separately by GitHub source-only CI. An additional **actual Windows original-installation run of this new committed source with the independently accepted verifier** remains recommended before integration into the browser. Do not claim that a P77 real-Chrome Asset Library workflow was performed; these 197 assets are not yet in the app.

**Committed/tested source blob identities** (byte-identical to locally tested sources, checked through the GitHub connector):

- Exporter `67b847fa9f5e0123cfd2db2b19ebc0bc23761446`
- Independent P77 oracle `a1571039efe9284325c810a487f3b9e9bed1a038`
- Source-only 9-case regression `98cf4b3396d486896d23571fbaa31efc91901ea0`

Source-derived PNGs and private ZIPs **stay out of GitHub**; only code, metadata and reproduction instructions are committed.

## Windows PowerShell reproduction

Run from the `develop` repository checkout. Use **new**, non-existing private output paths each time. The `P75` original archive is the existing independently accepted archive; if not available locally, regenerate with the committed P75 script.

~~~powershell
cd "$HOME\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
python scripts/test_mk3_p77_chained_source_export.py

$mk3 = 'E:\GOG\Games\Mortal Kombat 3\mk3'
$p75 = Join-Path $env:TEMP ("mkdos-p75-" + [guid]::NewGuid().ToString("N") + ".zip")
$p77 = Join-Path $env:TEMP ("mkdos-p77-" + [guid]::NewGuid().ToString("N") + ".zip")

python scripts/mk3_p75_noniff_row_tables.py "$mk3" "$p75"
python scripts/mk3_p77_chained_source_export.py "$mk3" "$p77"
python scripts/verify_mk3_p77_chained_source_independent.py "$mk3" "$p77" "$p75"
~~~

No browser test is required for the standalone script, because it has **no new browser app surface** yet. Its independent original ZIP/Png byte verification is reproducible from actual original source.

## CLASSIFY / NEXT

- **VERIFIED original source:** 19 repeatedly bounded non-IFF graphics spans now contain 216 fully qualified source record extents with no inter-record unassigned bytes; 197 additional source-indexed records and their 6,616,595 index/mask positions, 1,167,687 original painted pixels and 8,475 source-absent rows; 19 P75 first source records remain byte-identical; independent ZIP and 432 PNG RGBA parity.
- **INFERRED:** per-row X coordinate and source -1 absent-row render-as-transparent image preview semantics. Repeated source tables and 216 independently congruent records strongly support this, but native DOS EXE renderer corroboration is not yet present.
- **UNKNOWN:** native palette ownership, original stage compositing/layer/camera placement, animation membership/order/timing, native character relationships, original leading 1,840,634 non-IFF bytes.
- **VALIDATION PENDING:** P77's 197 additional graphics have **not** been integrated into the app or validated in actual Chrome. The accepted P76 default baseline **17,211** and explicit 19-image P76 option **17,230** remain unchanged. No assertion of a new **17,427** cross-game catalogue or any browser-facing count is made.
- **NEXT P78:** extend the existing P76 source-fingerprinted original MK3 opt-in workflow to offer **197 additional source-qualified indexed images** in a separate group, preserving the previous P76 first-19 entries, source raw fallback and every other game. Validate new source-positive and false-source cases, source-index/mask/ZIP provenance and original browser export. Only claim a new app count once actual code and original browser acceptance support it. P81 remains the next planned five-pass consolidation. Keep `main` P16.
