# P25 — original ARENA.GRA indexed images

Date: 2026-11-06. Fourth interim pass after P21. Baseline: P24 `04fac91588c3c4fa6897260d7250710aac138aee` on develop. Main remains P16.

## Outcome

Added **15 original descriptor-backed ARENA.GRA images** to the Asset Library's sprite previews, PNG and selected-ZIP exports. Coverage & evidence provides `MK2_P25_ARENA_15_ORIGINAL_INDEXED_IMAGES.zip`: 15 PNGs, 45 sidecars and an ordered manifest. The current original-MK2 collection is **5,220 unique representations**, up from 5,205. All three previous ARENA floor representations remain available unchanged.

Across P22–P25, the current source adds **102 original indexed image representations** to the P21 census: CAVE 49, ARMORY 18, BATTLE 20 with all 40 witnesses retained, and ARENA 15. This is an extractor coverage improvement, not a completed stage reconstruction or a count of newly decoded commercial files.

## Original-source qualification

- Canonical EXE SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original ARENA.GRA: **126,328 bytes**, SHA-256 `37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb`.
- Filename-pool slot **31**, Object-2 image base **0xA0C54**, original eight-byte descriptor table **0x18610**, **15 distinct records/source intervals**. This applies existing O110A source research with fresh independent original-file parity.
- All fifteen streams form a contiguous **[0,36172)** image prefix: **36,172 encoded bytes / 65,736 indexed pixels**. Native widths/heights come from original descriptors.
- **90,156 bytes remain outside this P25 image-family qualification**. They include **54,316 intervening bytes [36172,90488)** and the existing **35,840-byte native floor [90488,126328)**. Outside this family does not mean globally unqualified in earlier research. P25 does not reinterpret those intervening bytes or claim full ARENA image coverage.
- The cumulative gate explicitly retains all three previous ARENA floor records at source offset **90488** and compares the uncropped raw floor bytes directly with original ARENA.GRA.

The adapter requires one authenticated EXE/GRA pair, canonical full hashes/sizes, correct resource slot and exact stream partition. Missing, duplicate, synthetic, corrupt or truncated source suppresses the new family without returning partial assets/package.

## Data and interpretation boundaries

Native indices, opacity and descriptor provenance are preserved. Diagnostic grayscale shows original numeric indices with original opacity, not original runtime RGB. Palette-known masks are all zero. Descriptor ordinal is source provenance, explicitly not animation order. Native palette ownership, timing, stage attribution, world placement and full-scene composition remain unknown.

The unchanged native row decoder from P23 is reused after independent ARENA verification. Prior adapters, research code and UI layout are untouched. New behavior is confined to this family, additive collection/report registration, current regression selection and source-only verifier syntax checks.

## Fresh verification

| Gate | Result |
|---|---|
| ARENA adapter/reference/export suite | **284 checks PASS**, 15 images / 65,736 pixels, eight negative source cases |
| Independent original-file PNG/sidecar readback | **394,675 checks PASS**, every PNG, index/opacity/unknown-palette plane against original-file decoding |
| Falsified exports | **Three rejected** with valid archive/PNG CRCs: mutated indices, wrong PNG pixels, invented palette ownership; clean export reverified |
| Full current cumulative collection | **5,220 unique assets / 865 checks PASS**, retaining earlier groups, source package identities and raw ARENA/ARMORY/BATTLE floor bytes |
| Consolidated current runner | **13 MK2 suites PASS**, including CAVE 862, ARMORY 335, BATTLE 432 and seven earlier focused suites 818,695 checks |
| Local source checks | **370 TypeScript files / zero syntax errors**, TypeScript, production build, verifier syntax and diff-whitespace checks PASS; existing Vite large-chunk warning retained |

ARENA evidence ZIP SHA-256: `1cad7584431335343cf95a0c6cabda74d88a2a50b6f3c76a669ba03ed3f60dc5`.

CAVE/ARMORY/BATTLE evidence ZIPs retain their exact previous hashes. The independent Python reference derives pixels and hashes from original EXE/GRA rather than TypeScript output, and reuses the independently implemented PNG CRC/zlib/filter reader from P22. Reference JSON contains geometry/hashes only. Original game files, PNGs and private export/falsification ZIPs remain outside GitHub.

[Machine-readable P25 results](validation/P25_ARENA_REGRESSION_2026-11-06.json).

## Reproduce

```powershell
node scripts/verify-mk2-p25-arena.cjs <MK2-dir> adapter.json private-arena.zip
python scripts/verify-mk2-p25-arena-independent.py <MK2-dir> --export private-arena.zip --report independent.json
python scripts/test-mk2-p25-arena-negative.py <MK2-dir> private-arena.zip <private-output-dir>
node scripts/verify-p21-checkpoint.cjs --mk2 <MK2-dir> --through p25 --report regression.json
```

Keep outputs outside original game directories and the Git checkout. The current runner defaults to P25. Earlier through-pass options require matching historical source, and older fixed-census scripts remain preserved.

## Confidence and next checkpoint

**VERIFIED:** original descriptor/native index/opacity geometry, contiguous prefix, independent export parity, cumulative additive census and earlier source/floor/archive preservation.

**UNKNOWN:** runtime RGB ownership, original animation order/timing, live placement, gameplay stage identity and full scene assembly. ARENA is a source filename, not a newly authenticated scene name.

**VALIDATION PENDING:** original-data browser interaction. Source-offline Chrome CI is separate. MK1/MK3 were explicitly not freshly fixture-regressed in P25; P21 remains their latest recorded fresh fixture evidence. The original extracted MK2 fixture is used; directory identity and full original EXE/ARENA hashes do not claim a fresh ZIP download/hash/re-extraction.

P26 is the next fifth-pass consolidation candidate: preserve P22–P25, rerun the complete current multi-game suite, audit the complete Git-safe source tree and consolidate verification/continuity without inventing runtime confidence. Assess outstanding browser gates explicitly. Keep main unchanged unless separately authorized; do not treat consolidation as automatic promotion or a completed-product release.
