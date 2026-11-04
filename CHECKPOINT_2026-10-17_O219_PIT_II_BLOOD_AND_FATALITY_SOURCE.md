# MK DOS Archive — O219 Pit II fatality source effects and original blood-color record

**Date:** 2026-10-17. **Predecessor:** additive O217 research with inherited unmodified O210/O209.2 source. **Status:** original-source-linked video-reconstruction findings. **Not:** original game runtime trace, full fatality animation engine, finished Pit stage compositor, verified state-machine dispatcher, or production app feature.

## Current accurate position

O210 source/fixture replay passed: 61 original FALL.GRA decoded graphics tile 250,804 bytes exactly. O214 resolved new **ORIGINAL** intermediate lower-environment source backgrounds in authentic 30fps DOSBox recording: source 60 -> 59 -> 57 -> 56 -> 55 at capture frames 878–885, 886–888, 889–891, 892–893, and 894 onward, respectively. Source 58 did not appear in sampled qualified transition and its other roles remain unknown. Four spatial holdouts independently preserve each source choice with original palette-only rendering; source linked upper-stage `PIT.GRA` original 81-color record at MK2.EXE physical `0x895AC` also renders `FALL.GRA` backdrop. O215 identifies descending original body sprites 42, 44, 46, 43, 45, 46, 42 at the corresponding captured segments, with source47 impact independently backed by O210. O216 original masked FALL graphic54 aligns at (104,44) in the post-impact wall and improves tested RGB against shift controls, but original runtime drawing semantics remain unresolved.

O217 source-agnostic authentic-video temporal analysis measures independent little-actor movement on distant upper Pit bridge. Their original drawing resources, animation schedule and palette **remain unknown**; original six large `PIT.GRA` layers do not contain these actors. An attempted `MONKS.GRA` attribution was **rejected** because it's outside the verified resource filename pool and its DWORDs yield no opaque pixels under the established packed graphics grammar. Other formats/roles of MONKS.GRA remain unproven.

## O218: red debris from original source BLOOD.GRA, sprite177

The independently established O69 full-resource sprite census authenticates original `BLOOD.GRA` as source resource ID **9**, with **178** source graphics, exactly tiled. Original descriptor for final sprite **177** at physical `MK2.EXE:0xC1350` is a native **14x9** masked graphic, packed resource byte offset **111552**, and exactly **73 original opaque pixels** using source indices **36,37,42–48**. These source dimensions/indices are not visually guessed or cut from video.

In owner's exact Pit fatality video, source sprite177's original binary alpha layout independently fits **five** distinct red impact fragments at native screen coordinates **(108,80), (180,80), (198,116), (204,140), (108,140)** in 30.1, 30.3 and 31.0 s frames. Video red-pixel silhouette F1 across the five observed fragments is roughly **0.920–0.965**. Colors estimated *from ONLY one* original sprite177 occurrence (the 31.0s `(108,80)` fragment) predict the other four held-out placements with about **7.6–8.3/255** mean per RGB channel in the original 73 opaque pixels. Shift the same source sprite just **two pixels horizontally** and the mean error rises to about **34–35/255**. The source sprite identity and repeated position matching are therefore **strongly visually supported**. The runtime emitter, layer order and timing remain unverified.

**Read-only verifier:** `scripts/verify-o218-pit-blood-source.py`. Exact forensic report: `research_outputs/O218_BLOOD177_SOURCE_VIDEO_REPORT.json`.

## O219: independent original executable palette words for source BLOOD sprite177

Instead of only using estimated video colors, we tested original unmodified MK2.EXE palette records. A 48-color original palette record at physical **`0x88918`** and two nearby identical-for-used-indices 48-color candidate records at **`0x8897A`** and **`0x889DC`** reproduce the original blood sprite source indexed pixels at the five impact fragments with **10.87397/255** average held-out RGB error. Applying the WRONG ordinary 81-color Pit stage palette at `0x895AC` to the same blood graphic raises error to **67.64384/255**. These are original EXE values converted via the source renderer's indexed 15-bit-to-display model, not video-fitted color entries.

**Qualification:** These are three source color-compatible records under the original indexed sprite appearance; **do not promote a particular 48-color record into the proven runtime BLOOD.GRA palette handle, DAC bank, or active callback** without addressing the existing O110 palette-lifecycle and pointer-ownership questions. Original stage background shares the 81-color PIT palette; the blood effect demonstrably requires different source-colored rendering. This does not prove how/when game switches palette banks or indexes.

**Read-only verifier:** `scripts/verify-o219-pit-blood-original-palette.py`. Exact forensic report: `research_outputs/O219_BLOOD177_ORIGINAL_PALETTE_CONTROLS.json`.

## Reproducibility

On 2026-10-17, O218 and O219 verifier scripts were each independently rerun against owner original binary ZIP and recorded fatality video with *fresh* new output directories, giving **byte-for-byte identical JSON** on second run. Exact fixture SHA-256 controls: MK2.EXE `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, BLOOD.GRA `9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9`, FALL.GRA `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`, Pit fatality video `198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48`. New verifier scripts reject wrong fixture hashes and existing output directory.

```
python scripts/verify-o218-pit-blood-source.py --game-zip <owner-original-MK2.zip> --video <owner-151933-recording.mp4> --out <new-empty-O218-dir>
python scripts/verify-o219-pit-blood-original-palette.py --game-zip <owner-original-MK2.zip> --video <owner-151933-recording.mp4> --o218-report <O218-dir>/O218_BLOOD177_SOURCE_VIDEO_REPORT.json --out <new-empty-O219-dir>
```

All preceding source/research archive members inherited without modification. The game ZIP and video are private owner-provided inputs and are deliberately **not redistributed** inside research/source handoffs. No original EXE, `.GRA` asset or application UI changed, and no React/Vite full build was claimed.

## Remaining Pit II investigations — do not silently collapse these into “solved”

1. **Distant bridge actor animation**—original sprite source, descriptors, animation driver, palette, anchoring, occlusion; clips show real dynamic behavior. `MONKS.GRA` is not a verified sprite solution.
2. **Exact fatality engine state machine**, trigger preconditions, callback addresses and live control flow. O209's guarded three-pass first-gate remained **NO-GO for patching**.
3. **Full game-tick animation and camera arithmetic**, timing/transition keyframes and active PIT stage mode. A 30 fps video time sequence is not proof of internal tick sequence.
4. **Original draw/layer order** of fighter, temporary textures, source54 crack, BLOOD sprite177, other impact effects, HUD, lettering and winner text. These are individually qualified source assets but not a full source-proven visual compositing call chain.
5. **Runtime palette bank state and ownership**, particularly the palette-switch/lifecycle relationship between original PIT 81-color textures and original 48-color compatible blood palette records; source-only palette fit is not a DAC hardware trace.
6. **Other falling source58 uses**, exact camera switch arithmetic, original particle emitter schedule and source of any other visible blood/crack effects.
7. **Original combat/winner lettering and audio scheduling** through the entire fatalities sequence.

Next bounded investigation should prioritize (a) original executable references connecting distant bridge sprites to stage animation; (b) original PIT/FALL/BLOOD effect dispatch and palette lifecycle under a deliberately bounded control-flow scope; (c) instrumented game runtime if static analysis reaches a genuine evidence ceiling. No speculative game executable patch or fabricated animation should replace source evidence.
