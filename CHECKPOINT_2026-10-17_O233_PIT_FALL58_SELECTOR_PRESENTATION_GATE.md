# O233 — Graphic 58: reject uniform direct-presentation selector models

**Status:** bounded negative test against original `MK2.EXE`, `FALL.GRA` and independently verified O214 video-derived original-palette matches. Original DOS game files untouched.

The original 32-byte wall selector at physical `0xB4D84` is exactly `[5]×12, [4]×6, [3]×5, [2]×4, [1]×3, [0]×2` with `FF` terminator. Original `FALL.GRA` descriptor correspondence: source sprites 60,59,58,57,56,55. O224 authenticates the selector consumer with a source scheduler-yield count of 1; *this is not a proven real-time tick rate*.

O214's **17 consecutive recorded frames, 878–894 at 30fps**, evaluated with the original executable-linked Pit palette and independent holdout masks, classified: source60 ×8, source59 ×3, source57 ×3, source56 ×2, source55 ×1. No recorded source58 winner.

O233 tests a deliberately constrained alternative: *each selector step is immediately presented as its texture, at a uniform source-step rate*. For each rate 40,45,50,55,60,65,70,75 steps/second, test all 12 viable initial positions in the leading source60 run and eight independent fractional phase offsets. All 96 combinations per rate fail to reproduce the 17-video-frame original-palette classifications.

| Hypothetical direct-display source steps/sec | Minimum disagreements in 17 captured frames |
|---:|---:|
| 40 | 6 |
| 45 | 6 |
| 50 | 6 |
| 55 | 4 |
| 60 | 6 |
| 65 | 7 |
| 70 | 9 |
| 75 | 11 |

In the *hypothetical* 60Hz model, five continuously displayed source58 steps would occupy 5/60 = 0.0833 seconds. Across 1,000 capture-grid phase offsets, a contiguous interval of this duration covers >=2 observations on a 30fps grid. Thus “frame sampling alone entirely hid a contiguous sprite58 run” cannot reconcile this specific model with the recording. **This is a negative control on a hypothetical execution/presentation model, not proof that sprite58 is unused, suppressed or missing.**

To actually resolve this requires a live state/renderer trace (ideally selected sprite/object tag, build/remove and framebuffer swap timestamps) or newly authentic runtime evidence. Do not conflate the `PIT.GRA` pillar descent ending at frame877 (O231/O232) with the separate `FALL.GRA` wall selector beginning at frame878.

Two independent re-executions generated identical JSON SHA-256 `7be014f1d73130a944eda24c496243b99297a9b3d66a8408d4242b8c3e75b0d9`. Canonical source hashes enforced.

Reproduce:

`python scripts/verify-o233-pit-graphic58-timing-negative-control.py --game-zip <owner MK2 ZIP> --o214-report <verified O214 JSON> --out <new path>`
