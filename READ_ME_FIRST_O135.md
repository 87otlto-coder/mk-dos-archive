# MK DOS Archive — O135 stage-effect coroutine research

This complete development-source archive continues the O134 work. The new evidence identifies scheduler counter/yield behavior and source-code bounded state updates in Tomb and Portal candidate effect functions. It **does not** identify sprite animation frames, fps, camera parallax or runtime activation. The original 115 exported PNGs are unchanged.

- Research producer: `tools/mk2_native_stage_palettes/trace_o135_stage_effect_coroutines.py`
- Independent verifier: `tools/mk2_native_stage_palettes/verify_o135_stage_effect_coroutines_independent.py`
- Regression tests: `tools/mk2_native_stage_palettes/test_o135_stage_effect_coroutines.py`
- Browser research decoder: `src/games/mk2/research/stageEffectCoroutineO135.ts`
- New standalone browser comparison: `scripts/run-mk2-o135-effect-coroutine-bridge.mjs`
- Primary report: `research_outputs/O135_STAGE_EFFECT_COROUTINE_EVIDENCE.json`
- Checkpoint: `CHECKPOINT_2026-10-12_O135_STAGE_EFFECT_COROUTINES.md`

The exporter includes static coroutine metadata in the `O132_SCENE_LAYERS.json` manifest; no original commercial EXE/GRA is packaged. Supply your original MK2.EXE and MK2 game directory/ZIP to run the reproducible scripts.

Next: investigate stage data-pointer targets, sprite bindings and independently verified time/activation paths before constructing stage animations.
