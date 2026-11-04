# O248 — Pit II Fatality Selector vs Displayed-Frame Duration

**Date:** 2026-10-17. **Predecessor:** O247. **Type:** Read-only, source- and controlled-video-qualified timing feasibility test. No original game-file modifications.

## Verified inputs and source fact

- Original MK2 executable and `FALL.GRA` SHA-256 independently checked against the canonical owner MK2 game ZIP.
- O224 original-source selector contains the ordered runs **60×12, 59×6, 58×5, 57×4, 56×3, 55×2** with a count-1 task yield per selector pass.
- O246 positive diagnostic-band appearances (59 on frames 449–451, 58 on frames 501–502) and O247 original-pixel cross-control texture classifications are read from **the inherited, hash-qualified research evidence**, not newly guessed frame labels.
- Both uploaded control recordings SHA-256 checked again. Each is encoded at 30 fps. The O247 observed source sequence is independently checked against the O224 original selector order.

## Observed texture runs (each recording normalized to its own capture frame numbers)

| Original/diagnostic sprite | Source selector count | 59-positive-control captured frames | 58-diagnostic captured frames |
|---|---:|---|---|
| 60 | 12 | 442–448 (7) | 492–497 (6) |
| 59 | 6 | 449–451 (3; diagnostic stripes) | 498–500 (3; original sprite) |
| 58 | 5 | **452 (1; original sprite)** | **501–502 (2; diagnostic stripes)** |
| 57 | 4 | 453–454 (2) | 503–505 (3) |
| 56 | 3 | **455–457 (3)** | 506 (1) |
| 55 | 2 and held scene thereafter | 458–459 (2 sampled) | 507–508 (2 sampled) |

Falling-fighter and impact effects are excluded from these source texture identity findings; classification comes from fixed unobstructed source/video patch and four independent validation regions as documented in O247.

## Important mathematical result

Under **all three** assumptions:

1. every selector entry lasts exactly `1/r` seconds for one globally fixed rate `r`,
2. every newly selected texture is immediately continuously displayed for all its steps, and
3. the 30 fps recordings sample that display periodically,

then in the **59 positive control**:

- Graphic 58 has five entries but only one captured frame (452), with graphic 59 at 451 and 57 at 453. For exactly one 30 fps sample to fall inside a continuously displayed interval, its duration must be **strictly less than 2/30 seconds**. Therefore `5/r < 2/30`, requiring **r > 75 steps/s**.
- Graphic 56 has three entries and occupies **three consecutive captures (455, 456, 457)**. Its interval must be **at least 2/30 seconds**. Therefore `3/r >= 2/30`, requiring **r <= 45 steps/s**.

Both conditions cannot hold for one fixed `r`. **This refutes the combined simplistic constant-rate immediate-presentation model independent of exact sampling phase or particular 50/60Hz assumption.** It does not prove which assumption fails. Source stepping can be irregular; objects can be presented late, retained or replaced asynchronously; captured frames can repeat.

## Quantitative model controls

Exhaustive phase search on 0.01 selector-step grid and source runs, plus rate grid 40–80 selector steps/s at 0.25-step/s increments:

| Trial | Optimized model 50 steps/s | Optimized model 60 steps/s | Best searched uniform rate |
|---|---:|---:|---:|
| Graphic 59 positive control, 18 samples | 5 mismatches | 3 mismatches | **2 mismatches** |
| Graphic 58 diagnostic, 17 samples | 2 mismatches | 1 mismatch | **0 mismatches** |

These are **model-fitting controls**, not measured interrupt rates. One experiment fitting perfectly does not validate the uniform model when its independently recorded positive control cannot. Grid rates are not an estimate of true DOS tick frequency.

At captured frames 503–505 in the graphic-58 experiment, the 90×70 native-pixel wall ROI is byte-identical across all three frames after the fixed O247 normalization. Hence the three-frame hold of graphic 57 cannot be dismissed as mere ranking noise. Exact 30 fps duplicate capture of an unchanged screen remains possible.

## Still unresolved

- Which component introduces the unequal hold durations: scheduler variability, queued tile objects, compositor presentation, game pause/state, viewport transitions or capture behavior.
- Original runtime interrupt and frame presentation trace; a nominal ~60Hz PC timer and independently observed ~50fps animation remain different facts.
- Falling-object gate/actor identity, impact effect order, precise camera trajectory and fatality activation beyond inherited checkpoints.

## Reproduce (fresh paths)

```bash
python scripts/verify-o248-pit-selector-presentation.py \
  --source-zip <original O247 full-source zip> \
  --game-zip <canonical original MK2 zip> \
  --known <known-visible.mp4> \
  --graphic58 <sprite 58.mp4> \
  --out <new-output-file.json>
```

Two independent executions yielded byte-for-byte identical JSON report SHA-256 `7bd58deef684a267763d15cd1f8191cb3700584eec8507611de3c95042b54680`. The original input hashes are part of the recorded report and verified by the reproducer. Original MK2 binaries and user recordings are *not* distributed in research ZIPs.
