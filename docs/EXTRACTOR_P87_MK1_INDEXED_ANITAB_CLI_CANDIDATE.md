# P87 — headless MK1 original indexed ANITAB source extraction candidate

**Date:** 2026-11-13. **First interim pass after accepted P86 fifth-pass checkpoint.** Branch: interim/p87-mk1-indexed-anitab-cli, from accepted interim merge 20460f2e59ce526ec1d6cd8997a3ef72f7a196bc. Do not promote main/develop, package full source, or release this pass.

**Classification:** P87 source implementation candidate, **hosted Windows SOURCE-ONLY CI PASS**; new original MK1 runtime accepted from user-run evidence on 2026-11-14 (exact local Git identity file remains unread). The inherited P65 original-fixture indexed-source package was already independently accepted, not automatically a P87 CLI pass.

## Objective and bounded coverage

Expose the **already verified P65 MK1 ANITAB + O60 original indexed source package** via the established headless mkext.py scan/extract/verify --game mk1. No new graphics codec or palette interpretation.

Original EXE SHA256: 750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14.

Original structures: 8 ANITAB tables, 739 source entries, 514 distinct executable stream starts, 1,102 indexed sprite descriptor records, 1,824 source frame instructions, 786 control instructions and 1,853 source frame-part occurrences. The accepted P65 original verifier independently reads original EXE table cells, opcodes, source vectors, descriptors and O60 indexed bytes. These are **not** 1,102 verified native gameplay frames.

The original P65 ZIP has **four source members**, preserving indices and opacity masks:
- manifests/mk1_source_streams.json
- indexed/descriptor_manifest.json
- indexed/descriptor_pixels.bin
- README.txt

The CLI scans the existing 2,656-resource MK1 collection to produce that *subset*, not a complete 2,656-item headless export. It deliberately creates **zero PNG previews**. Native original palette ownership, opacity interpretation beyond indexed masks, runtime frame traversal, animation timing, clip names, actor Z order, positioning and stage composition remain UNKNOWN. No native assignment is invented.

## Committed implementation

- scripts/mk1_p87_source_bridge.cjs: Reuses the existing TypeScript scanAssets and P65 package producer without changing them; requires canonical original EXE and four P65 package members. Extract and verify run the **existing independent verify-mk1-p65-anitab-streams.cjs original-source oracle** and compare the actual private ZIP byte-for-byte to a recomputed accepted package. ZIP creation is exclusive (wx), never overwriting. Both direct and Python entry points guard SOURCE, original files and private export paths.
- scripts/mk1_p87_cli.py: Thin Python adapter with stable MK1 CLI output, additional original-source oracle field requirements, and a separate Python SHA256 check of the private ZIP.
- scripts/mkext.py: Dispatches --game mk1 to the new adapter while preserving previously accepted MK2 P84 and MK3 P85 implementations. MK2-only --stage tomb|portal is refused for MK1.
- scripts/test-p87-mk1-cli.py: Original-free synthetic tests, fake source fingerprint refusal through actual Node bridge, counterfeit source/summary/oracle/native timing assertions, and non-overwrite/path separation controls.
- Existing P84/P85 unsupported-game tests updated to reject mk4 rather than newly supported mk1. Windows-only source CI now includes P87 tests and JS syntax checks, retaining opt-in browser artifacts and no commercial game files.

## Original MK1 Windows P87 acceptance — PASS (2026-11-14)

**ORIGINAL MK1 CLI SCAN / EXTRACT / VERIFY: ALL PASS.** The user pasted the full PowerShell transcript from `F:\Dev\MKEXT\SOURCE\mkdosext`, including clean source check, `git fetch origin`, `git switch interim/p87-mk1-indexed-anitab-cli` ("Already on", "up to date") and `git pull --ff-only origin interim/p87-mk1-indexed-anitab-cli` ("Already up to date"). All **11 P87 original-free synthetic tests** passed locally on that checkout, then the new original MK1 CLI ran against `F:\Dev\MKEXT\FIXTURES\mk1\mk1`:

- **`P87_CLI_MK1_SCAN / PASS`:** canonical `MK1.EXE` SHA256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`; original MK1 library census 2,656; eight ANITAB tables, 739 entries, 514 original executable stream starts, 1,102 original source indexed descriptors; **11,230,148 indexed source binary bytes**, four P65 ZIP members; no preview PNGs.
- **`P87_CLI_MK1_EXTRACT / PASS`:** new private ZIP `F:\Dev\MKEXT\FIXTURES\VALIDATION\P87-d779725fb21a4a31af69f0cc624d03ca\mk1-indexed-anitab-source.zip`; `sourcePackageByteIdentical: true`, `recomputedPackageSha256: d7a94c1473e1ab409eea62d7899f8d548eb9143f4d1c5add83c5430ba22e51e8`. Nested **`P65 / PASS`** source oracle independently checked 8 tables, 739 original cells, 514 streams, 1,824 source frame instructions, 786 control instructions, 1,102 descriptors and 1,853 source part occurrences; original EXE opcode/pointer and O60 original indexed payload byte-match flags true.
- **`P87_CLI_MK1_VERIFY / PASS`:** separate original game/ZIP verification reran the same independent `P65 / PASS` oracle, compared recomputed package bytes and returned **the identical SHA256** and `sourcePackageByteIdentical: true`.

**Preserved uncertainty:** Both reported results set `nativePaletteOrTimingClaimed:false`, `nativeRuntimeTraversalVerified:false`, `finalActorPlacementOrStageCompositeClaimed:false`, `completeMk1CatalogExportClaimed:false`, `previewPngsCreated:0`, `browserRequired:false`; independent P65 also records `browserPackageDownloadVerified:false` and `fullThreeGameRegressionPerformed:false` for **that focused subtest**. These are the intended limits, not failures. The separate P86 nine-group three-game+Chrome checkpoint remains historically accepted, not rerun here.

**Exact checkout provenance classification:** The user created a private `source_identity.txt` with `git rev-parse HEAD` and `git rev-parse 'HEAD^{tree}'`, but **did not paste those two values**. GitHub independently confirms P87 candidate head `84cafbe279235c43273da860a16ee8e47b434b94` / tree `a01dccc50964598f342ead0593d1d307db6aa44f`, and the user's successful fast-forward pull reports up to date. Associating the original run with that precise head/tree is therefore **INFERRED from branch synchronization, not independently verified from the missing local identity file**. The exact executable P87 bridge, Python CLI, original-free tests, inherited MK2/MK3 adapters and Windows workflow are Git-blob identical to successfully source-only Windows-tested `1c9e7515da52febe2478c3e896b5adf5462f3d2d` (tree `f3641fc02f9fafa1250a92a5336b41232350f1a9`). Also [Windows Actions #43508603507](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43508603507) completed **SUCCESS** on candidate head `84cafbe`, independently hosted without original game files.

**Classification:** P87 bounded MK1 CLI original-fixture functionality **VERIFIED FROM USER-RUN ORIGINAL WINDOWS PROCESS OUTPUT**, source-only Windows CI **VERIFIED**. Exact local tested commit/tree **VALIDATION PENDING direct readback from private source_identity.txt**; no false assertion of original-file bytes being uploaded, of a second machine independently opening the original commercial source, or of native palette/timing. Original ZIP and JSON evidence remain private under FIXTURES and have not been submitted to GitHub. P87 first interim pass may be merged to the already-accepted interim baseline only; no `main`/`develop` promotion, no full-source checkpoint or release.

## Source-only Windows CI — VERIFIED PASS (2026-11-13)

GitHub Actions [run #43508016253](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43508016253) completed **SUCCESS** on candidate executable source/test/workflow commit `1c9e7515da52febe2478c3e896b5adf5462f3d2d` / Git tree `f3641fc02f9fafa1250a92a5336b41232350f1a9`, independently confirmed by GitHub commit API. Windows-only P87 original-free tests, direct fake-MK1.EXE Node refusal, ZIP hash/independent-P65-oracle counterfeit refusals, inherited P84/P85/P86 source regressions, Vite production build, TypeScript and headless Chrome startup all passed. Commercial original DOS source files and original-derived indexed source ZIPs were NOT used in this hosted run; PR artifact uploads skipped. The earlier source-only CI [run #43507335138](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43507335138) also passed; the later run adds an explicit fresh-Uint8Array-slice guard to match accepted P65 original DirectorySource behavior.

**Classify:** P87 **SOURCE-ONLY VERIFIED**; P87 new original MK1 scan/extract/verify CLI **VALIDATION PENDING**. Do not infer original run PASS from source-only CI. No library/codec, original-file fingerprints or output family counts changed after the accepted P86 checkpoint; this pass only exposes and independently rechecks the existing P65 package through headless CLI.

## Original Windows acceptance — pending

Use the source directory F:\Dev\MKEXT\SOURCE\mkdosext and private fixture installation F:\Dev\MKEXT\FIXTURES\mk1\mk1 (correct the source path if necessary, do not move or overwrite fixtures). Install existing npm dependencies via the current project procedure. Use a new private folder under F:\Dev\MKEXT\FIXTURES\VALIDATION, never inside SOURCE.

    git fetch origin
    git switch interim/p87-mk1-indexed-anitab-cli
    git pull --ff-only origin interim/p87-mk1-indexed-anitab-cli
    git rev-parse HEAD
    git rev-parse 'HEAD^{tree}'
    python scripts/test-p87-mk1-cli.py
    python scripts/mkext.py scan --game mk1 --source "F:\Dev\MKEXT\FIXTURES\mk1\mk1"
    python scripts/mkext.py extract --game mk1 --source "F:\Dev\MKEXT\FIXTURES\mk1\mk1" --out "F:\Dev\MKEXT\FIXTURES\VALIDATION\NEW_PRIVATE_FOLDER\mk1-indexed-source.zip"
    python scripts/mkext.py verify --game mk1 --source "F:\Dev\MKEXT\FIXTURES\mk1\mk1" --archive "F:\Dev\MKEXT\FIXTURES\VALIDATION\NEW_PRIVATE_FOLDER\mk1-indexed-source.zip"

Create a NEW private output folder and preserve source identity, full scan/extract/verify JSON. **Do not upload or commit commercial source files or indexed ZIP.** Original runtime acceptance requires three new P87 CLI PASS results on the same tested Git tree, the independent P65 original EXE/O60 readback on extract and verify, and byte-identical private ZIP SHA. Source-only Windows CI is necessary but never sufficient.

## Research and development boundaries

Preserve the existing research workbench. Do not change original P65/O60 producer, the original verifier, original MK2/MK3 CLI decoders, or native palette/animation claims. Continue in interim source-only commits; perform full source checkpoint only at the scheduled fifth pass. If new original fixture tests fail, preserve the private report and diagnose before patching.
