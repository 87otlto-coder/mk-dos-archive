# O234 — Original Pit II six-layer camera-coordinate handoff

Status: **CANONICAL SOURCE VERIFIED**; runtime activation and full camera trajectory unverified. Inherit O233 unchanged.

Original `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; `PIT.GRA` `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`; `FALL.GRA` `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`.

In the original fatality-adjacent entry code `0x80202`, the vertical-motion increment at `0x842E4` is cleared, then exactly six calls to helper `0x8050B` process list heads `[0x84348,0x84344,0x84340,0x8433C,0x84338,0x84334]`. Respectively the matching signed horizontal position words are `[0x84326,0x84322,0x8431E,0x8431A,0x84316,0x84312]`. The helper traverses each list by its first pointer and subtracts per-list X and common `0x842EA` Y from the original object X/Y signed words at +`0x1A`/+`0x1E` (16-bit destination wrap). Immediately afterward original code sets six stage-related flags at `0x7745B..0x7746F`. Source `0x80359` independently compares a falling object Y against `0x842EA` and threshold 96. Local continuation `0x8045B` jumps to `0x8054A` (previous O227); **not** an authenticated external fatality dispatcher.

A separate code loop at `0x80CD2` adjusts the `0x842EA` location and yields. Its activation for this recording is **unproven**; it is not a verified pillar-descent formula. Likewise this finding does not establish live stage mode, Y-offset alias resolution, framebuffer contents or the five selected but unobserved `FALL.GRA`58 steps.

Read-only verifier: `scripts/verify-o234-pit-stage-camera-handoff.py --game-zip <owner ORIGINAL mk2 zip> --out <new empty destination>`. Runs twice with identical SHA-256 `d162f79d4202faf67c8955f4468a999ffa47eda6211e9b9e0f019685923074fd`. Fourteen deliberate source mutations rejected.
