# O255 — Lower falling actor uses a separate character-palette table family

Date: 2026-10-17. Inherits O254. Status: independently verified static source table/call analysis.

## Result

The lower-scene code `0x8055B` gets a character selection and creates an actor through `0x8056A -> 0x85BE3`. The palette allocator is reached via `0x85C79 -> 0x7B439`, after the code chooses either Object-2 table `0x1C1B8` or alternate `0x1C1FC`. All **17 source-pointer entries in each of these two original tables** were checked; none equals the original wall palette pointer `0x27958`.

This rejects the obvious candidate that the lower fighter's ordinary palette allocation is a live owner of the wall's palette. It does **not** prove absence of every alternate owner or unobserved concurrent task.

A different lower-scene color routine `0x805EA -> 0x74685 -> 0x746B7` can directly requeue a palette and set pending flag. Therefore the pending flag is not exclusively a witness of wall cache misses.

Replay: `python scripts/verify-o255-pit-lower-actor-palette-source.py --game-zip <original mk2 ZIP> --source-zip <O251 or later source ZIP> --out <new directory>`.
