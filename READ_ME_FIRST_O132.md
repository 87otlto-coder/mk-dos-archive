# O132 — Native-width MK2 scene layers

The extractor **must not treat the original 320-pixel camera view as the full scene**. O132 exports complete original packed floor planes (896 columns) for Tomb and Portal and every authenticated 80-color setup-local sprite mosaic AND all 29 original Tomb/Portal sprite streams at their uncut original dimensions in independent files. Asset indices and sprite opacity masks are kept separate from RGBA images for later restoration/animation work.

The **896×504 16:9 target is only an editing canvas reference**, not an already reconstructed whole stage. The stages' original inter-layer world positions, parallax rules and animation frame sequences are still unknown. Please do not flatten independent layers into a supposed complete scene or invent motion.

Read `CHECKPOINT_2026-10-12_O132_NATIVE_WIDE_SCENE_LAYERS.md`. To export from the user's own original files, use `tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py` with `--exe`, `--game-zip`, `--out`. Source-file SHA-256 validation is mandatory.

Status: Python exporter plus independent audit complete; browser floor decoder checked against Python; complete React build unverified. MK2 remains priority. Bot and Authentic Enhanced projects remain deferred.
