# Chat-first MK2 creative scene workflow

**Status:** active delivery guidance, 2026-11-23. This complements [the MK2 creative SOP](MK2_CREATIVE_TOOLKIT_SOP.md); it does not replace previous verified source research.

## First discover what is already available

1. Confirm the **actual mounted files** in the active conversation/container. ChatGPT Project sessions can already have `mk2.zip`, `mk1.zip` and `mk3.zip` mounted. Do **not** ask the user to upload original DOS files again merely because an old transcript said assets were inaccessible. Check the current runtime and qualify the actual `MK2.EXE` and required `.GRA` source hashes.
2. Read the latest relevant repository source through connected GitHub. Confirm the source commit, branch, and actual committed files. Use the existing decoders; do not treat uncommitted handoff claims as installed code.
3. Look for existing private source-layer/animation packs. Reuse them only if their manifests and hashes qualify; otherwise run the already committed source extractors on the mounted original game ZIP.
4. If original bytes are actually unavailable, state the exact missing fixture or dependency. Never replace them with web screenshots, arcade-port sprites, AI artwork or reconstructed placeholders while claiming original DOS extraction.

## Minimal stage pipeline

**Original MK2 ZIP → verified source-backed layers and animation frames → editable scene recipe → inspectable static panorama → independently scheduled animations → GIF/MP4 → decoded and visually reviewed output.**

For **The Portal**, the existing verified tools are:
- `tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py`: full **896×40** indexed-derived floor; independent **896×176** and **320×168** setup-local source mosaics, native source sprites, index and opacity planes, palette associations and provenance. This exporter alone does not recover global composition placement.
- `tools/mk2_animation/export_o136_original_sequences.py`: **20 original Portal source frames** across `portal_swaying` (7), `portal_hanging` (7) and `portal_electric` (6). Source order is authenticated; exact runtime timing and object placement remain unqualified.
- `headless/wallpaper/render-forest.py` and `forest-scene-v05.json` on `feat/mk2-living-forest-wallpaper`: demonstrated fixed/wide framing, independent layers, per-object schedules, foreground occlusion and deterministic video export. Adapt the proven behavior rather than restarting a renderer.

An optional, separately supplied **Portal chat preparation helper** may orchestrate O132/O136 and create a provisional editable recipe. Verify that its source actually exists in the current checkout before invoking it; do not claim it has been committed to GitHub merely because it was delivered as a chat artifact.

## Scene package contract and uncertainty

Preferred **private** package: `source/` (original indexed-derived RGBA plus index/mask evidence), `animations/` (independent source-ordered frames), `scene.json` (asset paths, X/Y, visibility, draw order, movement, wrapping, animation start/speed, provenance/confidence), `preview.png`, `output.mp4` or `scene.gif`, and a compact validation manifest with source/output hashes and media properties.

- **VERIFIED SOURCE:** decoder bytes, original raw indices/masks, stage resource identity, authenticated source-frame pointers/order.
- **CREATIVE:** manually positioned layer origins, panorama extensions, screen framing, preview RGB adjustments, layer drift, object appearance schedule, frame duration and wrapping.
- **VALIDATION PENDING:** actual complete-stage match, unobserved runtime palette selection, full compositor draw order and true event cadence.

Build the **static image first**; inspect for seams, duplicate objects, missing scenery and incorrect occlusion. Use composition choices openly where necessary. Do not gate a creative export on original DOS framebuffer capture, P90/P91 or exhaustive emulator archaeology.

## Future UI (deferred, not a current task)

Preserve scene-recipe controls for: full-width/custom framing, camera enable/movement; layer enable, X/Y, draw order, opacity, movement mode (fixed/drift/wrap), speed/direction/amplitude; per-object visibility, position, animation source, start, duration, playback speed, loop/once and occlusion; palette/background; pixel-locked versus fractional compositing; canvas size, FPS and output format. The eventual UI should use toggles, precise sliders plus numeric inputs, dropdowns, timeline scheduling and saved scene presets, all backed by the same renderer-consumed JSON—not a separate rendering logic.

## Completion gate

Do not call a scene finished until it has a **real decoded media export** with verified dimensions, frame count, playable encoding, seam continuity, source provenance and visual inspection. If only source data or a floor is reconstructed, label it exactly as such and continue or report the blocker. Keep all commercial source bytes and extracted copyrighted images/video under private `F:\Dev\MKEXT\FIXTURES` or the active chat's private output, never in GitHub.
