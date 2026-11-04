# GitHub source import verification — 2026-11-04

## Direct GitHub checks

- Repository: `87otlto-coder/mk-dos-archive` (private).
- `main` import commit: `eb9691510ce57dd1a7670fcf404de0c0dbd6941b`; original P6 source baseline.
- `develop` import commit: `65023df71d20eb049a571d6a0d1672d670cddf92`; consolidated P11.
- `src` directory reachable on both branches. Recursive Git trees not truncated: `main` **2,070** entries / **358** source files under `src/`; `develop` **2,094** entries / **362** source files under `src/`.
- The `develop` comparison is one source commit ahead of the P6 import, adding P7 Forest, P8 Pit lower wall, P9 Pit upper layers, P10 Pit bridge actors, independent verification scripts and interim patches. `src/core/assets/collection.ts` differs as expected.
- Both branches include `docs/GIT_SOURCE_IMPORT_MANIFEST.json`. The manifests record omitted non-source files with hashes.
- Neither full tree has tracked filenames ending in `.exe`, `.gra`, `.u8`, `.ftr`, `.mid`, `.wav`, `.ogg`, `.mp3`, `.flac`, `.png`, `.jpg`, `.gif`, `.zip`, `.7z`, `.rar` or `.dat`. This is a filename-based check of the committed tree, **not** a full content-safety audit.

## Verification distinction

Before the GitHub import, a separately extracted Git-safe P11 source ZIP had passed the canonical local MK2 headless scanner (**5,053 unique assets**) and associated source parity tests. This does **not** yet constitute an independent fixture/test run from the *GitHub checkout*. No browser build or UI verification is claimed.

**Remaining:** compare GitHub clone to audited ZIP contents, rerun P6/P11 independent tests with legitimate original local game files, complete Vite/React browser workflow validation, and qualify P11 promotion to `main`. The original commercial files and raw forensic dumps remain outside GitHub.
