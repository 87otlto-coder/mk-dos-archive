# P90 - MK2 stage reconstruction research, 2026-11-15

**Full Tomb and Portal reconstruction: INCOMPLETE.** New original-executable
evidence connects setup-local source layers to the stage initializer, packed
origins, render-object lists and horizontal channels. A reusable parser and a
separately written original-instruction interpreter agree across nine
stage/mode cases. These are static execution semantics, not observed fights.

## Baseline and source identity

Research branch: `research/p90-mk2-stage-reconstruction`, forked from P89
`46332e89c3ce0ea4f13d38f05ec1274383324863`. P89 PR #30 remains draft;
neither main nor develop was changed. The canonical checkout's HEAD file
reported `b713705f70403138d10ea7d319db23da5871ed02`; Git could not open that
checkout in this sandbox. Its full working-tree status/tree is therefore
**UNKNOWN** and it was not edited. The four helper blobs actually used were
checked against the remote base: O120 `0ea6f787a5099f426bd755434df026480a3f7841`,
O130 `3a848c36900ad04ee56010732f09926b95b5e826`, O133
`18a41e4b5ee31983fe91666fb09a7c73c59816c3`, P82 independent verifier
`6982821b2c5a72f1b42fd1e12e861644895fd010`.

Original MK2.EXE SHA256:
`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
All original EXE/GRA inputs remained read-only. Fresh independent P82 replay
passed four original fingerprints, 115 PNGs, 29 streams, eight mosaics and
939,425 indexed positions. Audited private P82 ZIP SHA256:
`d66a8099721391a6606297b50057213a8ad459ffc773fe652ce112583bb777d9`.

Earlier O136-O175 research, omitted from the short P89 R3 packet, already
identifies effect frames, descriptor replacement, task counts, presentation
geometry and IRQ/input timing boundaries. It must not be repeated as new P90
discovery. Tomb/Portal have 36 source-ordered effect frames in five lists;
Tower adds seven. Counts and source loops do not establish runtime timing.

## New initializer and composition findings - VERIFIED static dataflow

At physical EXE `0x81F60`, the loader reads a destination slot pointer from
root+0x1C. Starting at root+0x20, literal `1` writes a sentinel and advances
four bytes. An ordinary entry stores the **entry address** into the destination
slot, then advances eight bytes: setup pointer plus packed signed X/Y origin.
This is different from copying only a setup pointer. `-2` enters a centering
table; a zero pointer terminates it. Typed original LE relocations authenticate
the root/setup/channel pointers.

The updater table at Object-2 `0x15B68` associates each setup slot with a
selection-mask pool, vertical state `0x842E8`, horizontal accumulator and an
object list. `0x81BB6..0x81C0D` follows it. `0x81C53` dereferences the stored
entry; `0x81D92..0x81DAB` adds its origin to source-local controls when setting
object coordinate high words. Sprite draw code at `0x93239` conditionally
subtracts the selected channel high word. Object flags can bypass this path.

### Tomb evidence

Mode 2 root `0x171F0`; other modes root `0x1726C`. Mode 2 bindings:

| Setup (Object-2) | Source size | Packed origin X,Y | Object list | Horizontal state | Initial integer |
|---|---|---|---|---|---:|
| 0x17358 | 896x56 | 0,-52 | 0x84350 | 0x8432C | 289 |
| 0x1736A | 896x48 | 0,158 | 0x8434C | 0x84328 | 289 |
| 0x1737C | 850x224 | 0,-58 | 0x84348 | 0x84324 | 266 |
| 0x173A0 | 800x30 | 0,94 | 0x84344 | 0x84320 | 241 |
| 0x173B2 | 320x80 | 0,46 | 0x8433C | 0x84318 | 1 |

Slot `0x77463` is disabled. Other modes substitute setup `0x1738E` for
`0x1737C` and disable the slot containing `0x173A0`. Thus all six P82 Tomb
mosaics must not be blindly composited together. Header words are
`[0,182,-1,288,24,548]`; the final pair feeds the camera-bound globals,
not independently measured endpoints.

### Portal evidence

Mode 2 root `0x16378`; other modes root `0x163D0`.

| Setup (Object-2) | Source size | Packed origin X,Y | Object list | Horizontal state | Initial integer |
|---|---|---|---|---|---:|
| 0x16514 | 896x176 | 1,-8 | 0x8434C | 0x84328 | 289 |
| 0x16526 | 320x168 | 1,-6 | 0x8433C | 0x84318 | 1 |

The wide `0x16514` setup is disabled outside mode 2. Header words are
`[0,190,3,368,48,688]`. Center overrides replace selected channel values with
`(signed setup width >> 1) - 159`, shifted left 16; they are not all equal to
the header's initial horizontal value. Tower's two layouts pass the same
parser/interpreter; this is a static holdout, not third-stage reconstruction.

## Camera selection - VERIFIED static, live movement UNKNOWN

The two-object path compares positions against camera high word
Object-2 `0x8432E` plus 40/279; root+0xC/+0xE feed globals `0x75D1A/0x75D1E`.
The source table scan at physical `0x8220D..0x8223D` selects the first unsigned
threshold >= input magnitude. Preserve its literal order: both tables
`0x15F90` and `0x15FDC` place `0xA0000` **before** `0x80000`. Their final entry
is unreachable through this scan. Sorting would change behavior. Above the
last eligible threshold, the zero marker reaches `0x82317`'s divide-by-zero
path. Zero magnitude bypasses the scan using the preloaded default routine.
These are source-path properties, not observed camera behavior or FPS.

## Conditional projection experiment

`projection_audit.py` projects accepted P82 setup index/opacity planes under
explicit initializer-input assumptions, then compares every destination index
and mask byte with a separate destination-first inverse mapping. Packed floors
are separately sampled using original 896-byte source stride, signed 16.16
row correction and unsigned 200-row clipping; a second destination-first
formula checks every sampled source index. A second
test adds 32 to every selected horizontal state. This is a **synthetic
transform test**, not a second captured camera position. Floor indices remain
source-local: the original DWORD palette-relocation add is not applied without
its runtime handle. There is no effect-object synthesis or completed composite.
Initializer-input floor contributions start at Y159 for 41 rows (Tomb), Y161
for 39 rows (Portal); the row-step input is -585. Synthetic +32 gives -19309.

| Stage / vector | Layers | Setup coverage | Uncovered pixels | Additional overdraw events |
|---|---:|---:|---:|---:|
| Tomb / initializer inputs | 6 | 58,323 | 5,677 | 6,849 |
| Tomb / synthetic +32 | 6 | 56,157 | 7,843 | 6,519 |
| Portal / initializer inputs | 3 | 48,715 | 15,285 | 5,954 |
| Portal / synthetic +32 | 3 | 45,566 | 18,434 | 5,531 |

Eighteen projected contribution planes: 1,152,000 index positions plus 1,152,000 mask
positions compared; zero algorithmic discrepancies. These counts are **not
original-framebuffer agreement**. Uncovered pixels do not quantify mismatch
against a game capture; original unexplained-pixel counts remain **UNKNOWN**.

## Reusable architecture and portable evidence

Keep original resource decoding (accepted P82) separate from root initialization
(P90), object activation/list population, dynamic state, rasterization and
presentation. Preserve source indices, opacity, palette-record references,
source command order and mode-qualified setup bindings. P90 metadata references
the existing private P82 ZIP by hash and member identities; it does not embed
commercial pixels. Effects require the existing O136/O137 descriptor/list
sidecars and later captured object state, not guessed loops.

Code: `scripts/research/p90/`. Metadata: `docs/validation/P90_*_20261115.json`.
The runner can write separate index/opacity projection diagnostics to a new
private FIXTURES directory. This session was denied creation of a fresh
`F:\Dev\MKEXT\FIXTURES\VALIDATION\P90-20261115-ROOT-LAYOUT-7c820f61`
directory. Derived graphics were consequently evaluated in memory only.
No new private stage-image package or original runtime capture was saved.

## Acceptance matrix

**Executed validation:** 11 local test methods passed, including 18 hostile
report-mutation subcases; 729 original initializer and 47 original camera
independent checks passed. Second execution reproduced metadata/projection
results exactly. Windows-only source CI
[#43718944754](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43718944754)
passed seven original-free controls and PowerShell syntax on source commit
`17a616dfe784cb4fc04e1c877935aa590689f915`, tree
`f6ad3689707143cffdf82a0ce0b80fdf497b5ea4`; zero workflow artifacts.
Hosted CI did not contain originals or execute original-source/runtime tests.

| Gate | Result | Evidence / exact remaining requirement |
|---|---|---|
| 1 Source fidelity | PARTIAL / VERIFIED subset | P82 source parity; source-linked P90 setup metadata. Complete element inventory not runtime confirmed. |
| 2 Scene geometry | PARTIAL / VERIFIED static | 729 independent checks; mode-qualified origins/lists/channels. Live activation and full object positions missing. |
| 3 Palette fidelity | INCOMPLETE / UNKNOWN runtime | Fixed EXE records/source previews retained; no current handles/DAC captured. |
| 4 Viewport accuracy | INCOMPLETE / VALIDATION PENDING | Conditional projection parity only; no original framebuffer oracle. |
| 5 Camera/depth | INCOMPLETE / VALIDATION PENDING | 47 independent static camera checks; zero observed camera positions/occlusion examples. |
| 6 Animation | INCOMPLETE / VALIDATION PENDING | Existing source frames/count paths retained; no native execution/timing verification. |
| 7 Generalisation | PARTIAL | Same static parser on Tomb/Portal plus Tower holdout; no general native renderer claim. |
| 8 Reproducibility | PARTIAL | Deterministic source metadata and projection results; private package launcher remains unexecuted. |

## Unresolved register and implementation handoff

1. **P0 runtime snapshot:** capture one paused, unmodified Tomb mode-2 frame
   with loaded LE object bases, mode/stage index, `0x75CF6`, all nine
   accumulators, `0x842E8`, list heads and every object field read by O145/O146.
   Record active buffer `0x7662A`, 64,000 indexed framebuffer bytes and VGA DAC
   in the same paused state. File offsets must not be used as runtime addresses.
2. **P0 renderer:** replay the captured ordered lists with original flag-gated
   coordinates, descriptor transforms, clipping, palette handles and packed
   floor DWORD arithmetic. Do not substitute P82 mosaic order for object-list
   traversal. Account for every differing pixel before broader claims.
3. **P1 camera/depth:** repeat at a distinct reached camera state, then Portal;
   record actual bound behavior and an object crossing a foreground overlap.
   Source +32 tests cannot fulfill this requirement.
4. **P1 animation:** use existing O136-O175 work to capture descriptor changes,
   task/input counts and presentation boundaries. Distinguish source order,
   task counts and displayed duration; do not assign FPS from PIT setup alone.
5. **P2 production integration:** after those gates, promote the mode-qualified
   root metadata parser into the extractor and add the state-backed portable
   scene contract. Keep P83 resource browsing unchanged until native rendering
   has an independent original-framebuffer verifier.

No unavailable test is called passed. No original-game launch, actor occlusion,
native animation, camera endpoint, full scene or paid-credit expenditure is claimed.

## Bounded Windows reproduction

The launcher was parsed locally and in Windows CI. Its complete private run
remains VALIDATION PENDING because this sandbox cannot create the output
directory. Keep the current P89 checkout intact by using a new worktree:

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
git fetch origin research/p90-mk2-stage-reconstruction
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
$p90Source = 'F:\Dev\MKEXT\SOURCE\mkdosext-p90'
if (Test-Path -LiteralPath $p90Source) { throw 'Choose a new SOURCE worktree path' }
git worktree add --detach $p90Source origin/research/p90-mk2-stage-reconstruction
if ($LASTEXITCODE -ne 0) { throw 'Worktree creation failed' }
Set-Location -LiteralPath $p90Source
.\scripts\research\p90\run_p90_windows.ps1 -SourceRoot $p90Source -Archive 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P82-LAYERS-665462781a7544f3909d48c3edf553a1.zip'
```

The runner records Git HEAD/tree, refuses dirty source, validates original
P82 pixels, runs P90 source oracles and creates a fresh `FIXTURES\VALIDATION\P90-*`
directory. It exports **partial contribution diagnostics**, not full stages.
No game launch, download, upload, branch switch or source merge is performed.
