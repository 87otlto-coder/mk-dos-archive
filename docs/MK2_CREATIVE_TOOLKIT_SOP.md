# MK2 Creative Toolkit — active development SOP

**Approved direction: 2026-11-21.** This document supersedes earlier *priority and scope* instructions, not the factual results in historical checkpoints. [PROJECT_STATUS.md](../PROJECT_STATUS.md) is the running status record. The legacy research workbench remains preserved.

## Mission and game lock

Build a usable **Mortal Kombat II (original DOS) creative toolkit** for animated wallpapers, sprite and stage animations, playable sound effects and music, and convenient previews/exports. **MK2 is the only active game until MK2 v1 is accepted.** Preserve MK1/MK3 code and findings; do not start their research, migrations, UI or tests unless required to keep shared code safe. After MK2 v1, prioritize MK1, then MK3.

The first deliverable is **Living Forest Wallpaper v0.1**: original MK2 artwork, five-source-layer composition where available, visually convincing palette, gentle smooth looping parallax, 320×200 native resolution, 30 fps, 10-second MP4, and a reproducible editable configuration/command. 1920×1080 and upscaling are out of scope; the user's nearest-neighbor upscaler is a separate project. No fighters/HUD are needed; environmental sprite animation is optional.

**One active deliverable at a time.** Do not switch to audio, another stage, another game, a new general-purpose UI, or P91 during the Living Forest milestone. Finish and visually review a real wallpaper, not just its decoder or test report.

## Ordered MK2 milestones

1. **Living Forest wallpaper:** deliver a playable loop and reproducible scene using existing O196/O197/O201/O202 assets and calibration. User reviews the actual output.
2. **MK2 audio:** integrate existing O94D **312 source-rate WAV effects** and O109C–O109H **165 playable MIDI representations** (33 scores × five device formats). MIDI timbres are not certified original hardware renderings; optional SoundFont audio is a labeled creative rendering.
3. **More stage wallpapers:** reuse the working compositor for Tomb and Portal and deliver at least three usable stage presets total. Do not gate them on framebuffer-perfect native reconstruction.
4. **Sprites and animations:** make supported MK2 character/effect/source sequences previewable with adjustable timing, sprite-sheet/PNG and practical animated video/GIF exports.
5. **MK2 v1 usability and acceptance:** coherent catalog/batch export, minimal discoverable preview workflow, repeatable Windows setup, documented limits, user-tested deliverables. Freeze v1 scope before beginning MK1.

These are **sequential deliverables**, not parallel research tracks. Revise their order only for an explicit user-approved product reason.

## Fidelity policy: protect source, allow creative presentation

- Preserve source indices, pixel data, original opacity, raw sound samples, source music events and provenance. Correct extraction/decoding is mandatory; guard against silent corruption and loss.
- Palette, placement, compositing order, camera amplitude, parallax, frame timing, looping, interpolation, and instrument substitution may be **creative choices** when native ownership is unknown. Keep original pixels/masks in separate assets and label approximations in scene/export metadata; never call them verified DOS runtime behavior.
- A wallpaper is successful when recognizable, watchable, cleanly looping, visually inspected and exported. It does **not** require native DAC ownership, DOSBox frame capture, exact runtime timing, per-pixel gameplay parity or authentic soundcard synthesis.
- Keep VERIFIED STATIC, VERIFIED RUNTIME, INFERRED, HYPOTHESIS, UNKNOWN, VALIDATION PENDING distinct in research; label any user-selected rendering values **CREATIVE**. Do not apply research-only evidence standards to creative compositions.

## Research and testing stop rules

- **Build first, investigate only a concrete deliverable blocker.** Reuse existing verified code and O-series evidence before writing a new decoder or spelunk. Record nonblocking uncertainties and continue.
- P90/P91 native capture, emulator instrumentation, memory analysis and exact framebuffer parity are **paused**. Resume only if a specific accepted product requirement cannot be met otherwise, with a small, time-bounded research question and user approval.
- Allocate effort approximately **75% feature/output, 20% targeted QA, 5% new research** as a planning guide, never as a reason to skip essential corruption/security checks.
- Test the changed decoder, asset boundaries, opacity/audio payload and export. Keep existing relevant regression suites. Do not rerun enormous forensic suites without a changed mechanism or a clear release gate.
- A sprint's definition of done includes an actual inspectable output (video, WAV, MIDI, images or usable preview), verification that it opens/plays and a reproducible command—not only passing tests or a research checkpoint.
- Iterate on visibly wrong output; stop refining once it is fit for the milestone. Do not invent fidelity claims to close a task.

## Workflow, custody and handoff

- Continue the current **headless MK2** implementation; preserve the legacy browser/research application. No architecture rewrite or new framework without a concrete product need.
- Work on focused, recoverable Git branches/commits. Consolidate periodically when changes justify it; five-pass reporting is **not** a requirement to undertake five investigations or to package source every pass.
- Windows workspace: `F:\Dev\MKEXT\SOURCE` (source), `F:\Dev\MKEXT\TOOLS` (tools), `F:\Dev\MKEXT\FIXTURES` (original games, extracted data, private renders/validation). Original commercial bytes, derived copyrighted exports, videos and secrets must never enter GitHub or CI artifacts.
- Follow existing Windows-only CI and artifact-retention rules in [AGENTS.md](../AGENTS.md); keep source-safe configuration, tests and documentation in GitHub.
- Start each sprint by reading this SOP, the current source branch and the last relevant handoff. State one deliverable, prerequisites and practical acceptance test. Finish with: **what the user can now use; proof of its output; remaining blockers; exact code checkpoint; next single milestone.**

## Chat-first creative stage reproduction and deferred UI

Use [chat-first scene workflow](CHAT_FIRST_CREATIVE_SCENES.md) when the user asks for source-based stage/wallpaper output inside ChatGPT. **Check already mounted private game fixtures and actual GitHub source before asking for uploads or moving execution elsewhere.** Reuse O132/O136 and proven scene renderers, produce a static candidate before animation, and inspect actual media. Never substitute AI artwork or public screenshots for DOS assets. Preserve an editable `scene.json` as the eventual UI's single source of truth; expose independent layer/camera, object timeline, wrapping, occlusion, pixel-sampling, palette and export controls when UI work is scheduled, **not now**.
