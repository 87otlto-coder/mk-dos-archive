# MK DOS Archive — Handoff — Pass 1E.3O.26 Animation Stream Control + MFRAMEW Dwell Census

**Date:** 2026-09-29 SAST  
**Status:** **VERIFIED ON AUTHENTIC MK1 INSTALL / READ-ONLY**

## Purpose

O26 converts previously local animation-executor knowledge into a broad export-side control/timing census without overclaiming canonical real-time frame durations. It independently re-verifies the canonical command dispatcher and `MFRAMEW`, applies that grammar to the O17 stream graph, and inventories direct code consumers that tail-transfer into `MFRAMEW` with caller-supplied dwell arguments.

## Canonical fixture

`MK1.EXE` size: **1,157,222** bytes  
SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Prerequisite: O17 structural ANITAB comparison, verified.

## Executor re-verification

The canonical `DO_NEXT_A9_FRAME` dispatcher is rechecked from executable bytes:

- `0`: END / stream terminator;
- `1`: stream jump / A9 redirect;
- `2`: `FLIP_MULTI`;
- `3`: signed X adjustment through `MULTI_ADJUST_XY`;
- `4`: signed X/Y adjustment through `MULTI_ADJUST_XY`;
- `5`: immediate frame assignment with carry set, causing `MFRAMEW` to reparse without sleeping;
- `6`: embedded callback;
- values greater than 6: ordinary frame target assignment with carry clear.

`MFRAMEW` is reverified to:

1. save the caller's EAX dwell argument;
2. call `DO_NEXT_A9_FRAME`;
3. stop on the zero/END condition;
4. reparse immediately on carry (opcode 5);
5. otherwise restore caller EAX and call `PRCSLP` before continuing.

This establishes caller-supplied dwell behavior, not the wall-clock meaning of the argument.

## O17 stream census

Across **514 unique streams**:

- END-terminated: **453**;
- looping: **61**;
- frame events: **1,824**;
  - ordinary/sleeping frame events: **1,818**;
  - opcode-5 no-sleep frame events: **6**;
- stream jumps: **83**;
- `FLIP_MULTI`: **14**;
- X adjustments: **27**;
- X/Y adjustments: **175**;
- callbacks: **34**.

Callback targets are preserved as code addresses / exact symbols where available. Unknown callback labels remain unknown.

## Direct MFRAMEW consumer surface

Canonical Segment-1 code contains **162 direct near tail transfers** (`E9`) into `MFRAMEW`.

- immediate caller-supplied dwell argument recovered: **158**;
- dynamic/unclassified EAX setup: **4**;
- all 162 transfer sites lie inside Watcom-owned code modules.

Immediate dwell distribution:

| Argument | Sites |
|---:|---:|
| 1 | 4 |
| 2 | 13 |
| 3 | 40 |
| 4 | 53 |
| 5 | 14 |
| 6 | 23 |
| 7 | 1 |
| 8 | 8 |
| 20 | 1 |
| 48 | 1 |

For 152 sites, O26 also recognizes the Watcom synthetic-call sequence that stores the fall-through return address before tail-jumping to `MFRAMEW`; every recovered synthetic return target matches the expected fall-through address. Six additional immediate EAX tail transfers use a simpler adjacent form.

## What this means for export

The exporter can safely preserve structural control events instead of flattening an animation into an unexplained sprite list. It can also represent frame dwell as **caller context** where recovered.

However:

- the numerical dwell argument is not yet converted into milliseconds/seconds;
- a dwell value is not yet bound to every ANITAB entry;
- not every O17 stream is proven to be consumed through `MFRAMEW`;
- dynamic timing consumers remain first-class unresolved cases;
- opcode callbacks must retain their own semantic confidence.

## Verdict

`MK1_STREAM_CONTROL_AND_MFRAMEW_DWELL_SURFACE_ESTABLISHED`

All O26 validation checks pass.

Direct report: `/mnt/data/o26_direct.json`.  
Fresh deterministic rerun: `/mnt/data/o26_recheck.json`.  
After removing run-specific timestamps/operation IDs the reports are semantically identical.

## Source changes

Added:

- `src/games/mk1/research/animationStreamControlTimingCensus.ts`
- `scripts/run-animation-stream-control-timing-census.mjs`
- this handoff

O25 remains integrated. `ResearchQuickActions` is extended through stage **35/35**. App milestone:

`Milestone 1 — Pass 1E.3O.26 — MK1 Stream Control + MFRAMEW Dwell Census`

No write path is added.

## Recommended continuation

Pause here per the user's two-major-verification cadence and refresh the authoritative master handoff. The next block should prioritize stage/background resource reconnaissance or entry-level semantic/timing correlation rather than guessing the unresolved O25 palettes. The authentic installation is now available, so scene reconstruction is a high-value next branch.
