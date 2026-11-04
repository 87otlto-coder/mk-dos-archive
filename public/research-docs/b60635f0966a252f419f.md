# MK DOS Archive — O95A MK2 Completion Audit / Closure Blocker Census

**Date:** 2026-10-07 SAST  
**Status:** VERIFIED STATUS AUDIT / MK2 REMAINS OPEN  
**Scope:** enumerate every currently known MK2 extractor-scope closure blocker before further semantic reconstruction

O95A does not promote new game semantics. It fresh-runs the established O67/O68/O69/O71/O72/O73 chain against the authentic MK2 fixture, audits the current source/evidence surface, and turns the user-directed MK2 closure gate into a machine-readable blocker matrix. It deliberately distinguishes fresh fixture observations from accepted earlier evidence.

## Authentic fixture

Fresh O95A fixture:

- files: **614**
- bytes: **19,921,006**
- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- 124 `.GRA`
- 312 `.U8`
- 33 each `.MID`, `.AWE`, `.GVS`, `.LAP`, `.SBL`

O93's 613-file authentic installation envelope remains valid when and only when the optional 6,720-byte `ULTRAMID.INI` is absent. O95A used the 614-file fixture supplied for the current continuation.

## Fresh reruns

O95A fresh-runs the established topology / graphics / palette-root chain:

- O67 fixture/resource/executable topology: PASS
- O68 indexed graphics foundation: PASS
- O69 broad indexed GRA corpus census: PASS
- O71 palette storage/selection reconnaissance: PASS
- O72 bound LE/fixup/palette pointer provenance: PASS
- O73 17-slot identity/resource-family skeleton: PASS

The new audit runner is:

- `scripts/run-mk2-completion-audit.mjs`

Machine-readable report:

- `mk2_completion_audit_o95a_2026-10-07.json`

Independent fixture/status verifier:

- `scripts/verify-mk2-o95a-completion-audit.py`
- result on the authentic fixture: **PASS / 1,191 checks / 0 failures**

The independent verifier does not re-implement every prior semantic pass. It independently checks the fixture identity/counts, extension surface, GRA partition arithmetic/lists, palette qualified/unresolved slot sets, and the five hardware music-set container/header/track-count surfaces.

## Graphics closure state

Fresh O69 results remain:

- installed root GRA resources: **124**
- exact-full whole-resource tilings: **94**
- exact qualified streams: **3,790**
- partial/ambiguous resources: **15**
- zero-candidate pooled resources: **14**
- installed out-of-pool resources: **1** (`MONKS.GRA`)

Therefore **30 resources remain outside exact-full whole-resource classification**. This is a classification/audit surface, not a claim that all 30 necessarily contain extractor-visible unresolved images.

Partial/ambiguous:

`PLAYSTA.GRA`, `FONTS.GRA`, `LOGO.GRA`, `PLAYSEL.GRA`, `PORTAL.GRA`, `ARMORY.GRA`, `FOREST.GRA`, `TOMB.GRA`, `TOWER.GRA`, `ARENA.GRA`, `PIT.GRA`, `STONE.GRA`, `MOUNTAIN.GRA`, `TITLE.GRA`, `VFRAME.GRA`.

Zero-candidate pooled:

`STORY.GRA`, `IMAGES.GRA`, `DEDPOOL.GRA`, `CAVE.GRA`, `BATTLE.GRA`, `KONTIN.GRA`, `BIO.GRA`, `PROBE.GRA`, `ACCLAIM.GRA`, `T1HDRS.GRA`, `T2HDRS.GRA`, `ENDH.GRA`, `ENDV.GRA`, `COPY.GRA`.

Out-of-pool:

`MONKS.GRA`.

Filename appearance is not treated as semantic proof. Several names are stage-like or UI-like, but O95A only records their authentic internal filenames and current decode status.

## Palette closure state

O73 establishes the 17-slot identity/resource-family skeleton. Accepted bounded correct-colour contracts currently exist for **9/17 slots**:

- 0 — HH family / `HH0.GRA` evidence — O76
- 1 — LK family / `LK0.GRA` — O77
- 2 — JC family / `JC0.GRA` — O74
- 3 — BA family / `BA0.GRA` — O79
- 4 — FN family / `FN4.GRA` — O81
- 5 — FN family / `FN6.GRA` — O83
- 8 — NJ family / `NJ7.GRA` — O87
- 9 — NJ family / `NJ4.GRA` — O89
- 16 — FN family / `FN4.GRA` aliased identity contract — O85

Still unresolved for bounded correct-colour ownership:

- **slot 6 — ST**
- **slot 7 — RD**
- **slot 10 — NJ**
- **slot 11 — JX**
- **slot 12 — GO**
- **slot 13 — SK**
- **slot 14 — NJ**
- **slot 15 — NJ**

This is **9 qualified / 8 unresolved**. Shared-family identity is not permission to inherit a sibling palette.

## Animation closure state

MK2 animation reconstruction is a major open blocker.

Established groundwork:

- object field `+0x46` indexes a relocatable **17-slot per-identity resource/animation table** at Object-2 `0x1D588`;
- all 17 slots have authenticated resource-family roots and bounded descriptor witnesses from O73;
- the roots are relocation-backed and densely reference further Object-2 structures and known GRA descriptors.

Not yet established:

- animation table entry geometry;
- control grammar / terminators / loops;
- frame order;
- multipart composition;
- aliases/reuse semantics;
- dwell/timing semantics;
- dynamic/non-immediate branches;
- complete palette joins for animation contexts;
- machine-readable MK2 animation IR.

Current source contains **zero MK2 research modules whose filenames identify animation reconstruction**, consistent with this gap. O95A therefore keeps animation closure **OPEN**.

## Stage/background closure state

MK2 stage reconstruction is a second major open blocker.

Current source contains **zero MK2 stage/background reconstruction modules**. No qualified MK2 equivalent yet exists for the MK1 stage chain of identity -> resources -> placement -> palette -> renderer order -> camera/projection -> dynamic processes.

The partial/zero-candidate GRA surface includes multiple internally named resources that may become relevant to this work, but O95A does not infer stage semantics from filenames.

Stage/background closure remains **OPEN**.

## Digital audio closure state

O94D remains accepted:

- 312/312 `.U8` accounted for;
- authenticated signed mono 8-bit source PCM path;
- 11025/22050-Hz source-rate term established for the direct path;
- bounded source-domain WAV export authorized over the authenticated mixer-readable interval;
- unread trailing bytes preserved as semantically UNKNOWN;
- no bit-exact final mixed/hardware-output claim.

No new audio-format blocker was discovered by O95A. Final MK2 closeout still needs to include this domain in the complete coverage matrix.

## Music closure state

The fixture contains five parallel 33-file Sound Images sequence sets:

- `.MID`: 33 files, **212 tracks**
- `.AWE`: 33 files, **218 tracks**
- `.GVS`: 33 files, **217 tracks**
- `.LAP`: 33 files, **216 tracks**
- `.SBL`: 33 files, **233 tracks**

Fresh O95A structural decoding with the current Sound Images parser succeeds for **165/165 files** with zero parser failures.

However, the existing independent original-code emulation proof covers the `.MID` set only: **33 songs / 212 tracks** against original `GMI.BIN` behavior. The other four sets differ in bytes and aggregate track counts, so they are not assumed to be interchangeable copies. Their independent driver-specific qualification remains pending.

## Remaining support/unknown surface

Still present and requiring final classification as extractor-relevant, support-only, configuration-only, or unresolved:

- `AWE.BIN`
- `GMI.BIN`
- `GRV.BIN`
- `LAP.BIN`
- `SBL.BIN`
- `SCC.BIN`
- `RM.DRV`
- `ULTRAMID.EXE`
- optional `ULTRAMID.INI`
- `CMOS`
- `MK2GUS.BAT`
- `README.TXT`

Known facts such as `GMI.BIN == SCC.BIN` remain preserved, but O95A does not infer the remaining hardware-driver roles beyond what prior machine evidence established.

## Closure decision

**MK2 is not research-closed for extractor scope.**

Explicit blockers after O95A:

1. MK2 animation reconstruction;
2. MK2 stage/background reconstruction including dynamic behavior;
3. eight unresolved palette selector slots;
4. classification/closure of the 30 non-exact-full GRA resources as extractor-relevant or non-gating;
5. independent qualification of the four non-`.MID` Sound Images hardware sequence sets;
6. remaining support/unknown-resource classification;
7. final integrated authentic-fixture coverage audit.

## Next pass

**O95B — MK2 17-slot animation-root structural graph.**

Use the authenticated O73 identity table and LE relocation graph. The pass should answer only structural questions first:

- what pointer/table shapes repeat across the 17 roots;
- which roots/branches are shared;
- which relocation-backed branches reach already authenticated GRA descriptors;
- where cycles/aliases occur;
- which branches remain non-descriptor/unknown.

Do **not** assign move names, frame timing, gameplay semantics, or human character names from visual appearance/resource prefixes. Do not yet parse bytes as animation commands unless machine-code consumers establish their grammar.
