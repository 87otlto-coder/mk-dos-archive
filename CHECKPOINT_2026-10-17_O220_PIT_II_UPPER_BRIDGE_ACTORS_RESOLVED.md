# MK DOS Archive — O220: original The Pit II distant bridge actor graphics independently matched

**Date:** 2026-10-17. **Predecessor:** O219 and preserved O210/O209.2. **Status:** original resource + original executable descriptor source AUTHENTICATED; graphics' placement and time-varying appearances VIDEO-CORROBORATED; original animation callback/game tick timing NOT proved.

## Breakthrough / correction to O217's open question

The TWO distant animated background fighters **are inside the original `PIT.GRA` resource itself**, but are NOT part of the six **large background setups** analyzed in O205/O208. The preexisting independent O69 resource census had already recorded 14 final small graphics as original executable descriptor-linked fragments at `PIT.GRA` offsets `61620..69384`, but did not identify their visual meaning. O220 decoded those original fourteen indexed graphics and visually identified the **green-clad actor group (source sprites 0–6, each 16×24)** and the **flaming actor group (source sprites 7–13, each 16×32)**. Both are native-scale and have original resource ID **32**. Their original sprite and transparent-pixel decoding exactly consumes the last **7,764 bytes** of PIT.GRA without any overlap, gap or unconsumed byte.

All 14 original executable-linked sprite descriptors begin at physical **0xB98E4** through **0xB9988**. The first descriptor of each group has an extra four-byte adjacent record: valid starts are 0xB98E4, 0xB98F4, 0xB9900 through 0xB9930, 0xB993C, 0xB994C, 0xB9958 through 0xB9988; see precise JSON for full list. All source-local descriptor X/Y are zero. Native SCREEN positioning below is inferred through video matching and is not stored in those source-local X/Y fields.

Both groups render in appropriate character colors **using only the original EXE-linked 81-color Pit palette at physical EXE `0x895AC`** (O205/O214 source palette relationship), without any video-trained palette. The source-colored contact sheet is `visuals/pit14_original_source_contact.png` in the accompanying research ZIP. (The contact sheet uses a flat dark illustrative background, not a game render.)

## Independent original-source RGB validation against owner's authentic Pit gameplay video

Reproducible script `scripts/verify-o220-pit-bridge-original-sprites.py` authenticates original MK2.EXE, PIT.GRA and 30fps owner video SHA-256, independently re-parses 14 executable descriptors, binary decodes all 14 masked graphics, verifies consecutive tiling, follows the original palette link, and evaluates 51 video samples at 0.1-second intervals across first 5 seconds. For each sample and each actor, original pose index and small XY range are chosen solely using **checkerboard-half original opaque sprite pixels**, then evaluated on the **other half**. This avoids measuring each match exclusively on pixels used to choose it. The source is not interpolated/geometrically stretched. The native viewport cropping is the authentic upper Pit recording: 638×426 video -> first 638 width, rows 26..425, resized to native 320×200.

Results across 51 independent captured frames:

- **Green actor:** source sprites 0–6 (16×24), observed matched sprite origins `[138–139,89–90]` (native XY). Median held-out original RGB error **17.660/255**, while shifting the same sprite horizontally +3 pixels gives median error **43.986/255**. Substituting the other, fiery actor's original pixels at same origin yields median >**61/255**.
- **Flaming actor:** source sprites 7–13 (16×32), matched sprite origins `[162–163,83–84]`. Median held-out original RGB error **18.634/255**; horizontally shifting +3 pixels raises error to **39.884/255**. Substituting the green actor group's original pixels yields median >**54/255**.
- Independent rerun produced **byte-identical JSON SHA-256 `a567f738b9c65629b0b218c80213e44dfe635dc82128e80edbf75d38aad52434`**.
- A second **denser video sampling** of 121 consecutive native capture frames found matched source graphics (green) 1,3,4,6 and (flame) 7,8,10,11,12,13. Not every source pose is discriminated in these sampled gameplay frames, and this observation is **NOT** evidence of unused original poses. Other poses might be subtle, temporally undersampled, or sprite-similar. Full original runtime seven-frame sequencing remains unresolved.

**Research impact:** O217's qualitative claim “animated distant fighters visible, source unknown” is superseded by direct original-source graphics attribution. O217's warning to avoid interpreting `MONKS.GRA` as graphic remains correct. `MONKS.GRA` is *not* the evidenced source of these two actors. The unresolved part is the exact original **actor animation control logic, tick/frame schedule, and draw callback**, not their authentic sprite artwork.

**Independent original source code:** `scripts/verify-o220-pit-bridge-original-sprites.py`.
**Machine report:** `research_outputs/O220_PIT_BRIDGE_ORIGINAL_14_SPRITE_MATCH.json`.
**Original artwork preview:** `visuals/pit14_original_source_contact.png` in research evidence archive.

## Inherited fatality findings remain authoritative

O210 source 61-fall graphics, O214 intermediate background source sequence **60 → 59 → 57 → 56 → 55**; O215 intermediate body poses; O216 original masked crack sprite54 placement candidate; O218 original 14×9 `BLOOD.GRA` sprite177 repeated red debris; O219 48-color original executable candidate record compatibility for blood fragments. See inherited O216/O219 checkpoints for sampled frame boundaries, RGB controls, palette qualifications and original hash pins. Original files are not patched. All inherited project/source/research ZIP members preserved unchanged.

## Remaining original-runtime questions / confidence ceiling

1. Actor callback frame ordering, cadence, scene-mode selection and stage depth/draw order (only source sprite group, original pixel geometry, colors and empirically video-verified screen placement are established).
2. Exact Pit upper-camera/parallax formula and compositing all static and dynamic parts.
3. Stage fatality executable dispatcher/precondition flow (previous O209 Gate 1 **NO-GO** for arbitrary hotkey executable patch).
4. Fatality internal tick/transition and camera arithmetic vs the visible video 30fps source match.
5. Exact layering, alpha/priority, palette bank swapping/DAC state and callbacks for FALL sprite54 crack, BLOOD sprite177 particles, foreground fighter and winner text.
6. Source58 potential other roles, complete all effects, original winner lettering and audio scheduling.

These are runtime-specific mechanism gaps, not reasons to fabricate missing graphics. The authentic background figure **artwork itself is now recovered**. A proper next pass would attempt bounded executable callsite reachability for these 14 original sprite descriptors, then, if necessary, targeted DOSBox debugger traces; do not attempt a patch without evidence.

## Reproduce this step

```
python scripts/verify-o220-pit-bridge-original-sprites.py --game-zip <owner-original-mk2.zip> --pit-video <owner-140419-pit-video.mp4> --out <new-absent-output-dir>
```

The script is read-only and refuses replacement of preexisting output directories. All game binaries and full recordings remain owner-supplied, outside research handoffs. No new GUI application features or React/Vite build asserted.
