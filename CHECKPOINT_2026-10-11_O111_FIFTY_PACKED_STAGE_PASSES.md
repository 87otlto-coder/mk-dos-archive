# MK DOS Archive — MK2 O111: 50 bounded research passes and packed source editor

**Date:** 2026-10-11. **Target:** original DOS MK2 fixture. **Status:** 50/50 statically verified by an independently implemented source-file verifier; NO new emulator gameplay run performed. MK2 remains OPEN.

## Why this is meaningful

The O110Y–O110Z experiment established, from user-supplied screenshots, that changing the authentic packed source tails of `TOMB.GRA` or `PORTAL.GRA` changes the actual floors on the selected arena. The next safe work item was to stop generating one-off checker patches and build a repeatable, strictly bounded source writer that can be integrated with the extractor/compiler research later.

### New tool

`tools/mk2_packed_stage/mk2_packed_stage.py` is a Python standard-library-only, source-fingerprint-gated experimental editor. Its commands: `inspect`, `export-plane`, `replace-plane`, `paint`, and `restore`. It operates on source-space **896-byte rows** and enforces exact known resource identifiers/offsets/sizes/hashes. It does not overwrite the original input or any preexisting output path. Replacement planes must have exactly the original suffix byte length. The untouched resource prefix stays byte-identical. Every edit generates a restore receipt with enough original bytes to recover the original SHA-256. Receipts are user-generated game-derived data and are **not** included in this public-source-style package.

The seven known suffixes encompass **320 rows / 286,720 source bytes**. The 320-byte center projection of each source row is **not** a verified game frame or direct RGB representation. An authentic protected-mode MK2 renderer uses little-endian 32-bit addition of a dynamic replicated palette-base lookup word; naive independent per-byte addition differs in six of seven resources at a **hypothetical, non-runtime-verified** bank start of 193. This project intentionally holds palette handle ownership, true stage placement, full renderer order and gameplay composition open.

## Pass accounting

The 50 investigations are **seven distinct evidence questions applied independently to seven different original executable-referenced resources (49), followed by one entire native-table integrity check (50)**. They are bounded forensic/development passes, not 50 independent new gameplay mechanics, and **not** 50 DOSBox sessions. They were independently audited with 435 checks derived from the original game bytes. The archive remains unchanged.

| Range | Independent question | What each pass establishes |
|---|---|---|
| 01–07 | Native pointers and source identity | Original EXE table slot, packed offset, unique reference occurrence, resource SHA-256 |
| 08–14 | Raw row structure | Distinct 896-byte rows, real 576-byte margins, source-index extrema |
| 15–21 | Source partitioning | 320 centered source bytes plus 576 side bytes reassemble EXACT original rows |
| 22–28 | Native DWORD transform vs naive | Hypothetical bank 193 carry mismatches / checksum control; not a runtime color claim |
| 29–35 | Isolated localized edit | One source cell changed with zero prefix/other-row damage |
| 36–42 | EOF boundary and undo | Last byte of last source row edited and original SHA-256 fully restored |
| 43–49 | Adversarial provenance | Corrupted originals and forged restoration change counts rejected |
| 50 | Whole table | All seven references, zero slot, 320 rows / 286,720 source bytes, tampered EXE rejected |

## Distinct stage-source measurements

| Original source | Rows | Suffix offset | Original 576-byte margin nonzeros | Byte differences: authentic DWORD vs naive at bank 193 |
|---|---:|---:|---:|---:|
| TOMB | 48 | 63,776 | 27,648 | 0 |
| BATTLE | 40 | 59,436 | 23,040 | 47 |
| TOWER | 64 | 56,268 | 36,864 | 3,947 |
| FOREST | 32 | 198,116 | 18,432 | 80 |
| ARMORY | 56 | 126,336 | 32,254 | 24 |
| PORTAL | 40 | 56,916 | 23,040 | 9,184 |
| ARENA | 40 | 90,488 | 23,038 | 736 |

These figures describe authentic original source bytes and controlled arithmetic, not visible RGB screenshot pixels. No fixed palette bank 193 is claimed to exist in any actual fight.

## Verification and falsification

- 50/50 independent source-based pass results: `research_outputs/MK2_O111_50_PASSES.json`.
- `tools/mk2_packed_stage/verify_50_passes.py`: independently decodes the original ZIP without importing the producer/editor and validates every pass and source SHA against original resource contents; **435 checks passed**.
- `tools/mk2_packed_stage/test_mk2_packed_stage.py` and `test_50_passes_adversarial.py`: **15 unit-test methods passed**, including original-file corruption, false table pointer, out-of-region edit, wrong suffix length, cross-resource receipt, altered patched file, falsified restored count, and nine falsified research reports. Every tampered report was rejected, and valid data passed afterward.
- Original game files were read only; the delivered source package contains **no original MK2.EXE, `.GRA`, full game copy, private restore receipts, or modifications to previous research**.

### Reproduction

```sh
python -m unittest discover -s tools/mk2_packed_stage -p 'test_*.py' -v
python tools/mk2_packed_stage/run_50_passes.py /path/to/mk2.zip /tmp/MK2_O111_50_PASSES.json
python tools/mk2_packed_stage/verify_50_passes.py /path/to/mk2.zip /tmp/MK2_O111_50_PASSES.json
```

See `tools/mk2_packed_stage/README.md` for `inspect`, `export-plane`, `paint`, `replace-plane`, `restore` commands.

## Scope and precise outstanding work

1. **Runtime validation remains only for the user-observed O110Z Tomb/Portal patch effects**; other five `.GRA` resources have structural/EXE pointer evidence, not new gameplay eyewitness proof.
2. The source stride is 896 and source viewport transfer is 320, but **the source is not a self-describing palette-mapped 320×200 display image**. Full color, dynamic bank-start selection, visible crop, layer origin and compositing remain unresolved.
3. Full MK2 stage-scene reconstruction and variable-length graphic encoding are not qualified by this tool; it edits an already known fixed-length authentic tail only.
4. The writer has not been integrated into the browser UI and has no Windows DOSBox test automation. Integration belongs to subsequent research/development after further compositing evidence.
5. Research roadmap remains **MK2 → MK1 → MK3 → UI/usability → extractor/compiler milestone**; modern *Authentic Enhanced* runtime/bot concepts remain future projects, not current scope.

**Checkpoint policy:** prior historic formal 13/30 closure at O110V is retained. This user-requested 50-pass batch is separately tracked as `O111 50/50` and is not retroactively used to promote untested O110W–Z runtime claims or solved MK2 status.
