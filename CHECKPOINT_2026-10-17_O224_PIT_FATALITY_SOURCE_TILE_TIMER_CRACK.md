# MK DOS Archive — O224 Pit II original fatality timed lower-wall selection and palette pointers

**Date:** 2026-10-17. **Predecessor:** O223. **Status:** canonical original static source / typed LE relocation path independently qualified; live DOS instruction trace NOT performed.

## Exact source sequence

`MK2.EXE` Object-2 `0x14130`, physical `0xB4D84` stores **32 consecutive selection bytes and `0xFF` terminal marker**. The bytes fall into exactly six runs: original `FALL.GRA` graphic **60 ×12**, **59 ×6**, **58 ×5**, **57 ×4**, **56 ×3**, **55 ×2**. Original code `0x805A6` zeros the selector cursor (global `0x1376B`). Original code at `0x805F4` loads scheduler yield **1**, calls the established scheduler at `0x6710F`, calls selector routine `0x80721` at `0x805FE`, and loops based on the returned carry flag (`JAE` at `0x80603`) until terminal `0xFF` is reached. `0x80721` checks the `0xFF` byte for termination; reads each selector as an unsigned byte; indexes a **six-entry, eight-byte-stride descriptor-and-drawing-script table** at Object-2 `0x14151`; processes per-tile draw entries until a `0xFFFFFFFF` terminator; and increments the selector cursor. All six descriptor pointers and drawing-instruction-list pointers have exact original type-7 LE relocations, not heuristic address matches.

Crucially, this establishes an original timed source-control pathway for **graphic 58**, which O214 had *not* selected at any sampled video moment. Do not quietly drop sprite 58 from reconstruction: it has **five source selector entries**. A 30 fps recording is not the actual game clock, but the disagreement between selected captured frames and an expected five-step interval needs independent investigation. An exact runtime tick/presentation trace is not claimed.

## Palette ownership and crack source

Original special 16-byte `FALL.GRA` descriptors for **graphics 54–60** all have fourth-DWORD original relocated Object-1 pointers to `0x27958`, physically `0x895AC` in MK2.EXE, the established source-linked Pit 81-color palette record. Therefore this is *per-descriptor original pointer evidence*, not merely a visually compatible candidate palette. Live palette DAC installation/bank switching remains unobserved.

Immediately following the timed selection loop, original code at **`0x80645`** writes source descriptor **54** into the sprite-selector global `0x75A6C` using the correct original type-7 relocation (`0x8064B → Object-2 0x22FEC`), then calls original object-setup helper `0x64548` at `0x8064F`. This source-order connection supports O216's video finding that the masked crack graphic appears **after** the lower-wall transition, but does not independently establish `(104,44)` screen position, exact compositing, or effect trigger time.

## Verification and limitations

`scripts/verify-o224-pit-fatality-background-control.py` hash-pins MK2.EXE + FALL.GRA, parses all 26,994 independent original typed fixup sites through the preserved O120 parser, checks the source animation control opcodes, selector payload, pointer pairs, palette pointers and crack initialization call, and retains original O214 video classification as distinct evidence. Nine deliberately corrupted source conditions are all rejected. Two independent reproductions give identical JSON SHA-256 **`4c48227e4ea7dab813bd48ad021be000b40704a801e0c3a6d00c1e6b5c082b0f`**.

The previously recorded O214 video results select source textures 60,59,57,56,55, not 58. They are NOT overwritten, relabeled or treated as a runtime instruction trace. A yield count of 1 does not by itself prove wall-clock timing, and source object positions do not necessarily equal native camera positions.

Reproduce:

```
python scripts/verify-o224-pit-fatality-background-control.py --game-zip <original-user-mk2.zip> --project . --o214-report research_outputs/O214_SOURCE_PALETTE_TRANSITION_REPORT.json --out <new-nonexistent-output-dir>
```

No game binary changes, no legacy edits, no new app build. All inherited O223 source preserved.
