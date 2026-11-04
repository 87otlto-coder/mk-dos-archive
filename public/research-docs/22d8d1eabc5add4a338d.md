# O134 — MK2 stage initializer and behavior-function references (2026-10-12)

## Why this investigation

O132 preserved the full uncropped Tomb/Portal floor and sprite sources. O133 located nine signed fixed-point movement-source channels. **Stage animation must not be flattened into the backdrop or invented from repeated-looking sprites.** This checkpoint explores a different executable mechanism: stage-root initialization functions and pointers passed by those functions to a common registration-like helper.

## Confirmed, file-backed observations

1. The scene loader at **physical `0x81F41`** reads and calls an initializer pointer from **stage root +`0x10`**, before loading the nine-word motion-source pointer at root +`0x14` and the control-stream pointer at root +`0x18`. It is not sound to treat this callback as the selected motion transform without more evidence.
2. Across the **first ten stage configuration indices (0–9)**, all three O125 mode candidates for each index contain an identical relocation-backed initializer pointer. That yields ten distinct stage-associated function entry points, including **Tomb physical `0x82CD7`** and **Portal physical `0x8272A`**. No runtime mode or activation has been observed.
3. Both Tomb and Portal initializer entries contain a conditional test of Object-2 mode global `0x3014C` against zero; consequently not every invocation necessarily follows the same setup path.
4. The Tomb initializer contains **two source instruction sites** that place `6` in EBX, put a relocated original Object-1 function pointer in EDX, and call physical `0x67222`. The registered function targets are **`0x82D9A`** and **`0x82D33`**.
5. Portal has **three corresponding sites in its initializer plus one in a nested helper**, for **four distinct instruction sites**. Their original code targets are **`0x828FF` (listed twice), `0x8291F`, and `0x8280C` (nested helper)**. Its initializer calls the helper at `0x827DF` twice; that helper writes three fields at offsets **`+0x54`, `+0x58`, `+0x5C`** of an allocated/returned object.
6. Both the producing tracer and the independently implemented verifier authenticate source bytes, all 30 stage-root callback pointers, and the six callsites. The verifier additionally reparses the original **LE relocation streams** to check typed reference provenance. **260 independent assertions passed**.

## What this DOES NOT establish

- The `0x67222` helper's full runtime semantics, whether the listed functions are executed in the user's fights, or how many times they are called.
- That each registered routine is an animation sequence, its frame count/order, duration, loop/ping-pong behavior, sprite-to-routine identity, or event trigger.
- A complete layer ordering, parallax movement factor, camera variable, stage world extent, or complete 16:9 composite.

The count above is of **source code registration sites**, not guaranteed live objects or actual animations. Stage animations and moving objects may exist elsewhere; this is explicitly not an exhaustive inventory.

## Export integration

`export_o132_scene_layer_pack.py` adds `sourceBehaviorCallbackCandidate` to each Tomb/Portal stage manifest. This is only immutable, source-derived **candidate behavior pointer metadata**, with animation, timeline, runtime, sprite-binding and parallax properties set to `null`. The original 115 uncropped PNG assets (floor, distinct original sprites, indexed/mask planes and setup-local layers) are **byte-identical** to O133.

`verify_o132_scene_layer_pack_independent.py` rechecks every added pointer/callsite from the original executable and rejects falsified timing or animation claims. A new independent browser module and read-only stage-viewer diagnostic expose these pointers without simulating them. The React app build remains unverified; module isolated typechecking and browser/Node parity pass.

## Verification

- **24** new O134 source tests passed (including forged evidence and unsupported-claim rejection).
- **44** full-width O132 exporter tests passed (including five new O134 metadata tests).
- **93** inherited O130/O131/O133 tests passed.
- **56** O134 browser/Python parity checks passed; **40** inherited O133 parity checks passed.
- **115/115** O133 PNG files byte-identical to O134 outputs; an independent PNG decoder/source verifier examined 78,848 floor indices and 939,425 sprite/mask pixels.
- Original EXE/GRA file fixtures remain outside the development source archive; no original assets modified.

## Next bounded investigation

Trace the registered Tomb/Portal function targets `0x82D9A`, `0x82D33`, `0x828FF`, `0x8291F`, `0x8280C` through their own instructions and referenced descriptor tables. Attempt to establish **real source-linked animation frame order and timing** rather than grouping visually similar sprites. Keep potential movement callbacks, animation frames, and camera parallax in separate export fields until verified. No DOSBox run is necessary to confirm O134's static findings.

## Reproduction with a user's original game

```sh
python tools/mk2_native_stage_palettes/trace_o134_stage_behavior_callbacks.py --exe /your/MK2.EXE --out /new/O134_CALLBACKS.json
python tools/mk2_native_stage_palettes/verify_o134_callbacks_independent.py --exe /your/MK2.EXE --report /new/O134_CALLBACKS.json
python tools/mk2_native_stage_palettes/test_o134_callbacks.py --exe /your/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o134-stage-behavior-bridge.mjs /your/MK2.EXE /new/O134_CALLBACKS.json
```
