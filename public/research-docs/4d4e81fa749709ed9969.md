# MK DOS Archive — MK2 O112 / 50-pass stage viewport and inverse editor checkpoint

**Date:** 2026-10-11. **Status:** **50/50 STATICALLY VERIFIED; no new emulator gameplay.** MK2 remains open. This checkpoint extends, but does not erase, O111, O110Z, or the historical 13/30 formal passes ending at O110V.

## Material advance

O111 established a canonical-file-gated *896-stride* source editor. O112 implements a **320-byte source viewport projector** with the bounded row-shift arithmetic recovered from the original `MK2.EXE` at `0x659C6` and its 256-entry repeated-byte palette-base lookup at `0xA1CD8`. It also implements **simulated viewport-coordinate painting**, carefully reversing the complete little-endian DWORD addition so that only the requested projected output index bytes change in the chosen hypothetical context.

Unlike a straight image editor, this operation can alter 1–4 bytes of raw `.GRA` per changed projected DWORD because of integer carry/borrow. It preserves original file prefixes/sizes; the established O111 receipt restores the exact canonical SHA-256. All original commercial game resources were read only and are **not shipped**.

**Warning:** these are ***INDEX*** bytes, not RGB colors. `camera-x` and `bank-start` are experimental arguments, and neither their runtime values nor the real stage palette assignment is established. `--diagnostic-png` creates a mathematically exact *grayscale visualization of index values*, not an authentic in-game frame.

## Exact pass accounting

| IDs | Question family | Source experiments |
|---|---|---:|
| 01–07 | Exact center `camera-x=288`, hypothetical palette bank 1; all source rows | 7 |
| 08–14 | Left camera 176, sign/fixed-point stride and clipping; first 16 rows | 7 |
| 15–21 | Right camera 400, sign/fixed-point stride and clipping; first 16 rows | 7 |
| 22–28 | Center camera, hypothetical palette bank 193, **whole-DWORD** addition and carry | 7 |
| 29–35 | Center camera, hypothetical bank 49, 32-bit indexing differences | 7 |
| 36–42 | Center camera, hypothetical bank 65, 32-bit indexing differences | 7 |
| 43 | Original executable anchors, stage renderer `CALL` displacement | 1 |
| 44 | Exact original 256-word byte-replicated lookup and tamper negative | 1 |
| 45 | Compare three 16-row fixed-point cursor trajectories | 1 |
| 46 | Round-trip inverse DWORD arithmetic for all seven center planes | 1 |
| 47 | Controlled one-output-index edit and restoration for all seven at bank 1 | 1 |
| 48 | Controlled off-center/bank-193 edit and restoration for all seven | 1 |
| 49 | Deliberately invalid source/camera/bank/height/edit inputs rejected | 1 |
| 50 | Authentic seven-reference EXE table, total source size and aggregate projection provenance | 1 |

These passes are **42 stage-specific parameterized experiments and eight corpus-level investigations**, not 50 independently discovered gameplay subsystems, not 50 DOSBox sessions, and not runtime palette validation. Their results can be reproduced from the user-provided `mk2.zip` alone.

## Audit and continuity

- `research_outputs/MK2_O112_50_PASSES.json` records each observed digest, parameters, and limits.
- `tools/mk2_packed_stage/verify_o112_50_passes.py` independently re-computes every report from the original ZIP, with **2,434 byte/geometry/source checks** (many are internal row bounds checks, not distinct discoveries).
- **34 Python unit test methods passed**: 15 O111 tests retained plus 19 new O112 methods.
- **11 fabricated O112 documents were refused** on full revalidation.
- Every previously stored **O110C viewport case** recomputed to the exact historical digest. O111 code and research evidence remain untouched.
- No new Windows gameplay was attempted. **Only Tomb and Portal are runtime witnessed**, and only for their previously documented floor edits.

## What remains unresolved

- Live allocation order and identity of palette handle 1, plus RGB lookup and the actual source-index-to-visible-color relationship.
- Which `camera-x`, stage row count, source range, and source-layer placement are used in any given gameplay frame.
- Full background composition/scene layers; exact stage graphics other than the bounded packed suffix.
- Full reconstruction of editable character animation and sound assets; general UI integration.

## Reproduce

```bash
python tools/mk2_packed_stage/run_o112_50_passes.py /path/to/mk2.zip /tmp/O112_50.json
python tools/mk2_packed_stage/verify_o112_50_passes.py /path/to/mk2.zip /tmp/O112_50.json
python -m unittest discover -s tools/mk2_packed_stage -p 'test_*.py' -v
```

See `tools/mk2_packed_stage/README_O112.md` for the new editor CLI.

**Next recommended evidence:** use an isolated DOSBox modified game copy, known forced stage, and deterministic frame capture to constrain *actual* camera and bank values. Do **not** promote hypothetical bank 49, 65, or 193 into a real MK2 palette-ownership finding. Roadmap remains **MK2 → MK1 → MK3 → UI → extractor/compiler milestone**; modern *Authentic Enhanced* runtime remains a future phase.
