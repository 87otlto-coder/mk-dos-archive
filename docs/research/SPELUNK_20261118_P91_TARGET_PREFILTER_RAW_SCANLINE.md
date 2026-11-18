# MK2 spelunking — P91 target prefilter and DOSBox-X raw indexed scanline oracle (2026-11-18)

**Scope:** research-only checkpoint continuing P90/P91; no test execution, Windows game launch, emulator build, private artifact creation or modification of an accepted source branch. No commercial game files or extracted assets are included.

**Confidence:** original P91 and pinned DOSBox-X source inspection **VERIFIED STATIC**. Actual MK2 stage/mode reachability, framebuffer values, screenshot availability in the portable P91 executable, and screenshot/native-frame parity **UNKNOWN / VALIDATION PENDING**.

## Baseline

- P91 prepared portable capture kit at [Windows-only CI run 43753635156](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753635156); original MK2 Tomb mode-2 four-phase capture remains unverified in that checkpoint.
- Research built from [P91 native capture integration](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/docs/research/P91_NATIVE_CAPTURE_INTEGRATION.md), [P91 native adapter](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp), and [generation guard](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_generation_guard.hpp).
- DOSBox-X source pinned to upstream commit [029bd65c5dcc7cdc7f2e14e35278620d9707d969](https://github.com/joncampbell123/dosbox-x/tree/029bd65c5dcc7cdc7f2e14e35278620d9707d969).
- Previous notes cover CPU aperture semantics/observational read side effects and the distinction between logical framebuffer and VGA scanout. This note adds an **exact capture-control-flow issue** and a **pre-existing indexed scanline capture alternative**.

## Discovery A — target qualification occurs *after* potentially fallible full-frame sampling

**Source-verified code sequence:**

1. [`native_capture_adapter.hpp` lines 251-285](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L251-L285) recognizes a draw/present/post-present source window, calls `sample(ip,phase,*snapshot)`, and immediately hard-refuses on failure with `source/memory/list capture failure`.
2. Only *after* `sample` succeeds does it check `stage==1`, `mode==2`, and Tomb control-stream identity. If the guard is idle, a nonmatching target is ignored.
3. [`sample` lines 404-443](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/native_capture_adapter.hpp#L404-L443) reads both large virtual Object1/2 snapshots, maps the Object2-selected `0x7662A` buffer, and reads **64,000 bytes** before the caller's target qualification. Its ordered Tomb object-list validation is appropriately restricted to target mode, but the buffer read is not.
4. A candidate whose original source signatures are correct but whose pre-target buffer is invalid/unmapped/out of permitted RAM can therefore be refused before reaching the actual Tomb mode-2 target. This is a **proved source-control-flow possibility**; whether the original game ever supplies such a pre-target buffer at these boundaries is **UNKNOWN**. The broad capture may also cost needless host work for unrelated stage/mode events.
5. The standalone [C++ guard test](https://github.com/87otlto-coder/mk-dos-archive/blob/research/p91-native-observer-smoke/scripts/research/p91/test_native_generation_guard.cpp) starts with an already valid Tomb mode-2 event; it cannot prove earlier non-target candidate sampling is safe. The real Windows no-game adapter hook smoke and private launcher failure controls do not establish native MK2 pre-target traversal.

**Recommended conditional correction after the first original attempt:** perform a minimal, bounded Object2 target-identification read **before** full-state `sample`, then capture complete state only on a matching stage/mode/control stream. Do not silently skip target-state sampling failures or relax five-window executable identity. A source-only negative test should model (a) valid code windows / nonmatching mode / invalid buffer (ignore, not refuse), (b) matching target / invalid buffer (hard refusal), and (c) matching target / valid buffer (capture). This is a candidate, **not** a patch or passed test.

## Discovery B — the pinned DOSBox-X already has a scanline-derived indexed PNG capture path

**VERIFIED STATIC against `src/hardware/vga_draw.cpp`:**

1. [L7948-L7979](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L7948-L7979) selects distinct `VGA_DrawRawLine` handlers for M_VGA and M_LIN8, including chipset-sensitive chained access. [L1119-L1122](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L1119-L1122) copies the renderer's *indices* for a linear scanline. The normal RGB rendering path is distinct.
2. [L6149-L6169](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L6149-L6169) initializes a raw screenshot at the vertical frame event, and [L4025-L4032 / L4172-L4180](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L4172-L4180) accumulate scanlines through `VGA_DrawRawLine`, independent of a one-off CPU A0000 read.
3. [`SetRawImagePalette`, L5812-L5840](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L5812-L5840) prepares two 256-entry palettes for VGA: an effective/rendered palette from `vga.dac.xlat32` and an expanded raw DAC palette. This is exactly relevant to prior palette/scanout uncertainty.
4. [`WriteARawImage`, L5980-L6040](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L5980-L6040) writes a `PNG_COLOR_TYPE_PALETTE` file containing an ordinary PLTE palette and indexed pixels, with optional horizontal/vertical doubling ([L6057-L6076](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L6057-L6076)). [`WriteRawImage` L6093-L6101](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L6093-L6101) uses `.raw1.png`.
5. The mapper [`hardware.cpp` L1647-L1653 and L2313-L2317](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/hardware.cpp#L2313-L2317) registers `CAPTURE_RawScreenShotEvent` with action `rawscrshot`. Actual binding and C_SSHOT availability in the **packaged** P91 executable are not runtime-verified here; do not invent a human-readable key combination or claim the P91 portable kit exposes this.

**Research payoff:** This existing emitter is a potential *independent, index-preserving, renderer-scanline oracle* for a separately reached Tomb state. It is NOT equivalent to P91's draw-completion buffer: scanout samples successive lines, may use different pixel addresses/geometry, and is not automatically synchronized with P91's four-phase generation. Thus use it only with a known matching frame and record exact render mode/width/height/palette phase.

**Important secondary provenance caveat:** In [L6079-L6083](https://github.com/joncampbell123/dosbox-x/blob/029bd65c5dcc7cdc7f2e14e35278620d9707d969/src/hardware/vga_draw.cpp#L6079-L6083), DOSBox-X invokes `png_write_end` **before** attempting to write the private `rPAL` chunk. `png_write_end` writes the terminal IEND, and the [W3C PNG specification](https://www.w3.org/TR/png-3/#5DataRep) requires IEND be the final chunk. Therefore a strict PNG parser should **not treat a trailing `rPAL` chunk as an ordinary valid pre-IEND ancillary chunk**. Some readers may ignore the extra bytes entirely; no actual raw screenshot was inspected. The ordinary PLTE and IDAT are earlier and remain the primary indexed-image evidence. Future research that needs the second raw DAC table should use a bounded, CRC-checked trailing-byte inspector with explicit nonstandard provenance, or obtain the DAC independently through P91; **do not rewrite the emulator or claim that raw DAC always survives ordinary PNG import**.

## Proposed evidence experiment — no need to change the accepted P91 capture kit

1. In an isolated *no-original-game* Windows DOSBox-X test, trigger `rawscrshot` in a controlled 320x200 indexed VGA mode. Inspect the resulting `.raw1.png` **by PNG chunk parser**, checking signature, IHDR, indexed color type, PLTE, IDAT, IEND, any trailing rPAL, CRCs, dimensions and all decompressed indices. Compare to a separately known deterministic rendered pattern.
2. Verify whether the actual P91 portable executable supports the feature; if not, run an independently pinned DOSBox-X build side-by-side, rather than rebuilding P91 just for reference imaging.
3. Only after first authentic Tomb mode-2 capture, perform a strictly controlled matching-stage/matching-frame raw-scanline holdout. Record display-start, panning, draw path and whether height/width doubling occurs. Categorize index differences by region rather than visually correcting. Never call rawshot a 'same-instant framebuffer' without a frame-identity witness.
4. Continue maintaining five separate fidelity axes: renderer buffer / CPU aperture / backing VRAM / effective palette / scanout. Preserve original commercial assets in private FIXTURES only.

## Final classifications

- **VERIFIED STATIC:** P91 target check follows full buffer sampling; DOSBox-X has a raw indexed PNG capture path in the pinned source; writer calls `png_write_end` before custom rPAL; PNG IEND is terminal.
- **INFERRED:** a pre-target drawing state may trigger a premature refusal; rawshot could be a practical independent comparison oracle; a typical decoder may discard trailing rPAL.
- **UNKNOWN:** whether MK2 exercises the pre-target problem; actual rawshot mode/dimensions/frame colors; whether the portable P91 binary exposes raw capture.
- **VALIDATION PENDING:** original-game run, no-game raw PNG test, P91 four-phase native packet, index-parity holdout, and any source patch.
