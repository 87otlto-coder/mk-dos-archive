# Spelunk 002 — MK2 stage initializer selector programs and conditional palette setup activation

**Date:** 2026-11-16  
**Branch:** `research/spelunk-002-mk2-stage-selector-programs` (child of accepted Spelunk 001 checkpoint).  
**Classification:** **VERIFIED STATIC CONDITIONAL**, original executable evidence only; **NO native runtime mode, camera, palette handle, DAC bank, or reconstructed stage image verified**.

## Mission and reason to investigate

Spelunk 001 identified a relocation-backed eight-row renderer channel table, but its command-reference graph did not decode the *instructions that write the eight mutable channel selector globals*. The distinction is material: a setup linked into a root program can be skipped in one mode, selected in another, or assigned to a channel other than channel zero. This is exactly the difference between an extractor preserving a conditional candidate and incorrectly claiming active source/palette ownership.

Prior research consulted rather than repeated: O119 runtime palette-source perturbations, O120/O121 authenticated setup/graphic/palette links, O125 root dispatcher, O129/O130 command-stream grammar, O133 stage-motion source channels and P90 mode-dependent layer verification. All original graphics remain indexed. No DOSBox, live game, patched executable, GUI change or speculative compositing was performed.

**Fixture:** untouched original DOS `MK2.EXE`, 861,133 bytes, SHA-256
`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
The private independent verification read the owner-supplied `mk2.zip` and an
in-memory extracted executable. Neither file is committed to GitHub.

## Original code: why the root does not imply a specific live palette

The scene loader at original physical `0x81F60` reads a pointer from root
field `+0x1C`; the first ten stage root families all point it to writable
Object2 selector base `0x77453`. The loader then processes a compact
root-local program from root `+0x20`, with source-confirmed four-way cases:

| Command | Original code | Effect conditional on executing the scene loader |
|---|---|---|
| Normal setup pointer cell | `0x81F9C`, `MOV [EBX],EAX` | Writes the **address of that two-DWORD setup cell** into the current channel selector, then advances selector and source cursor. It does **not** write the setup address directly. The renderer later performs `MOV ESI,[EAX]` at `0x81C53` to obtain the actual setup. |
| Exact DWORD `1` | `0x81F6F` test, `0x81F7F` store | Writes literal `1` to the current channel and advances one channel. Renderer skips it at `0x81BDB`. |
| Exact DWORD `-1` | `0x81F8A` test, `0x81FA6` return | Ends the scene-root program. No palette handle or explicit channel change is implied by termination. |
| Exact DWORD `-2` | `0x81F93` test; `0x81FA8–0x81FDC` | Switches to zero-terminated **setup/derived-global destination pointer pairs**. Each pair writes a computed DWORD into a separate `0x84310..0x8432C` global. It does not advance the eight palette/setup selectors. |

The initialization path at `0x81B56` sets the sentinel `0x30240` and at
`0x81B60..0x81B83` writes it across all eight mutable selector slots.
The renderer's `0x81BE0` comparison can **exit its whole channel traversal**
when encountering that default value. That is different from literal `1`,
which skips a channel and continues. This distinction resolves an important
ambiguity in static stage-root graphs.

**Crucial provenance correction to Spelunk 001:** its graph's “shared
channel-zero selector” is the program's **base destination pointer**,
not proof that the next setup is assigned to channel zero. The loader's
source cursor may advance beyond explicit `1` skips. A setup at
`root + 0x28` can belong to channel **1** after channel 0 is skipped.
This correction does not invalidate O119 user-runtime recolour evidence or
O120/O121 resource identities; it qualifies the earlier channel assignment
interpretation.

## Conditional Tomb and Portal channel programs

The root identities are original LE-relocated candidates from the three
31-entry O125 dispatcher tables, not an observed selection in gameplay.

| Stage/configuration | Root (Object2) | Selected channel → setup (Object2) | Explicit skips | Unwritten/default |
|---|---|---|---|---|
| Tomb, mode=2 | `0x171F0` | `0→0x17358`, `1→0x1736A`, `2→0x1737C`, `3→0x173A0`, `5→0x173B2` | 4 | 6,7 |
| Tomb, mode=1 or other | `0x1726C` | `0→0x17358`, `1→0x1736A`, `2→0x1738E`, `5→0x173B2` | 3,4 | 6,7 |
| Portal, mode=2 | `0x16378` | `1→0x16514`, `5→0x16526` | 0,2,3,4 | 6,7 |
| Portal, mode=1 or other | `0x163D0` | `5→0x16526` | 0,1,2,3,4 | 6,7 |

The independent source check confirmed each program cell against the
original LE type-7 relocation target and each first setup word against
original backing bytes. A skipped setup must not be exported as active
palette ownership. For example, Portal mode=2's `0x16514` setup is assigned
to channel **1**, not channel 0; the other modes do **not** select this setup
in their root programs. Tomb substitutes `0x1738E` for mode=2's
`0x1737C` on channel 2, and skips a mode=2 channel-3 setup when mode≠2.
This is a **source-backed variant availability and dispatch distinction**,
not proof either specific program ran during an actual fight.

O121's sprite/resource provenance remains useful: these conditional setup
records ultimately reference source palettes associated with
`TOMB.GRA` or `PORTAL.GRA`. The two historically mislabeled 79-word
families remain associated with `IMAGES.GRA`; their first setup is also
after a leading channel-zero skip. No live DAC ownership is inferred.

## Extended independent corpus: ten stage indices × three mode tables

The same bounded loader-program grammar was independently decoded for the
first ten configuration indices of all three source-relocated root tables.
It yields **30 conditional scenarios backed by 20 distinct root programs**.

| Source mode table | Setup assignments | Explicit channel skips | Derived global writes |
|---|---:|---:|---:|
| `mode_equals_2` | 44 | 21 | 39 |
| `mode_equals_1` | 30 | 35 | 25 |
| `mode_other` | 30 | 35 | 25 |
| **Total conditional assignments** | **104** | **91** | **89** |

These totals represent **candidate program operations if that root is
initialized**; they are not runtime object counts, frames, DAC transfers,
or observed calls. The 30-case source-safe table is in
`docs/validation/SPELUNK_002_MK2_STAGE_SELECTOR_CENSUS_20261116.json`.

The ninth and later configuration indices are **not** promoted to a
universal grammar by this work: this pass covers indices 0–9 only.
The stage index 9 example terminates at `-1` without a derived-global
section; most other audited programs use the separate `-2` section.
Do not confuse the renderer's eight channel rows with the stage dispatcher's
31 entries or the nine distinct motion input/accumulator channels from O133.

### Derived-global calculation is exact arithmetic, not a movement claim

The original instructions `0x81FC5..0x81FD9` read the first signed setup
word (`MOVSX`), apply **logical** `SHR 1`, subtract 159 and shift left 16,
then write a DWORD to the relocated destination global. On the audited
positive setup widths, this is equivalent to
`((setupWidth >> 1) - 159) << 16` in 32-bit integer arithmetic.

Examples (source-data arithmetic only):
- Setup first word **896** → high-half result **289**.
- **850** → **266**.
- **800** → **241**.
- **320** → **1**.

The destination offsets include `0x8432C`, `0x84328`,
`0x84324`, `0x84320`, and `0x84318` in Tomb's mode=2
program. O133 independently established related accumulator/update globals,
but **actual transform, selected camera state, motion rate, frame timing and
visible composition remain UNKNOWN**. A 32-bit source arithmetic value
does not license a pixel position.

## Verification, repeatability, limits

The investigation used a separately authored, read-only private original
binary walker that parsed the complete **27,004 typed LE fixup records /
26,994 unique source sites**, decoded the 30 source cases, and authenticated
15 original physical code anchors including the selector-store, explicit-skip
and `-2` paths. The independently recovered totals were
44/21/39, 30/35/25 and 30/35/25. The original executable SHA-256 was
verified before decoding.

Committed reproducible producer:
`scripts/research/spelunk002/trace_stage_selector_programs.py`.
Committed private-fixture regression/negative suite:
`scripts/research/spelunk002/test_stage_selector_programs.py`.
Its original-input suite has **not yet been run on the exact committed
source here**; do not report its assertions as passed. The separate source
walker above independently establishes the stated original-file findings.

**Windows original-free integration:** [CI run #43937189003](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43937189003)
**SUCCESS**, executing eight synthetic selector grammar, sentinel, scaled
arithmetic and corruption-refusal tests. That does not validate any original
commercial file in GitHub Actions. Zero artifacts uploaded.

The producer refuses pre-existing reports. Its input is the user's own
untouched original `MK2.EXE` or `mk2.zip`; original files are read-only,
and the output JSON contains source offsets and provenance, never EXE
bytes, full sprite/palette records or copyrighted image/sound data.

## Consequences for the eventual extractor

**Immediately useful:** an exporter can present **mode-conditional setup
availability**, with explicit skip/default statuses and original setup
references. Preserve individual indexed graphics and record owner/provenance
separately. A static palette resolver must never convert an unselected setup
into a claimed active palette.

**Future P91 native capture readback (not implemented in this spelunk):**
compare Object2 `0x77453..0x7746F` selector values and
`0x84310..0x8432C` derived globals at the frame's draw-entry and
presentation boundaries. Bind each observed pointer through its actual
relocated base to the specific original command cell and setup record,
then independently check any palette handle and DAC allocation. Static
control programs cannot substitute for that evidence.

**Confidence**: VERIFIED STATIC CONDITIONAL for the source program grammar,
table-backed mode variants, pointer relationships and arithmetic;
CARRIED VERIFIED for O119/O120/O121/O125/O130/O133 source/limited runtime
evidence as explicitly noted; UNKNOWN for live mode, active setup,
palette handle, DAC state, camera/compositor, and timing.
No native MK2 game was executed. Existing P90/P91 checkpoints and browser
extractor were not modified.
