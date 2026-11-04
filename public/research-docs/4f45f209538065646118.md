# MK DOS Archive — O139–O144: original MK2 effect-task binding, advance routes, initial coordinates and list ordering

**Date:** 2026-10-12. **Scope:** original DOS Mortal Kombat II source executable, source-only static analysis, *not* a DOSBox runtime observation. **Input:** user-supplied canonical `MK2.EXE` (861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). **Prior authority:** O138 original sprite-list reader → per-object descriptor update.

Six focused passes O139–O144 were performed and **independently audited**. Each pass has a machine-readable provenance report and a separate source checker; all source reports are restricted to the canonical original EXE. These investigations add facts about how the already-exported O136/O137 sprite frames are used, without editing or re-encoding original assets.

## O139 — Effect task → specific render-object binding

- At physical `0x67222`, the scheduler allocates/links a task. It saves the render object pointer **EDI** into task field **`+0x18`** (`0x6726F`). Resume at **`0x67182`** restores EDI from the same task field. This carries the render-object identity across task yields.
- Portal initializer `0x8272A` uses the shared helper `0x827DF` twice with effect-list Object-2 pointer **`0x164B4`**. Tower initializer `0x82E38` calls that helper with **`0x16490`**, under mode-dependent setup code.
- `0x827DF` saves the supplied position-like argument to task `+0x54`, per-list context to `+0x58` and animation list pointer to `+0x5C`. The callback `0x8280C` loads the saved list from `+0x5C`, installs it as the stream cursor, and seeds the first sprite descriptor into `0x75A6C`.
- `0x8289C` calls sprite initialization (`0x64548` → `0x64522`), which writes the first selected descriptor into render object **`+0x3C`**, with related shape fields `+0x28` and `+0x2C`.

This is original code-linked *initial* sprite selection, stronger than simply recognizing an on-disk frame list. It does not establish runtime instance count or visibility.

## O140 — Original sprite-frame advance routes and scheduler counts

- The frame-advance helper `0x6435A` decrements a task counter at **`[ESI+0x40]`**, reloads it from **`[ESI+0x3C]`** when zero, and checks the next stream token. If the stream entry is nonzero and render object flags `[EDI+0x34]` bit 1 are **clear**, it calls the frame consumer `0x86CC5`. If the flag is set, it calls the **different** stream interpreter `0x63E79`; treating the two as identical would be incorrect.
- The direct sequence-runner `0x86C99` invokes `0x86CC5`, returns on the source zero marker, and otherwise yields via `0x6710F` using its caller-supplied count. `0x6710F` stores a scheduler count to task `+0x06`; `0x67158` decrements this count and resumes its stored continuation.
- Tomb flying A/B callbacks explicitly yield with count **6** and then call `0x6435A`; each initializes its countdown through `0x6433F` with **1**. Their original position-dependent loop conditions (thresholds 48/108) remain important: this is not an unconditional six-frame playback claim.
- Portal/Tower shared callback `0x8280C` initializes a countdown with **6**, yields with scheduler count **1** and then calls `0x6435A` during its bounded position-motion routine.
- Portal's seven-descriptor hanging sequence enters `0x86C99` with scheduler count **6**. Portal's six-descriptor electric sequence enters that driver with count **3**; its source callback also contains a separate two-count repeat condition.
- Six lists and all **43** original descriptor pointers, plus their source loop/zero terminators, were re-read and verified. The list-order metadata remains source order only, **not a measured FPS or display timeline**.

Do **not** convert scheduler counts to elapsed milliseconds, FPS, or guaranteed one-frame-per-yield durations until runtime scheduling is measured.

## O141 — Descriptor switching preserves an anchored object position

- At `0x93793` the consumer reads render-object descriptor field `+0x3C` and compares it to the next descriptor. Equal descriptors take a skip path (`0x93798–0x9379C`), leaving the descriptor reconfiguration untouched.
- For different pointers, the consumer calls the original transform helper `0x93846` on old and new descriptors, stores the new descriptor to `+0x3C`, and **adds** descriptor-dependent corrections to 32-bit position storage `[EDI+0x18]` and `[EDI+0x1C]` (`0x937E4`, `0x937E7`). This is **not an assignment of absolute source-frame positions**.
- The original render-position helper at `0x93809` uses those fields plus global transform storage. No complete world-to-camera position transform or occlusion behavior is established.

## O142 — Source initial effect object coordinate high words

The shared Portal/Tower creation helper saves an original packed immediate into task `+0x54`; on callback, `0x8289C` calls the original positional transform at `0x64A19`. This transform takes signed high/low 16-bit source halves, subtracts each arithmetic-shifted quarter, then writes the **resulting integer coordinate into the high word of two 32-bit object position fields** (`WORD [EDI+0x1A]`, `WORD [EDI+0x1E]`). This is a verified code sequence; it does not prove a rendered stage/world position.

| Source callsite | Stage setup | Original packed EDX | Object `+0x1A` high word | Object `+0x1E` high word |
|---|---|---:|---:|---:|
| `0x82737` | Portal object A | `0x005E0230` | 420 | 71 |
| `0x82755` | Portal object B | `0x005E0318` | 594 | 71 |
| `0x82E5D` | Tower object | `0x00630240` | 432 | 75 |

Object creation is conditional, the original list may undergo further transforms, and the same object may move afterwards. Treat these as **initial source-object field values**, never as screenshot-verified stage-effect placement.

## O143 — Original render-object list insertion order

At `0x665D4`, source code inserts the new render object (EAX) into a linked list by comparing **signed 32-bit field `+0x20`** first and **signed 32-bit field `+0x1C`** second. The original `JG`/`JL` comparisons yield lexicographically ascending key order, with equal-key objects inserted before the existing item. Objects are linked through `+0x00`.

Tomb (tail jump `0x82D2E`), Portal/Tower shared callback (`0x828C3`) and a Portal alternate object path (`0x828FA`) all reach the same routine. Context chooses the list head, such as `0x84340` or `0x84344`. **An ordered insertion list is not proof of the final pixel-raster rendering traversal or occlusion.** In particular, the field `+0x20` is a verified comparator, not a proven artistic layer name.

## O144 — Original stage list coordinate normalization

Stage setup at physical `0x8020E–0x802A4` calls `0x8050B` for **six object lists** rooted at `0x84348`, `0x84344`, `0x84340`, `0x8433C`, `0x84338` and `0x84334`. Each selects a separate signed stage-offset word (respectively `0x84326`, `0x84322`, `0x8431E`, `0x8431A`, `0x84316`, `0x84312`).

The normalizer traverses the list via render-object field `+0x00`, **subtracts the selected stage offset from signed object coordinate high word `+0x1A`**, subtracts the separately loaded signed word at `0x842EA` from coordinate high word `+0x1E`, stores the adjusted words, and marks object bit 0 at `+0x34` through `0x64576`.

This proves that static object initialization values from O142 are **not final positions**. Actual runtime stage-source values and the relation to camera/viewports/parallax remain unknown. The order in which these initializations and normalizations happen in a live fight has not been measured.

## Verification performed

- **O139–O141 independent real-source audit:** **328** assertions.
- **O142 independent real-source audit:** **68** assertions.
- **O143 independent real-source audit:** **52** assertions.
- **O144 independent real-source audit:** **62** assertions.
- **Total new independent source assertions:** **510**.
- **New hostile regression suite:** **39** passing tests (corrupted source, forged timing/runtime claims, wrong positions, wrong stream links, wrong comparator keys, wrong stage-normalization roots).
- **Inherited O138 tests rerun:** **15 passed**.
- **Inherited O135 tests rerun:** **34 passed**.
- No change to original `MK2.EXE`, `*.GRA`, existing 115 stage-layer source PNGs or the existing 43 original effect-frame PNGs. No regenerated image is substituted into the app.
- The full React app build, actual DOSBox playback, object activation, live frame timing, current palette, final on-screen coordinates, true raster draw order and runtime parallax remain **unverified**.

## Output files

`tools/mk2_animation_continuation/` contains four canonical EXE source tracers, four separately coded independent verifiers and the 39-case hostile test suite. All six reports `O139_REPORT.json` through `O144_REPORT.json` are preserved in `research_outputs/`.

### Reproduction

```bash
python tools/mk2_animation_continuation/trace_o139_o141.py --exe /original/MK2.EXE --outdir /new/O139_O141
python tools/mk2_animation_continuation/verify_o139_o141_independent.py --exe /original/MK2.EXE --report-dir /new/O139_O141
python tools/mk2_animation_continuation/trace_o142_initial_spatial_inputs.py --exe /original/MK2.EXE --out /new/O142_REPORT.json
python tools/mk2_animation_continuation/verify_o142_independent.py --exe /original/MK2.EXE --report /new/O142_REPORT.json
python tools/mk2_animation_continuation/trace_o143_renderer_registration.py --exe /original/MK2.EXE --out /new/O143_REPORT.json
python tools/mk2_animation_continuation/verify_o143_independent.py --exe /original/MK2.EXE --report /new/O143_REPORT.json
python tools/mk2_animation_continuation/trace_o144_stage_position_normalization.py --exe /original/MK2.EXE --out /new/O144_REPORT.json
python tools/mk2_animation_continuation/verify_o144_independent.py --exe /original/MK2.EXE --report /new/O144_REPORT.json
python tools/mk2_animation_continuation/test_o139_o142.py --exe /original/MK2.EXE
```

## Next highest-value work

1. Trace actual renderer list traversal and stage/global position inputs to locate **concrete** sprite draw calls, preserving the distinction between sorting, normalized object position and screen viewport.
2. Identify the scheduler dispatch invocation frequency from original code; even with stronger static evidence, **runtime calibration against DOSBox** is required before declaring seconds per frame.
3. Extend verified stage-effect art and source-linked palette diagnostics to Tower in the browser stage UI; first independently build the React app in a complete dependency environment.
4. Keep independent original native layers and animation frames. A frame-order track is not the same as a continuously playing timeline. **No original game executable modifications or compiler claims** were made in O139–O144.
