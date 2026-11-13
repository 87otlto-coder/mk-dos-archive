# P87 — headless MK1 original indexed ANITAB source extraction candidate

**Date:** 2026-11-13. **First interim pass after accepted P86 fifth-pass checkpoint.** Branch: interim/p87-mk1-indexed-anitab-cli, from accepted interim merge 20460f2e59ce526ec1d6cd8997a3ef72f7a196bc. Do not promote main/develop, package full source, or release this pass.

**Classification:** P87 source implementation candidate; hosted Windows CI and new original MK1 runtime acceptance are separate gates. The inherited P65 original-fixture indexed-source package was already independently accepted, not automatically a P87 CLI pass.

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
