# P59 Kombat Tomb screenshot-registered extraction

After loading original MK2, open **Asset library**, choose **Decode & browse**, expand **Coverage & evidence**, and download **MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip**. Its two PNGs reconstruct the opaque O123 held-out samples from the original setup-local architecture and sky. Each has its own row-major index plane and 0/1 witness mask. Use that mask to distinguish an opaque index zero from an unsampled pixel. The package adds no catalogue entries.

| TOMB.GRA layer | Object-2 setup | Source canvas | Source shift (x, y) | O123 held-out samples |
| --- | --- | --- | --- | --- |
| Architecture | 0x1737C | 850 × 224 | +267, +57 | 2,650 |
| Sky | 0x173B2 | 320 × 80 | +2, −47 | 823 |

Each 319 × 199 output uses the even-coordinate grid of a cropped 637 × 397 capture. Output (x,y) samples screenshot (2x,2y) and source (x+dx,y+dy). Only opaque pixels from the pre-existing O123 holdout regions are exported. The manifest includes the original hashes, source asset IDs, shifts and regions. The runtime camera, live setup selection, DAC ownership, draw order and timing remain unknown. The two projections are separate and cover only this capture. P58 retains the floor witness separately.

## Verification on 2026-11-07

- Repeated the user's P58 original-MK2 PASS against the local original installation. The P59 browser scan retained 5,369 assets. Headless Chrome downloaded the new ZIP through the production Asset Library and displayed the two P58 floor canvases and ten Forest comparison canvases in the Stage Gallery.
- Independently rebuilt the source layers using O121 EXE controls and the Python O122 stream decoder. The downloaded PNGs, every index byte, both masks and manifest source identities agreed. All 3,473 selected RGB pixels matched the hash-authenticated original screenshot. Other pixels were transparent.
- Reran the historical O123 independent screenshot audit using the original capture and archived report. It reproduced the architecture and sky fit counts (960 and 1,074), both holdouts and rejection of all 14 incorrect shifts.
- Source-only projection and refusal tests, TypeScript checks and the production build passed locally. The workflow runs the P59 controls without commercial files. P59 is a focused MK2 check. P61 remains the next cumulative checkpoint.

## Reproduce

Run the synthetic controls with Node after installing the repository dependencies. For independent acceptance, use Python with Pillow and the downloaded ZIP. The optional screenshot argument enables a fresh pixel comparison to the canonical private capture.

```sh
node scripts/test-p59-tomb.cjs
python scripts/verify-mk2-p59-tomb.py /path/to/original/mk2 /private/MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip --screenshot /private/TOMB_ORIGINAL_CONTROL_20261011.png
```

The original O123 registration and its regions are documented in [the O123 checkpoint](../CHECKPOINT_2026-10-11_O123_TOMB_LAYER_SCREENSHOT_REGISTRATION.md). This pass reuses the P3 registered source layers. If either layer is unavailable or fails qualification, the evidence report records the reason and omits the P59 package.
