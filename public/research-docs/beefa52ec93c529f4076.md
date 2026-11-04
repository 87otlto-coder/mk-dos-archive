# MK DOS Archive — Pass 1E.3O.61 Browser Animation Export Validation

**Status:** VERIFIED  
**Verdict:** `MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED`

## Purpose
O61 independently validates the actual O60 browser-produced animation ZIP from inside the application path. It is deliberately a reader/validator, not another invocation of the O60 exporter.

## Independent package reader
O61 independently implements:

- STORE-only ZIP local-entry parsing;
- ZIP CRC validation and duplicate-entry rejection;
- deterministic PNG signature/chunk CRC validation;
- stored-DEFLATE zlib parsing plus Adler-32 validation;
- RGBA reconstruction for every PNG;
- FNV checksum/aggregate reconciliation against previously verified O23/O24 evidence;
- indexed descriptor-manifest/binary reconciliation against O18;
- unresolved-palette exclusion checks against O25.

It does not call `encodeBrowserDeterministicRgbaPng` or the O60 ZIP builder during validation.

## Verified O60 surface
Against accepted `MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip` SHA-256
`b68e80c00a9d44c1be7276c514db0d9b0e6e1110d8d1068a0d8048e7f0f69af7`, O61 verifies:

- **2,295/2,295** logical ZIP entries;
- **2,284/2,284** PNGs structurally decoded;
- **2,263/2,263** character-context PNGs with exact per-image FNV checksums;
- all **16** O24 character/palette aggregate+sample checksums reproduced from decoded RGBA;
- **21/21** verified-effect PNGs with exact dimensions/checksums;
- **1,102/1,102** indexed descriptors reconciled to O18 metadata and opaque-index statistics;
- indexed binary length **11,230,148 bytes**;
- exact **79** unresolved O25 descriptors present in the indexed payload;
- **0** unresolved descriptors exposed as character-context RGBA;
- all seven embedded evidence reports present/valid;
- no wall-clock timing promotion and no write path.

## Standalone replay
`scripts/run-browser-animation-export-bundle-validation.mjs` validates an O60 ZIP directly using the evidence reports embedded in that ZIP. This is useful for package acceptance without replaying the full historical research chain.

## Product integration
O61 is stage **70/71** in **Run What's Needed**. Its result is appended to the generic Research Results Workspace like any other research artifact.

## Boundaries
- O61 proves semantic/package integrity, not new palette ownership.
- O24 character-context renders remain explicit context variants, not universal animation palette assignments.
- The 79 unresolved palette cases remain unresolved.
- O26 dwell/control values remain structural units, not milliseconds/FPS.
