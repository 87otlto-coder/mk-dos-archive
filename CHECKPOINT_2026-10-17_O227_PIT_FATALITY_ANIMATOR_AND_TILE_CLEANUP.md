# O227 — Original Pit II fatality pose delay and tagged background object replacement

**Scope:** original canonical MK2.EXE + FALL.GRA static 32-bit code path; inherited O214/O215 30fps records. **Not a runtime trace.** O226 remains unmodified.

## New source facts

- The original fatality entry continuation at physical `0x805D1` selects an actor-specific animation stream from original Object-2 pointer table `0x13DC4`, through the shared `0x64ED2` accessor, which indexes by `[EDI+0x46]` and stores the returned animation cursor to `0x75A78`.
- At `0x805E0`, literal **3** is passed to original delay setup `0x6433F`, which writes `[ESI+0x3C]=3` as the repeat delay and initializes `[ESI+0x40]=1` as the first countdown. This **first countdown is 1**, not 3.
- Each selector loop iteration enters `0x6435A` at `0x805EF`, **before** the one-count scheduler yield and tile-selector call. On a zero countdown it reloads the configured delay and conditionally advances via `0x86CC5` or `0x63E79`, depending on the bit-1 flag of the current object; it does not unconditionally select the next list pose on every tick.
- Immediately before constructing each tile group, source `0x80733` calls helper `0x86BB1` with full tag `0x070B`. That path scans three object-list heads (`0x84358`, `0x84360`, `0x84364`) and unlinks matching objects based on their tag field `[EDI+0x40]`. Newly committed wall-tile objects receive the same **`0x070B`** tag at `0x8078E`. Thus original code has a **tagged group replacement** mechanism, not merely permanent texture stacking.
- Exact source `0x8045B` jumps to `0x8054A` after earlier object/setup and wait calls. This is a local edge only; upstream fatality dispatcher and live activation remain unresolved.

## Implications and unresolved contradiction

The selected screen textures in the inherited sampled recording are 60 (frames 878–885), 59 (886–888), 57 (889–891), 56 (892–893), 55 (894+); graphic **58 was not selected**. The original 32-step selector definitely contains 58 for five entries. Tagged removal and new-object creation strengthen the case that 58 is intended to be drawn, but no source-only calculation here proves it reaches the displayed framebuffer. The observed duration for 60 alone also differs from naive 12 steps at 60Hz. **Do not explain the disappearance as a mere 30fps sampling gap** without an independently validated runtime/presentation model.

The source handler connects O226's five-pose list to its character-indexed cursor *mechanism*, but live `[EDI+0x46]` character state, flags and actual cursor advancement are not captured. **Do not impose list order as video playback order.** User's observed approximately 50fps DOS presentation is independent of the source's task delay counter and approximately 60Hz timer divider.

## Verification

`scripts/verify-o227-pit-fatality-frame-and-tile-consumers.py` SHA-pins the owner fixture and original O214/O215 report identities, verifies original opcode and branch relationships, carries forward 19 original recorded texture classifications, rejects **9** deliberately corrupted source code/table conditions, and reproduced identically twice. JSON SHA-256: `0dbba2ec1f31f65e68786a7706a3b57f338460d5b4d458103acee2bb2ecd8b2f`.

Run against original fixture, no new game files or altered prior source: 

```
python scripts/verify-o227-pit-fatality-frame-and-tile-consumers.py --game-zip /path/to/original/mk2.zip --project . --out /new/empty/nonexistent-directory
```

**Boundary:** Code path established; runtime/object pool, stage camera and exact onscreen scheduling not proven. Avoid binary patches.
