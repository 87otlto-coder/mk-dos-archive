# MK DOS Archive — O110F/O110G — palette allocator census and conditional stage-selector join

**2026-10-10 · Original DOS MK2 fixture · independent source-backed checks passed · MK2 REMAINS OPEN**

This checkpoint follows O110E. It corrects a materially incomplete earlier direct-allocator-call list and establishes two tightly bounded static code-order joins between a palette *request* and a packed stage-row source selector. It does **not** promote a final runtime stage/palette binding or a colored stage screenshot.

## O110F — complete Object-1 `E8 rel32` byte census of palette allocator

Original `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. In its canonical Object-1 file-backed interval `0x61C54..0xA0C54` (exclusive), **23** exact five-byte `E8 rel32` encodings have destination physical `0x7B439`, the already-qualified palette allocator. The earlier O71 document lists **15**, a useful bounded selection but **not an exhaustive census of this interval**. The eight additional authenticated byte positions are:

`0x640C7, 0x64600, 0x6466A, 0x707CD, 0x74CEE, 0x771BA, 0x779F4, 0x77D7C`.

The 23 byte-confirmed call encodings divide as follows:

- **14 immediate predecessor `MOV EAX, imm32` load+call sequences**, with an independently parsed **type-7 Object-1 LE relocation** at every immediate operand. The direct record targets are **13** loads of Object-1 offset `0x26CC4` (physical `0x88918`) and **1** load of Object-1 offset `0x2AB28` (physical `0x8C77C`).
- **9 non-immediately-loaded/dynamic calls**, including the two new dynamic cases `0x640C7` and `0x64600`. No concrete palette pointer is inferred at these sites from the preceding five bytes.

The two **authentic counted palette records** satisfy the earlier O71 palette grammar `[u16 count][count × u16 words]`:

| Object-1 offset | Physical | Count | Record bytes | Direct relocated requests |
|---|---|---:|---:|---:|
| `0x26CC4` | `0x88918` | 48 | 98 | 13 |
| `0x2AB28` | `0x8C77C` | 64 | 130 | 1 |

All source color words are valid in the previously established 15-bit input domain, and exact source-record SHA-256 plus native DAC6 first-three-color samples are retained in the evidence. The 27,004 LE fixup entries were parsed independently by the producer and verifier. **Palette request count is not a runtime scene palette, handle identity, or allocation count.** The allocator may reuse a record and computes handle/bank placement from mutable state.

All seven O110C original packed row tails were rechecked. Their raw source values reach 64 or higher for six resources (**strictly greater than 64 for five**), and exceed 48 in all seven. This rejects a *naive direct raw-index-as-ordinal* application of the two recovered small records to whole tails, **not** other possible banked, shifted or composited uses: `0x659C6` changes whole DWORDs using a runtime bank-base operand. Stage palette binding remains unknown.

## O110G — two palette-request / stage-index local code sequences

The two authentic straight-line source sequences both load the 48-word palette at Object-1 `0x26CC4` and call `0x7B439` before setting the input global `0x75A80` and calling established index-writer `0x82321`:

| Source path | Palette request | Literal assigned to `0x75A80` | Index-writer call | Original table entry | Qualification |
|---|---|---:|---|---|---|
| `0x77D77` | `0x77D7C` | **5** at `0x77D81` | `0x77D8B` | `0x1A01ED80` → File ID 26, `ARMORY.GRA+126336` | locally adjacent after allocator returns |
| `0x779EF` | `0x779F4` | **6** at `0x779FE` | `0x77A08` | **0** | intervening `CALL 0x63F99` at `0x779F9` |

The writer at `0x82321` copies input `0x75A80` into global **`0x7747F`**; the renderer at `0x9E165` loads that global and uses relocated Object-2 table `0x2EF54` (physical `0xCFBA8`). Thus, **conditional on the index-5 value surviving into an actual guarded `0x9E118` invocation**, a real packed ARMORY source is selected, not an arbitrary visual guess. The index-6 entry is zero; this alone cannot prove there is no drawable output, since the renderer also uses other caller inputs and resource handles.

Most importantly: the renderer calls its image routine with palette **handle index 1** (`0x9E18B`), while the image routine reads the start base **dynamically** from `[0x75B06+8*handle]` at `0x659EA`. The allocator writes this byte at `0x7B4B1`. Neither local sequence proves that the requested 48-color record is handle 1 when rendering, or that the source-index table retains 5/6 until the image routine executes. Both statements remain `UNPROVEN`.

## Verification actually executed

All operations ran against the untouched original MK2 fixture. In this continuation:

- O110F producer: **PASS**, exact 23-site corpus, 14 LE-typed static record requests, seven authentic suffixes.
- O110F separate Python verifier: **54,399 checks, zero failures**. Five falsified evidence variants **all rejected**; unmodified report reverified.
- O110G producer: **PASS**, two concrete source-order joins, exact slots 5/6.
- O110G separate Python verifier: **47 checks, zero failures**. Five falsifications **all rejected**; unmodified report reverified.
- O96A prior independent source-row consumer verifier: **27,170 checks, zero failures**.
- O110C regenerated all **28** original stage-strip parameterized projections and its separate verifier passed **277,954 checks**; independent PNG verifier passed **276,592 checks**; all zero failures.

No full browser build, gameplay activation, emulator observation, runtime palette allocator trace, cross-game promotion or stage-color compiler operation is claimed. No original game file was edited.

## Files added

- `scripts/run-mk2-o110f-palette-callsite-census.py`
- `scripts/verify-mk2-o110f-palette-callsite-census.py`
- `scripts/test-mk2-o110f-palette-negative-controls.py`
- `evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json`
- `scripts/run-mk2-o110g-stage-palette-adjacency.py`
- `scripts/verify-mk2-o110g-stage-palette-adjacency.py`
- `scripts/test-mk2-o110g-stage-palette-negatives.py`
- `evidence/mk2_o110g/MK2_O110G_STAGE_PALETTE_SELECTOR_ADJACENCY.json`
- This checkpoint, plus the short current-checkpoint pointer in `README.md` / `docs/CURRENT.md`.

## Reproduction

From the project root, replacing `/path/to/original/mk2` with the untouched original fixture directory:

```bash
python scripts/run-mk2-o110f-palette-callsite-census.py /path/to/original/mk2 evidence/mk2_o110f
python scripts/verify-mk2-o110f-palette-callsite-census.py /path/to/original/mk2 evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json
python scripts/test-mk2-o110f-palette-negative-controls.py /path/to/original/mk2 evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json scripts/verify-mk2-o110f-palette-callsite-census.py
python scripts/run-mk2-o110g-stage-palette-adjacency.py /path/to/original/mk2 evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json evidence/mk2_o110g
python scripts/verify-mk2-o110g-stage-palette-adjacency.py /path/to/original/mk2 evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json evidence/mk2_o110g/MK2_O110G_STAGE_PALETTE_SELECTOR_ADJACENCY.json
python scripts/test-mk2-o110g-stage-palette-negatives.py /path/to/original/mk2 evidence/mk2_o110f/MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json evidence/mk2_o110g/MK2_O110G_STAGE_PALETTE_SELECTOR_ADJACENCY.json scripts/verify-mk2-o110g-stage-palette-adjacency.py
```

## Next highest-value work

Stop pursuing simple nearest-record palette heuristics. The next useful proof would be **concrete allocator handle-table state at the guarded stage draw**, together with an authenticated branch/runtime ordering connecting the source index (especially literal 5) to `0x9E118`. If that cannot be established statically, an instrumented/recorded DOSBox trace (without modifying canonical game assets) would be more valuable than speculative repetition. Separately, the remaining stage compositor and unresolved MK2 animation consumer routes remain open. Maintain **MK2 → MK1 → MK3 → UI/usability → extractor**.
