# P73 — MK3 original DATA.MK3 non-IFF RGB8 candidate extraction

**Date:** 2026-11-08. **Cycle:** P72–P76, second interim. **Branch:** develop. **Source:** original user-provided private DOS MK3 installation. No commercial bytes in Git.

## OBSERVE — original source

- Original DATA.MK3: **9,015,508 bytes**, SHA-256 **72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517** (same separately verified original as P72).
- 416 fully parsed IFF source images, 125 distinct explicit 768-byte RGB8 CMAPs. IFF FORM ranges cover **4,482,722** bytes.
- 20 disjoint non-IFF gaps account for **4,532,786** bytes. The first starts at **0xA30DA**, spans **1,840,634** bytes and has a different structure. It is intentionally excluded from the P73 table interpretation.
- The remaining 19 gaps have a repeated **24-byte source prefix followed by 768 bytes**. The first two little-endian header words resemble dimensions but their exact semantic meaning is not authenticated.
- Among these 19 candidate 768-byte tables, 17 are byte-distinct. **11 occurrences representing 9 distinct tables exactly equal known source IFF CMAPs**. **8 distinct tables** have no exact source IFF match.
- The 11 identical tables are verified *byte matches*, not verified native color ownership. All 19 are recorded as candidate source tables; the RGB8 layout interpretation is **INFERRED**, especially where no labeled CMAP validates the values.

## IMPLEMENT — bounded private extraction

- Source: **scripts/mk3_p73_noniff_palette_candidates.py**. Input: original installation directory, DATA.MK3 file, or a private original mk3.zip. Foreign DATA.MK3 SHA-256 is refused. The mechanism is **not generalized** to other releases.
- Output: a private ZIP containing **19 exact 768-byte RGB8 table candidates**, each with source offset and SHA-256, manifest.json, and an uncertainty-aware README. Existing unknown source regions are never rewritten or deleted. An existing output ZIP is never overwritten.
- Candidate classification: **VERIFIED_BYTE_IDENTICAL_TO_SOURCE_IFF_CMAP** when a byte-exact IFF match exists, otherwise **INFERRED_RGB8_LAYOUT_ONLY**. Neither classification asserts original FTR fighter palette ownership.
- No React change or new application-catalogue assets: the accepted P71 census remains **17,211**. Original indexed frames, opacity masks, sound files, music and P72 experimental comparison are unchanged.

## TEST

- **Original user-provided private MK3 ZIP, standalone original-source run: PASS.** Output fingerprint, 416/125 IFF CMAP inventory, 20/4,532,786 non-IFF regions, 19 candidate tables, 17 distinct, 11 byte-identical occurrences, 8 new distinct unmatched candidates. All 19 private ZIP entries were independently reopened; every length was 768 and every table SHA-256 matched the manifest.
- **Local source-only test suite: PASS 10/10.** Positive provenance and byte fidelity; unmatched table does not become verified; native fighter ownership stays false; SHA mismatch, malformed CMAP, missing BODY, duplicate CMAP, truncated FORM, short region, duplicate original ZIP names refused; directory reader accepts synthetic test data.
- **GitHub source-only CI:** P73 test integrated into .github/workflows/p11-build-smoke.yml. The exact CI result must be checked before marking source CI as successful.
- **Not tested:** new application/browser behavior (none changed), independent original-source reproduction from the exact new Git commit, graphical rendering of these regions, native palette ownership, full cumulative P71 regression on the new documentation/scripts.

## REPRODUCE (Windows PowerShell)

~~~powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
python scripts/mk3_p73_noniff_palette_candidates.py `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p73-noniff-palettes-private.zip"
~~~

The source can alternatively be the original private mk3.zip. Keep source and extracted bytes outside GitHub and use an output path which does not exist.

## CLASSIFY / NEXT

**VERIFIED:** original source identity, IFF/gap extents, exact repeated 24+768-byte source layout, 11 byte-for-byte IFF table collisions.

**INFERRED:** interpretation of the unlabeled 19 × 768 source regions as RGB8 palette data, especially the eight unmatched distinct tables.

**UNKNOWN:** first 1.84 MiB gap structure, bitmap/animation decoding of remaining non-IFF graphics, native FTR fighter palette ownership, runtime selection, timing and stage composition.

**Next P74:** decode a bounded non-IFF image source with independent indexed/frame byte controls if possible; reapply P73 candidate tables only to their observed source regions, not fighters. The pending P72 original directory + real-Chrome comparison verification should also be completed before calling P72 fully accepted. P76 remains the next cycle consolidation.
