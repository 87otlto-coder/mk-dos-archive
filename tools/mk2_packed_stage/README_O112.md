# MK2 O112: exact-code-derived indexed viewport projector and controlled inverse editor

This extends O111's packed 896-byte row editor. It is a **source research utility**, not a finished MK2 rendered-scene extractor. All game resources, executable code, palettes, sprites and screenshots remain original-user-supplied. No commercial game bytes are included with the software.

## Why

The authentic DOS MK2 blitter at native executable offset `0x659C6` reads a 320-byte viewport from each 896-byte source row, selects source positions using a signed 16.16 camera-dependent accumulator, and applies an EXE-resident 256-entry repeated-byte LUT by **32-bit little-endian DWORD addition**. The palette-base byte is read at `0x659EA`; stage draw uses palette handle 1, but the live **palette handle ownership / allocated bank start and live camera value remain UNKNOWN**.

O112 adds a read-only projection tool and a reversible `paint-projection` method. The tools use exact canonical original-file SHA-256 identities and bounded file-suffix editing. A projected output byte is an **index-space experiment**, **not original hardware RGB**, not a gameplay screenshot and not a claim about the visual stage composition. Original game files are never edited in-place.

## Project original bytes in a chosen hypothetical context

```sh
python tools/mk2_packed_stage/mk2_stage_projection.py project \
  /original/MK2/tomb.gra /tmp/tomb_indices.bin \
  --exe /original/MK2/mk2.exe \
  --camera-x 288 --bank-start 1 \
  --report /tmp/tomb_projection.json \
  --diagnostic-png /tmp/tomb_index_grayscale.png
```

`--diagnostic-png` exports a lossless *grayscale of output index numbers*, **not authentic colors**. No guessed RGB palette is applied.

Supported researched camera test cases:

- `camera-x 288`: source row start always 288; can use all known source rows.
- `camera-x 176`: left-shifted 16-row bounded demonstration. Cursor shifts per row using `slope16_16=+65536`.
- `camera-x 400`: right-shifted 16-row bounded demonstration. Cursor shifts per row using `slope16_16=-65536`.

Any input that walks outside a legitimate 896-byte source row is refused. `bank-start` is an **explicit hypothesis** in the interval 1..256; sample values 49, 65 and 193 **do not establish the actual live palette bank**. Only original files fingerprinted by O111 are accepted. Output paths must be distinct and nonexistent before generation.

## Bounded edit by simulated projected coordinates

```sh
python tools/mk2_packed_stage/mk2_stage_projection.py paint-projection \
  /original/MK2/tomb.gra /tmp/tomb_modified.gra /tmp/tomb_restore_receipt.json \
  --camera-x 288 --bank-start 1 --rows 16 \
  --x 80 --y 8 --width 12 --height 3 --value 42

# Existing O111 restoration routine works with the resulting receipt:
python tools/mk2_packed_stage/mk2_packed_stage.py restore \
  /tmp/tomb_modified.gra /tmp/tomb_restore_receipt.json /tmp/tomb_restored_original.gra
```

The projected-index edit is implemented by inverting the **whole** 32-bit add for each affected DWORD. A single projected-index change can require modifying **more than one original source byte** due to carry or borrow. Both changed and unaffected projected bytes are reverified after generation; the untouched original resource prefix remains byte-identical; the receipt allows full restoration. The receipt embeds **game-derived packed source bytes**, so **do not redistribute private receipts**. To use modified resources in DOSBox, place outputs under their original resource filename in a **separate isolated copy** of the game directory. Real gameplay appearance is not predictable without runtime camera/bank/layer context.

## 50-pass research and independent audit

```sh
python tools/mk2_packed_stage/run_o112_50_passes.py /original/mk2.zip /tmp/MK2_O112_50_PASSES.json
python tools/mk2_packed_stage/verify_o112_50_passes.py /original/mk2.zip /tmp/MK2_O112_50_PASSES.json

# Set MK2_CANONICAL_ZIP=/original/mk2.zip outside the original research container.
python -m unittest discover -s tools/mk2_packed_stage -p 'test_*.py' -v
```

Report contains 42 source projections (six parameterized cases for seven resource files) plus eight distinct whole-corpus/native-code/editor-inverse/error-boundary checks. The verifier imports **none** of the O112 producer, projector, or O111 editor code and directly recomputes all original resource bytes and exact modular-arithmetic output hashes. 34 regression tests (15 inherited + 19 newly added) passed; 11 forged O112 reports were rejected by re-running the original ZIP verifier. Prior O110C projections were replayed identically.

Runtime status remains **unchanged** from O110Z: user-confirmed source floor modifications only for Tomb and Portal; zero new Windows DOSBox experiments at O112. The other five stages are structurally referenced, not new runtime-confirmed floor replacements. Neither full stage palettes, true crop, texture-to-stage layout, nor dynamic handle ownership are solved.
