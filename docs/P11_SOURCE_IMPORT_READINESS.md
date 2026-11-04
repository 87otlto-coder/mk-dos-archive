# P11 source import readiness — 2026-11-04

## Verified local artifacts (not stored in GitHub)

| Artifact | SHA-256 |
|---|---|
| Full P11 source checkpoint ZIP | `7889917a4e8678c5e625f92a90b9ecb42ea80286a37358392a99d2578b7f00f4` |
| P6 Git-safe source ZIP | `4721c2692994cee31dc756e725149fcdbbdc867c49680896ba944d882cc7ef92` |
| P11 Git-safe source ZIP | `a6a8a6e9eecc4d01f48accf0e2cd37e735c9846621ea60099690e2acfa25296b` |
| Windows Git import kit | `9335c0da8b77b6df371a144e1038b4f09f943d6d6f8669409f023d9c70c9e4d0` |

**This repository currently holds only documentation and governance, not these files.** The artifacts are retained in the associated MK Dos Extractor project conversation. The full source archive is for local custody; **do not upload it unfiltered to GitHub**.

## Audit and validation

- Original P6 source ZIP SHA-256 verified, ZIP tested clean. P6 had 3,096 files.
- Cumulative P10 checked against P6: **18 added**, **one changed** (`src/core/assets/collection.ts`), **zero removed**. P11 adds a consolidation regression script and this phase's handoff, while excluding generated Python cache files.
- The Git-safe P6 ZIP contains 2,011 entries (including detailed source import manifest), with 1,086 historical files excluded for evidence/game media/security/build hygiene.
- The Git-safe P11 ZIP contains 2,033 entries (including manifest and 4 interim patches), with 1,088 files excluded. These omissions are recorded by path and SHA-256 inside `docs/GIT_SOURCE_IMPORT_MANIFEST.json` within each ZIP.
- **All application source files** (`src`) and research code scripts were retained in the filtered packages; large raw research-data and derived assets remain outside GitHub.
- The filtered P11 source was independently extracted and re-tested against an original authenticated MK2 installation, yielding **5,053 unique assets**, 40 P11 checks. P10 225 integration and 61 independent, P8 O210 independent 68, P9 O205, and O195 cross-stage regression passed.
- Source-local stage layers, sequence order and source-linked colors are not full runtime stage assembly, exact animation timing or verified DAC selection.
- Full Vite/React/browser build and MK1/MK3 regression remain **validation pending**.

## Import method

The import kit includes `IMPORT_TO_GITHUB_WINDOWS.ps1`, which verifies ZIP hashes, clones this private repository with the user's normal Git credentials, creates a P6 source commit on `main`, fast-forwards `develop`, then commits P11 consolidated source on `develop`. The script is included as an auditable option because direct connector upload of the archive is unsupported; no force-push is used.

After the import, verify source-bearing commits actually exist on both branches; re-run independent source and browser checks before promoting P11 to `main`. Update `PROJECT_STATUS.md` and close #1/#2 **only after** their acceptance criteria are met.
