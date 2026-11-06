# MK DOS Extractor — P19 source-order to presentation-queue bridge

**Date:** 2026-11-06  
**Parent:** P18 `develop` at `0169211e1e29949ee297cd116d7663187c7a8b53`  
**Classification:** Third MK2-first interim pass after the stable P16 source checkpoint (`main`). P19 changes usability/validation, **not the original asset census**.

## Extractor improvement

The eight P18 original-source-order contact sheets can now load their **57 already verified** original MK2 frames directly into the existing Asset Library preview/animation queue. This avoids manually selecting and ordering six to eight individual frames for each source group and makes the previously verified source-list relationships accessible to non-research users.

**Workflow:** browse the MK2 Asset Library, select a P18 source-order contact sheet, click **Load verified source order into animation queue** in Inspect, and use the existing **Preview chain**, user-selected **Frame duration (ms)**, **Export animated PNG**, sprite sheet or selection ZIP. The separate original frame ZIP from P18 remains available from **Export source-ordered frames ZIP**.

Only **source list order** is authentic. The existing browser presentation preview/APNG intentionally repeats on the user-chosen clock; **even O136 `ZERO_TERMINATED` source lists loop as a user preview convenience**. The inspector/queue notice explicitly states this is *not* original DOS runtime looping or FPS. Source control markers (`ONE_MARKER_BACK_REFERENCE` versus `ZERO_TERMINATED`) remain preserved and visible. Original source frame PNGs, indices, paint masks and original source metadata are unchanged.

## Changes and confidence limits

- New `src/core/assets/mk2SourceOrderQueueP19.ts`: pure source-order resolver. Accepts only P18 contact-sheet assets with an exact, unique ordered source frame-ID list, matching original executable source-list pointer and end/loop control, original GRA resource hashes, original source frame ordinal, consistent dimensions, intact original `indices`/`mask`, and explicit **unknown native timing and palette**. Missing, duplicate, reordered, forged or corrupt data is rejected; it does not silently replace a list with a plausible animation.
- Small `src/components/AssetBrowser.tsx` extension: a source-list-specific queue loader plus an explicit presentation-only notice. Uses existing generic APNG implementation and existing user-controlled duration; no new timing engine, inferred animation scheduling, new stage compositor or asset count.
- New `scripts/verify-mk2-p19-source-order-queue.cjs`: original DOS fixture reference integration using unmodified O136/O177 and O220/O221 decoders plus P18 assembler, user-timed APNG export, indexed ZIP sidecars and negative cases. Does not bundle original game files or generated artwork in GitHub.

**VERIFIED:** 8 source lists (six O136/O177 stage effect sequences and two O220/O221 Pit II bridge lists), 57 original frames and source provenance, original index/mask and order preservation in the loaded queue, diagnostic APNG/ZIP generator parity. **UNKNOWN:** native animation FPS/millisecond durations, original source-zero-list repetition, runtime activation and frame triggers, actual stage/world positions and final draw order, live palette-bank ownership. **VALIDATION PENDING:** interactive Windows browser clicking on the new P19 inspector action; full latest P16+P17+P18 (+P19 unchanged assets) 5,118-asset scan.

## Original-fixture verification and regression

- P19 focused original-source adapter, queue, selected ZIP and APNG: **280 checks PASS** on authentic original MK2, across eight source tracks, 57 original-order frames and 63,112 source-frame pixels reused. Tested APNG presentation interval 137 ms, each `fcTL` delay numerator/denominator, all eight APNG animation controls, explicit infinite presentation loop (including zero-terminated lists), PNG signatures and `IEND` completion. Eight categories of invalid/corrupt source data rejected. No inference of native duration from the chosen value.
- Existing independent P18 fixture regression rerun without source change: **379,422 checks PASS**, including 63,112 source pixel parity comparisons, diagnostic contact-sheet PNG readback, 8 original-order frame evidence ZIPs and malformed source cases.
- Historical frozen P11+P17+P18 compatibility scan rerun against canonical original DOS fixture: **5,063 unique assets / 32 checks PASS**, P8–P10 ZIP hashes preserved. P19 changes neither asset registration nor scanner output.
- **IMPORTANT:** Full current P16+P17+P18 total remains **5,118 EXPECTED, VALIDATION PENDING**. The available local compatibility source omits the P12–P15 registered adapters, so it is not evidence of 5,118. Source-offline GitHub CI and a clean build are also separate from interactive fixture browser checks.

Reproduction:

```sh
node scripts/verify-mk2-p19-source-order-queue.cjs /path/to/original/MK2 /tmp/p19.json
node scripts/verify-mk2-p18-ordered-sequences.cjs /path/to/original/MK2 /tmp/p18.json
# Full current-source gate, only with actual P16+P17+P18 tree:
node scripts/verify-mk2-p18-cumulative.cjs /path/to/original/MK2 /tmp/p18-full.json
```

## Next pass

P20 remains MK2-first. First close the **full actual develop-source** original-fixture acceptance gap where feasible; then prioritize original-file-backed stage/animation/audio extraction completeness over cosmetic UI. P21 is the next fifth-pass consolidation candidate. Preserve the P16 checkpoint on `main`, the research workbench and all exact indexed source data; never commit commercial game files, extracted game media or DOSBox captures.


## GitHub source CI result — verified

[P19 source build 42277356338](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42277356338) **PASS** at code commit [`4844a84`](https://github.com/87otlto-coder/mk-dos-archive/commit/4844a8477e68b490e42504f57d6036c7ff4490d0). Strict locked npm install, syntax, tracked-media guard, Vite production build, full TypeScript and headless Chrome source-offline onboarding plus artifact upload all passed. This verifies source/build integration, not user-driven original-MK2 preview controls. P19 original-file focused and compatibility test evidence remains separate; **5,118 actual full-source cumulative remains validation pending**.
