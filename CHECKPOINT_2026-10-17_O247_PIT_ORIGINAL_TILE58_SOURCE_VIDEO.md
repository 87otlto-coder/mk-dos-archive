# MK DOS Archive — O247 original graphic-58 source-to-runtime corroboration

**Date:** 2026-10-17. **Predecessor:** O246. **Status:** verified original source image cross-control against real recorded DOSBox test; selector timing / old O214 discrepancy not fully resolved.

## New result

In the O245 *graphic-59 positive control* only `FALL.GRA` sprite 59 is recolored. The original graphic 58 is **byte-identical to the canonical original**. At video frame **452** (15.0667 s), immediately following the recolored graphic-59 frames 449–451, the original graphic 58 is the source-palette template winner: **10.1261/255 training RGB MAE**, **13.0322/255 mean error over four independent holdout areas**. The next-best source graphic (57) is **19.0804/255 training, 22.3447/255 held-out**. Its phase in the approximated normalized 320×200 viewport is (0,15). This is evidence of *original, unrecolored graphic 58* being displayed.

In the separate O245 *graphic-58 experiment*, original graphic 59 appears on frames **498–500**, followed by directly detected recolored graphic 58 on **501–502**, then original graphic 57. The two modified recordings therefore independently corroborate the correct relative order.

Recovered neighboring identities in the graphic-59 positive control at 30-fps capture:

| Video frame | Observed original source graphic |
|---|---|
| 442–448 | 60 |
| 449–451 | diagnostic altered graphic 59 (not source-palette classifiable) |
| **452** | **58, original untouched indexed source pixels** |
| 453–454 | 57 |
| 455–457 | 56 |
| 458–459 | 55 |

This agrees with the original selector's **source order** 60 → 59 → 58 → 57 → 56 → 55 (O224), but **not** with treating source selector entry counts as exact 30-fps capture-frame counts. O246's positive-color detection for 59 and 58 is preserved independently.

## Evidence and caveats

Verifier `scripts/verify-o247-pit-original-tile58-cross-control.py` fresh-reads the hash-guarded original owner `MK2.EXE` and `FALL.GRA`, decodes all 61 packed sprite streams to the exact 250804-byte boundary, obtains the original source-linked 81-color Pit palette at physical `0x895AC`, checks original bytes of sprite 58 in the positive-control kit, normalizes the two Windows recordings to native 320×200 coordinates and ranks all six sources on a training region and four separate holdouts. It analyzes 18 frames from the positive control and 17 from the graphic-58 diagnostic; 5 altered frames are deliberately excluded from normal-source classification. Nonaltered winning sources also win in independent holdouts across the sampled frames. Two complete reruns produced byte-identical JSON report SHA-256 `6308e9ad4f2227b65e26aa4d5de3d4e8efb321b024d1ac740d7a6b8157f998af`.

The capture-to-native normalization `[y30:H, x4:W-4] → 320×200` is an empirical test-window crop, **not** proven DOSBox viewport coordinates. Lossy video and scaling affect color residuals; the held-out texture-identity gap is much stronger than the raw pixel match. The original video from O214 still selected graphic 57 immediately after 59. That O214 capture remains a genuine exceptional observation; no explanation of its absent graphic-58 witness is claimed. O233's rejection of a uniform direct-display selector model in that earlier clip is not falsified, but must not be interpreted as a universal nonpresentation claim.

The approximately 50-fps presentation behavior independently measured in earlier Portal research and a hypothetical ~60 Hz tick scheduler are **distinct** and should not be silently equated. A 30-fps capture cannot prove exact source selector stepping or rendered duration.

No original game binaries or video were modified. This is additive research, not a new UI feature, DOS patch, or complete fatality camera/state simulation.

## Reproduce

```bash
python scripts/verify-o247-pit-original-tile58-cross-control.py \
 --game-zip <canonical-owner-mk2.zip> \
 --kit <MK2_Pit_II_O245_Runtime_Test.zip> \
 --known <known-visible.mp4> \
 --test58 <sprite_58.mp4> \
 --out <new-file.json>
```
