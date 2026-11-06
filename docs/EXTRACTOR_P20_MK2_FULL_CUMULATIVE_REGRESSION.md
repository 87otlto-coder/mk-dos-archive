# P20 — full current-source original MK2 cumulative regression

Date: 2026-11-06. Fourth interim pass after P16; P21 consolidation is not started.

## Verified outcome

The complete P16–P19 extractor source at `17af1a5151999b77b31945b82e5b7fdee58a9e36` freshly produces **5,118 asset representations with 5,118 unique IDs** from the existing original DOS MK2 fixture. This closes the cumulative scan gap recorded in P17–P19. It does not establish extraction completeness or 5,118 distinct original files.

- Existing P18 cumulative gate, default full-source mode: **40 checks PASS / 5,118 assets**. No compatibility/baseline flag was used.
- New `scripts/verify-mk2-p20-cumulative.cjs`: **536 checks PASS / 5,118 assets**. Retains the P15 cumulative assertions and adds P17 mosaics, P18 source groups and P19 queue resolution against the actual full collection. Verifies 57 queued source frames, original order/control and byte-for-byte exported index/opacity planes.
- Fresh focused suites: P12 **524**, P13 **358**, P14 **409,790**, P15 **28,244**, P17 **77**, P18 **379,422**, P19 **280** checks PASS (**818,695** total). These include existing missing/corrupt/synthetic/ordering/timing negative controls. They are adapter/export tests, not native game playback tests.
- P8/P9/P10 evidence ZIPs retain their historical SHA-256 identities. P13 Mountain, P14 native viewport and P15 witnessed-floor evidence ZIP hashes also remain unchanged under the P20 gate.
- Local syntax: **365 TypeScript source files / zero syntax errors**. TypeScript `--noEmit`, production Vite build and new verifier `node --check` PASS using installed dependencies. Vite retains a large-chunk warning. A fresh strict dependency install was not run locally.

## Source and input evidence

Command-line Git fetch failed because GitHub DNS was unavailable. The connected GitHub integration supplied the authoritative recursive tree and all 43 changed/added files since local clean P11 commit `350b44a`. The remote has 2,082 blobs; local P11 has 2,045 tracked files; 37 additions, six modifications, no removals. All unchanged Git blob IDs match; all 43 retrieved file contents match their remote Git blob SHA-1 after checkout newline normalization. No extractor implementation or research workbench files were changed by P20.

The regression used the existing extracted original installation at local `pass-local/mk2`. P16 identity audit **642 checks PASS**, both before and after regression: **614 files**, expected extension census, no case-insensitive duplicate basenames, **13/13 critical resource SHA-256 hashes**, including original `MK2.EXE` `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. Directory mode checks the 13 pinned resources; it does not claim independent hash verification of every other file.

The attached `mk2.zip` was resolved, but a fresh download through the supported transfer helper failed with DNS. Its ZIP hash was **not freshly recomputed in this continuation**; `archiveSha256` is null in the directory identity report. Earlier archive identity evidence remains historical. Do not describe this as a freshly downloaded or newly re-extracted ZIP run.

Only source, metadata and test results are committed. No original binaries, screenshots, extracted artwork, audio or generated asset archives are included.

## Changes and failures

Added a dedicated, reproducible full-current-source P20 gate and this evidence record. The extractor showed no regression requiring a decoder, palette, collection or export repair. During development of the added gate, a test-harness error passed a parsed ZIP-entry object instead of its `.bytes` to `Buffer.from`; corrected to the parser's existing contract and reran the final gate successfully. Earlier scripts and their historical fixed-baseline expectations remain unchanged.

## Reproduce

From the complete committed source, with an untouched extracted original installation:

```powershell
python scripts/verify-mk2-p16-fixture-identity.py <MK2-directory> --report input-identity.json
node scripts/verify-mk2-p20-cumulative.cjs <MK2-directory> cumulative.json
```

Focused scripts, each accepting `<MK2-directory> [report.json]`: `verify-mk2-p12-intro.cjs`, `verify-mk2-p13-mountain.cjs`, `verify-mk2-p14-source-viewport.cjs`, `verify-mk2-p15-observed-floors.cjs`, `verify-mk2-p17-unassigned-images.cjs`, `verify-mk2-p18-ordered-sequences.cjs`, `verify-mk2-p19-source-order-queue.cjs`.

Machine-readable results: `docs/validation/P20_MK2_REGRESSION_2026-11-06.json`.

## Confidence and continuation boundary

**VERIFIED:** full current-source cumulative asset census, uniqueness, qualified family counts, preserved historical archive parity, focused indexed/export parity, all eight P19 queues on the full collection, local source build/type checks.

**VALIDATION PENDING:** fresh archive-level SHA-256/re-extraction in this continuation, real-game browser clicking of P12–P19 actions, and any source-only CI result not explicitly recorded separately. Headless fixture parity does not substitute for browser interaction or original DOS playback.

**UNKNOWN:** native animation milliseconds, live DAC-bank ownership, runtime actor/world positioning and full stage composition. No new timing/palette/placement claim was introduced. MK1/MK3 coverage is unchanged and was not freshly fixture-regressed here.

P20 stays on `develop`; P16 remains on `main`. No source release archive, promotion or P21 consolidation. Any later P21 decision must use the completed P20 evidence and separately assess remaining gates.
