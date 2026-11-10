# P82 MK2 native-width stage source layer ZIP — interim implementation

**Date:** 2026-11-10. **Branch:** interim/p82-mk2-native-stage-pack, forked from the P81-consolidated develop merge d6e9c1f. **Status:** source implementation and synthetic refusal tests complete; exact original DOS MK2 installation export + independent PNG/byte replay VALIDATION PENDING. No original commercial binaries or extracted art have been pushed. P82 is the first interim pass toward P86 consolidation.

## Objective and existing verified basis

The established O132 research tools already extract camera-independent source layers for MK2 Kombat Tomb and The Portal. Prior independent work verified complete uncropped 896-column floor source indexes, 29 native sprite source streams, eight setup-local layer mosaics, opacity planes and source EXE stage color records. O132's separate Python CLI expects original EXE and a prepared game ZIP; a user still needs a simpler one-command extractor output. P82 reuses O132 rather than reversing its RLE/palette mechanics or modifying the verified research workbench.

The new scripts/export-mk2-p82-native-stage-pack.py directly opens the user's canonical MK2 installation and builds a single private deterministic ZIP, without changing the original files or replacing any Asset Library content. All required MK2.EXE, TOMB.GRA, PORTAL.GRA, IMAGES.GRA SHA-256 fingerprints are fixed and fail closed (EXE fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65; GRA hashes recorded in producer). Duplicate, missing or altered source files are refused.

## Intended native source contents

| Source | Tomb | Portal |
| --- | ---: | ---: |
| Original full-width indexed floor | 896 × 48 | 896 × 40 |
| Separately exported native source sprite streams | 16 | 13 |
| Source setup-local mosaics | 6 | 2 |
| Indexed/RGBA/opacity PNG export files | 68 | 47 |

For both stages, exactly **115 PNGs**, the original O132 source manifest and a P82 provenance JSON: **117 ZIP members**. Native floor pixels stay 896 columns wide. Sprite streams are uncropped, retain index/opacity source pixels and their source setup-local occurrences. The source EXE 80-entry stage color records produce independently qualified fixed source RGB previews, **not established original DOS runtime palette ownership**. No invented final stage composition, world-space camera, cross-layer placement, frame order, timing, or parallax values.

The source ZIP is never overwritten. A private original ZIP must be created outside SOURCE and outside the original MK2 installation, preferably under FIXTURES/VALIDATION. An existing destination is never modified or deleted, including when exclusive creation fails. The original executable and commercial .GRA bytes are never copied into the exported ZIP.

## Independent original acceptance script

scripts/verify-mk2-p82-native-stage-independent.py is a separate original-byte checker; it does not import the new P82 producer or the O132 exporter. It reopens the original MK2 EXE and GRA files and downloaded P82 ZIP, validates all ZIP member hashes, and independently re-decodes every **uncropped original floor index plane**, all **29 original source packed sprite streams**, and all **eight source setup-local index/opacity mosaics**, comparing every exported L/RGBA PNG pixel. It independently reconstructs stage RGB from authenticated static EXE palette source words and source-index/opacity data. It rejects falsely asserted native animation, camera or stage completeness.

P82 original fixture acceptance requires BOTH producer result P82_EXPORT/PASS and independently reproduced original source PNG result P82_INDEPENDENT/PASS. Source-only CI, syntactic validation or historical O132 acceptance does not replace these new tests.

## Source-only regression coverage

scripts/test-p82-mk2-native-stage-pack.py uses only synthetic fake images and tests deterministic stored-ZIP packaging, original source SHA declarations, strict dimensions/counts, refusing invented native animation, parallax and world placements, rejecting altered manifests or unsafe ZIP member paths, refusing source/data directory overlap, and never overwriting or deleting any existing file. The GitHub workflow runs the P82 source-only tests alongside previous source regression, TypeScript, Vite production build and no-game Chrome boot.

## Windows PowerShell reproduction

All paths follow the required SOURCE / TOOLS / FIXTURES structure. The original MK2 files were previously confirmed under F:\Dev\MKEXT\FIXTURES\mk2\mk2.

    cd "F:\Dev\MKEXT\SOURCE\mkdosext"
    git fetch origin
    git switch interim/p82-mk2-native-stage-pack
    git pull --ff-only origin interim/p82-mk2-native-stage-pack

    $mk2 = "F:\Dev\MKEXT\FIXTURES\mk2\mk2"
    $validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
    New-Item -ItemType Directory -Path $validation -Force | Out-Null
    $archive = Join-Path $validation ("P82-TOMB-PORTAL-" + [guid]::NewGuid().ToString("N") + ".zip")
    $env:PYTHONDONTWRITEBYTECODE = "1"

    python .\scripts\test-p82-mk2-native-stage-pack.py
    python .\scripts\export-mk2-p82-native-stage-pack.py --original-mk2 "$mk2" --out "$archive"
    python .\scripts\verify-mk2-p82-native-stage-independent.py --original-mk2 "$mk2" --archive "$archive"

The archive path must be new; do not precreate or overwrite it. No commercial MK2 source, extracted copyrighted image, PNG, archive or game executable is uploaded to GitHub.

## Research classification / forward gate

**Previously VERIFIED (O132):** original camera-independent source extents, original 896-column floor planes, native sprite/source opacity bytes, source setup-local placements and fixed stage color source records. **P82 source-only VERIFIED if workflow passes:** deterministic, safe original-gated single-ZIP extractor and false-evidence refusal tests. **VALIDATION PENDING:** actual new source-directory-to-ZIP original fixture test, independent all-PNG source readback. **UNKNOWN:** final stage scene assembly, original palette ownership over time, world camera, animation order and timings, runtime parallax.

If P82 original exporter and independent verifier pass, P83 should integrate this source-supported stage layer pack into the Asset Library without cropping original source pixels or inventing native compositing.
