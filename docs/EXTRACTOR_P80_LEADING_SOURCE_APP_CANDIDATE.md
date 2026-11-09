# P80 interim candidate — original MK3 leading source indexed base and individually exportable continuation records

**Date:** 2026-11-09. **Cycle:** fourth interim pass, P77–P81, after accepted P78 real-DOS/Chrome and verified standalone P79 source extraction. **Branch:** `interim/p79-original-extraction`; **main** and **develop** remain untouched. **Status:** source implementation and synthetic source controls verified; complete original TS scanner and actual Chrome P80 browser export **VALIDATION PENDING** until separately run. No commercial source bytes, previews or derived graphics committed.

## OBSERVE / RECORD: original P79 leading source data

Original DOS `DATA.MK3` SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`. P79's independently accepted original readback located the first 1,840,634-byte original non-IFF interval at absolute `[667866,2508500)` and proved its exact byte boundaries. Original header: `u16LE count=216; width=320; height=200`; adjacent **768 original unlabeled bytes**; `u32LE reserved=0, baseLength=64000`; **64,000 original source indices** SHA-256 `3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e` (187 distinct index values). An original source candidate RGB8 SHA-256 `5c24387cbd82dc380b8e1b73e83aef1aca90889a8f593a30f05cb133b17eebad` is preserved as unlabeled comparison-only evidence.

After the base source plane, precisely **216** 14-byte tagged source headers and their stored payloads exactly fill the interval: **1,772,828 payload bytes + 3,024 header bytes**; 216 original source records, not 216 verified decoded video frames. Independently observed source auxiliary-field groups: **209 nonempty records (fieldA=0,fieldB=64000)**, one nonempty first record **(fieldA=47679,fieldB=51839)**, and **six empty records (ordinals 120–125, both fields zero)**. All tags are `3`. The first record's exact source bytes SHA-256 `1680fea962962e8370208663baf1067e69b12e34e5539104f1ba7774889ae961`; the empty ordinal-120 header SHA-256 `ff2713d691dd08e12f20857d486a4562a2f873bd718611981b93fc6c008e393a`.

Several nonempty payloads show repeating triplets such as `80 81 00` and `80 FF F9`. These patterns by themselves do **not** prove a codec, a delta operation, changed image pixels, frame order, palette or animation timing. No renderer reconstruction has passed an independent original source pixel oracle. This is **validation pending, not verified decoded continuation images**.

## HYPOTHESIZE / SELECT IMPLEMENTATION

The original leading 320×200 plane is independently verified as an **indexed image data source** with a row-major preview interpretation. To advance extraction without speculative source changes, expose that source-indexed base and its **216 separately selectable/exportable original raw stored records**. The base grayscale preview uses a deterministic mapping `gray=32+round(223*index/255)` and 100% opacity **only to display the index map**; because there is no authenticated original alpha, **do not export an invented original mask plane**. The adjacent original RGB8 768-byte data remains source evidence and never becomes an assigned native palette. Native rendering, palette ownership, stage/compositing association and animation timing are unknown.

## IMPLEMENT (committed code)

- `src/core/assets/mk3LeadingSpanP80.ts`: bounded source-format parser and opt-in recovery. Requires the canonical original 9,015,508-byte `DATA.MK3` SHA, original 416 IFF/20 raw source partitions, accepted 9,402 in-app MK3 catalogue including all 19 P76 and 197 P78 records, exact first raw span and P79 counts. Rejects unsupported source record tags, oversize/incomplete payloads, malformed base geometry, wrong original fingerprint, absent or ambiguous identity, missing six canonical empty records, duplicate new asset IDs, and loss of original source partition. Returns **one** indexed base image and **216** original raw assets, each with exact source start/length, original 14-byte header + payload, source ordinal and unchanged auxiliary fields. Mark every raw continuation as **NOT A DECODED FRAME**. No existing original asset or opaque raw fallback changes.
- `src/components/AssetBrowser.tsx`: adds an explicit post-P78 opt-in button **Show leading base image + 216 raw records**; it creates a separate P80 base-image group and P80 raw-record group, preserves source switching aborts and existing P76/P78 on-demand controls. Source count transitions by opt-in: default **9,186**, P76 **9,205**, P78 **9,402**, P80 **9,619** MK3 asset representations. The P80 in-browser 9,619 total is *implemented but NOT original browser accepted* until the real Chrome runner passes. No native opacity or palette assigned.
- `scripts/test-p80-leading-source.cjs`: synthetic source first/empty record reconstruction, no invented mask, indexed original source evidence ZIP and metadata, malformed source refusal tests, UI opt-in/source-reset guard. These do not require commercial original bytes.
- `scripts/verify-mk3-p80-original.cjs`: **PENDING original Windows full-scan acceptance**; runs independent P79 source exporter/readback and actual full `scanMK3` + accepted P76/P78 recovery + P80; byte-checks every **216** original raw continuation, preserves six empty headers, every base index and grayscale preview position, original indexed ZIP fields and P76/P78 IDs.
- `scripts/verify-p80-browser-leading.cjs` + `scripts/verify-mk3-p80-browser-independent.py`: **PENDING real Chrome original DOS acceptance**; requires actual directory picker, opt-ins `9186→9205→9402→9619`, preservation of P76/P78 gallery filters, original index ZIP download and full **64,000** PNG pixel parity, and standalone downloads of one nonempty original record 000 and original empty record 120 with independent source byte readback. The original alpha remains unknown; ZIP must not contain an alpha mask or paletteRgb.

## TEST / CLASSIFY CONFIDENCE

- **VERIFIED ORIGINAL SOURCE:** P79 source extraction/independent 223-ZIP-member and 220 raw-part readback on user's Windows installation; exact original DOS `DATA.MK3` fingerprint, 320×200 index plane, 216 raw records and six empty source headers; 1,840,634 source bytes losslessly accounted. P77/P78 separate 216 original *other* source images already accepted independently; do not conflate these 216 raw P79 records with the P77/P78 source image records.
- **SOURCE-ONLY VERIFIED (CI):** synthetic parser and indexed evidence/absence-of-alpha-mask controls; TypeScript Vite production build and no-game Chromium boot once final workflow reports success. CI has no original commercial source.
- **VALIDATION PENDING:** isolated committed P80 TypeScript original-data parity, full original MK3 source scanner + all 216 P80 source records, actual Chrome indexed ZIP + raw record downloaded source-parity. None of these are established merely by CI syntax.
- **UNKNOWN:** original opacity, native palette and RGB ownership, first-region stage identity, meaning of `fieldA/fieldB`, whether the continuation payloads encode images/deltas, their order or timing, runtime compositor. Do not advertise 216 continuation frames.

## Reproduction on user's original Windows installation

Run from the P79/P80 **interim branch**, with installed Node/TypeScript, Pillow, Google Chrome and external `playwright-core` on `NODE_PATH`:

~~~powershell
cd "$HOME\mk-dos-extractor"
git switch interim/p79-original-extraction
git pull --ff-only origin interim/p79-original-extraction
npm.cmd run build
$env:NODE_PATH = Join-Path $env:TEMP "mkdos-p68-driver\node_modules"
$mk3 = 'E:\GOG\Games\Mortal Kombat 3\mk3'
node .\scripts\verify-mk3-p80-original.cjs "$mk3"
node .\scripts\verify-p80-browser-leading.cjs "$mk3"
~~~

Require separate `P80_ORIGINAL:PASS` and `P80_BROWSER:PASS` machine-readable results before marking P80 original app acceptance. Keep all copyrighted original DOS data/exports outside Git. P81 remains the fifth-pass consolidation; stable `develop` and `main` remain unchanged.
