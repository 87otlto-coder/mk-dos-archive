# O252 — Tagged Pit fatality wall objects acquire and release palettes

Date: 2026-10-17. Inherits O251. Status: VERIFIED original-source path, **not a sampled live cache trace**.

## Result

A selected rock wall is not permanently accumulated. Every original selector iteration first calls `0x80733 -> 0x86BB1 -> 0x86C3F -> 0x86C66`, visiting the three object-list heads `0x84358, 0x84360, 0x84364` and filtering tag `0x70B`. Each matching object stores a palette slot at `+0x30`; `0x86C79 -> 0x7B505` decrements that slot's reference count **before unlink**. At zero, `0x7B52A` erases the slot's cached palette pointer.

The original `0x80771 -> 0x64548 -> 0x64522 -> 0x640A4 -> 0x7B439` creation path acquires one palette reference for each new wall object and writes its slot to `+0x30`. The caller commits and tags the new object `0x70B`, so the next iteration removes it.

The 32 selector entries use original 96×96, 80×80, or 64×64 grids of 15, 15, or 20 positions. Following all 32 entries once gives **500 object acquisitions**, including repeated selections of the same source graphic.

Cache behavior conditional: the last wall-object removal clears the pointer only if no unrelated live object holds the same palette; static references alone cannot establish that occupancy.

Replay: `python scripts/verify-o252-o254-pit-palette-lifecycle.py --game-zip <original mk2 ZIP> --source-zip <O251 or later source ZIP> --out <new directory>`.
