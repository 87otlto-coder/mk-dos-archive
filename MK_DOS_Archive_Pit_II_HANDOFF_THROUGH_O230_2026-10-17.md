# MK DOS Archive — Pit II handoff through O230 (2026-10-17)

**Latest source checkpoint:** `MK_DOS_Archive_Source_O230_Pit_II_2026-10-17.zip`. **Latest evidence:** `MK2_Pit_II_O230_Research_Evidence_2026-10-17.zip`.

All earlier sources including full O226 remain byte-for-byte preserved. Research reports are additive. Original owner-supplied MK2.EXE, FALL.GRA, PIT.GRA, BLOOD.GRA and recordings remain unmodified. No binary patch or complete game renderer asserted. Use inherited `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O226_2026-10-17.md` for earlier history, stage identities and 50fps/60Hz distinctions.

## O227–O230 new milestones

| Pass | New source/video fact | Qualification |
|---|---|---|
| O227 | Fatality controller sets pose-counter repeat delay `3` via `0x6433F` (initial countdown `1`), calls `0x6435A` on each selector pass, with conditional interpreter `0x86CC5`/`0x63E79`. Before constructing each selected wall tile group, `0x80733` asks `0x86BB1` to remove object tag `0x070B`; subsequent graphics are tagged same ID. | Original executable code path/authentic opcodes; DOES NOT explain the absence of 58 from 30fps video or prove scheduler rate. 9 negative controls, 2 identical runs. |
| O228 | After crack/post-transition setup, code `0x806E6` explicitly creates resource-9 `BLOOD.GRA` sprite177 from original descriptor `0xC1350`; original relocated descriptor palette field `0xC135C` points to original **48-color EXE palette `0x88918`**. The spawner reads **11 original packed XY entries** from `0x13D70`, applies code `0x64A19` v−floor(v/4) to each axis, commits sprites. Five independent previously matched blood blobs exactly follow this coordinate model with a single common `(0,-4)` offset, unique among tested translations. Four other small original effect-list entries at `0x13DA0` also recovered, consumer relationship bounded. | Sprite identity/palette association/coordinates code VERIFIED; video alignment independent. 10 negative controls, 2 identical runs. Exact source cause of final `-4` not established. |
| O229 | At original recorded native 320×200 frames 895,903,930, **10 of 11** original EXE-positioned blood177 objects match original palette/index sprite with <16/255 MAE. Frame930 mean for ten visible is **10.694/255**. One expected slot `(192,44)` is obscured by blue **WINS** lettering, so cannot assert underlying render. Shifts `(0,0)`, `(±3,-4)`, `(0,-1)`, `(0,-7)` yield 0/11 matching patches vs 10/11 for `(0,-4)`. | Original source pixels and video matched; two identical runs. No exact palette register capture; no proof occluded sprite is rendered. |
| O230 | Independent source O225 96px rock grid original `(48,16)` vs video source55 `(48,12)` agrees exactly with all visible blood sprites' `(0,-4)` shift at settled impact capture frames 903,930. | Independent cross-layer screen displacement VERIFIED empirically; live camera/viewport implementation UNKNOWN. Early frames 894,895,896,897 show different best rock phases, so this cannot be generalized throughout transition. 3 tamper checks, 2 identical runs. |

## New exact output hashes

- `O227_PIT_FATALITY_POSE_ADVANCE_TILE_REPLACEMENT.json` SHA-256 `0dbba2ec1f31f65e68786a7706a3b57f338460d5b4d458103acee2bb2ecd8b2f`.
- `O228_PIT_BLOOD177_SPAWNER_PALETTE_AND_PLACEMENT.json` SHA-256 `c634b3b865d26e6643bcf6e597769999b06a8b6fcd2e5b62a36fdf71ebf71979`.
- `O229_PIT_BLOOD177_ALL_POSITIONS_VIDEO_TEST.json` SHA-256 `016e95d630f50f515807e4beeb96f59471a3718c3ec7ee4e7d6ee09c93f167fb`.
- `O230_PIT_SHARED_ROCK_BLOOD_VERTICAL_DISPLACEMENT.json` SHA-256 `0f5c7890595f7c14b79388f7c173158968df7dd7bbea5d8f4db138bde3d3bda7`.

## Priority remaining questions

1. **Graphic 58 vs displayed sequence:** original 32-step selector unequivocally uses original graphic58 on five steps, and O227 finds selected tile groups removed/re-created under tag `0x70B`, but O214 captured video never ranks 58. Source-steps-to-presented-frame mapping and any display gating still unresolved; neither 30fps sampling alone nor "unused" is supported. Need original task/presentation trace, controlled higher-FPS capture, or an independently proven original code-level suppression path.
2. **Falling sequence:** source 42–46 loop in actor-indexed stream and delay3 mechanism. Original 30fps sequence first five unique poses 42,44,46,43,45 (a stride-two traversal modulo five), but the executable's actual render/select state and task-countdown relation still unverified. Native 50fps presentation testing from Portal remains inherited fact, distinct from source timer divider ~60Hz.
3. **Fatality scene camera/viewport:** source-native post-impact common four-pixel displacement observed for both rocky backdrop and blood. Exact state variable/handler causing this, early intermittent phase shifts, upper stage camera parallax/draw-order not fully proven.
4. **Remaining effect objects:** four entries in original `0x13DA0` are source-linked; source54 crack placement and graphic58 exact runtime fate, blue WIN/FATALITY title and blood occlusion draw order need further specific checks.
5. **Fatality trigger dispatcher** remains O209 NO-GO on patches. Stage/root initializer addresses are not safe dispatch entry points. Audio, complete winner display and live DAC state unresolved.

Avoid expanding to arbitrary games, broad implementation, generic hotkeys or invented animation formulas. Continue bounded static byte-level investigation with verified original owner fixtures and independent negative tests. If no source-only route can determine frame presentation/active states, request a narrow 50fps native recording or DOSBox debugger/memory trace; don't assert a solved renderer.
