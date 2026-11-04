# MK DOS Archive — Pit II research handoff through O226

**Date:** 2026-10-17. **Current source:** `MK_DOS_Archive_Source_O226_Pit_II_2026-10-17.zip`. **Companion research:** `MK2_Pit_II_O226_Research_Evidence_2026-10-17.zip`. **Predecessor O222**, entire inherited archive immutable and retained. **No modified original DOS commercial binary and no claimed full React/Vite build.**

Read previous project genealogy/master handoff in `MK_DOS_Archive_MASTER_HANDOFF_THROUGH_O210_2026-10-17.md` and checkpoints O210–O222. New work O223–O226 is strictly additive. Principles: original authentic executable and resources outrank visual hypotheses; observe-record-test-classify; verify original LE relocations, freeze original input hashes; distinguish source static code vs observed video vs inferred live hardware behavior.

## Major additions in this batch

| Milestone | Newly qualified facts | Important limit |
|---|---|---|
| **O223 — bridge animation timing** | Both background actors repeat at **exactly 21 frames** of the owner's 30fps clip (0.700 sec) on independent holdout ROIs. Original code uses **seven sprite poses** per loop, **six scheduler-count yield**, original PC PIT divisor **19,869**, conditionally 60.0524Hz; seven × six ticks implies **0.6994 sec**, closely agreeing. 4 mutation controls rejected, second run identical | User's earlier **50fps DOS presentation** GIF test remains correct; timer IRQ cadence may differ. Do **not** claim that runtime task traversal is conclusively one per interrupt or that 30fps is game FPS |
| **O224 — fatality rocky texture control** | Original **32-step** byte-indexed draw-selector program maps **60×12, 59×6, 58×5, 57×4, 56×3, 55×2**, with source count-1 scheduler yield and post-step cursor update. All six source graphic + location-script pointer pairs are original LE-relocated. All **seven special FALL sprites 54–60** have an original relocated palette field pointing to original **Pit 81-color EXE palette at `0x895AC`**. After texture loop, original code explicitly seeds source54 crack art in object creator. 9 tamper rejections, reproducible | Original 58 actually has five source steps even though O214 video sampled frames did not rank it first; no live cursor/state trace. Palette pointer ≠ captured DAC registers; crack source activation ≠ exact screen blend/draw order |
| **O225 — original tile grids, alias correction** | Original exact tile locations from three command lists: 96px grid 5×3 at X −48,48,144,240,336 / Y −80,16,112 (tiles 55,58,59,60); 80px 5×3 at X −40,40,120,200,280 / Y −24,56,136 (tile56); 64px 5×4 X0..256/Y0..192 (tile57). Pixel primitive periods: 55=96,56=80,57=64,**58=48**,**59=32**,60=96 per axis. Original sprite59 96×96 resource is nine pixel-identical repeats of 32×32; O214 phase `(16,80)` and original grid phase `(48,16)` are **EXACTLY the same original pixels**. 8 mutation controls, repeatable | Periodicity alias solved; doesn't prove world-to-screen camera transform for all states. Source58 still absent from independently sampled visible frames |
| **O226 — falling fighter source animation list** | Five-pose original source list **42→43→44→45→46** loops by source token1 + typed back-pointer; 3 source table references. Original impact pose **47** separately referenced. 6 mutation rejections, repeatable | O215 sampled 30fps video order 42,44,46,43,45,.. differs. Runtime list cursor selection/timing and impact state transitions not proven |

## Exact named reports, scripts and SHA-256

- `scripts/verify-o223-pit-bridge-timing-60hz.py` → `research_outputs/O223_PIT_BRIDGE_TIMER_AND_RECORDED_LOOP.json`, SHA-256 `3cce0d4ba54a700e96942d4bdc9c4488c2a12343036b528e4f19a98d8fb4dd15`.
- `scripts/verify-o224-pit-fatality-background-control.py` → `research_outputs/O224_PIT_FATALITY_BACKGROUND_SOURCE_TIMED_SEQUENCE.json`, SHA-256 `4c48227e4ea7dab813bd48ad021be000b40704a801e0c3a6d00c1e6b5c082b0f`.
- `scripts/verify-o225-pit-fatality-tile-grids.py` → `research_outputs/O225_PIT_FATALITY_SOURCE_TILE_GRID_AND_PHASE_EXCEPTION.json` (legacy filename: phase discrepancy itself actually RESOLVED), SHA-256 `d8dbfa9633ab0a900abfe526a2adf5f0d2aed667621f22921043d43de936560e`.
- `scripts/verify-o226-pit-falling-pose-list.py` → `research_outputs/O226_FALLING_FIGHTER_SOURCE_POSE_LIST.json`, SHA-256 `77cf60856a76b3b3395d355d629f2a0e93320a7688dd6573df7e758620589f3c`.

## Prior authoritative Pit II findings retained

- **O208** upper blue Pit stage independent of Kombat Tomb; six background setups and empirical parallax including approximately 8:1 movement setup relationship. Exact active mode, full compositing/camera remains unresolved.
- **O210–O216** lower fatality `FALL.GRA` 61 complete decoded original graphics; source55 rock and source60 descent established from video; O214 original Pit palette lower-scene RGB matching; O215 video poses; O216 masked crack54 strong placement `(104,44)` video witness.
- **O218–O219** original `BLOOD.GRA` sprite177 (14×9) matches five impact fragments; original EXE 48-color palette family `0x88918/0x8897A/0x889DC` is visually source-compatible with independent original allocator references, but live handle/DAC state unresolved.
- **O220–O222** both upper bridge distant fighters fully source-recovered as **two seven-pose loops** in `PIT.GRA`, with original animation list consumer and stage-root callback gate. Actual live mode activation/runtime exact scheduling not instrumented.
- **O209 bounded fatality hotkey gate:** NO-GO on executable patch; static dispatch preconditions unknown. External O209.2 keyboard macro separate, unused by supplied O210 footage.

## Remaining open questions (do NOT declare fully solved)

1. Original fatality script indexing and runtime screenshot contradiction for 58 (five original selector counts but no leading O214 clip match), selected active branches, actual grid runtime layering, and frame gaps from 30fps video.
2. Actual native task traversal/live timer behavior vs owner's 50fps presentation; verify exact ordering of original falling poses and impact transition with runtime trace if source-only analysis cannot resolve.
3. Original fatality dispatcher, stage finish prerequisites/branch and safe activation; do not patch guessed callbacks.
4. Original blood177 effect spawner, real palette handle/DAC state, crack source54 exact compositor/blend/placement and particle draw order.
5. Upper stage full original camera arithmetic/parallax draw order, actor object coordinates and game mode gate activation.
6. Winner/FATALITY lettering sprites, event timing, audio and any runtime world-state rules absent from decoded visuals.

## Recommended continuation

Start with **O227 source-only**: inspect original `0x805A6–0x8079F` loop's upstream caller(s) and in-flight draw object disposition; reconcile source steps vs 30fps captured textures using *measured frame holds and source code*, with an explicit stop gate if memory visibility is required. Alternatively trace source 42..46 five-pose loop's actual interpreter and task schedule; preserve distinctions between source order and captured-frame order.

No higher-frame-rate user footage requested yet. If a controlled live DOSBox memory/instruction trace or raw native 50fps capture is truly required, request a narrowly described, safe recording only after exhausting source-only evidence. Keep future passes small and ZIP-checkpoint after each.
