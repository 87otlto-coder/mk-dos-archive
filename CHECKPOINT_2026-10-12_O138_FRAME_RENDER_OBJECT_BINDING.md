# O138 — Original effect-frame descriptor to render-object consumer

**Date:** 2026-10-12. **Scope:** original MK2 executable source-level control path; adds to O136/O137 source sprite-frame recovery. **No new DOSBox gameplay capture.**

The O136/O137 discovery established six ordered original sprite-pointer lists containing 43 distinct source frames across Tomb, Portal and Tower. O138 advances one step into the original executable's **consumer of those frame entries**:

- At physical `0x86CC5`, `mov edx,[0x75A78]` loads the current effect-list pointer.
- At `0x86CCB`, `mov ebx,[edx]` obtains the next raw entry; at `0x86CCD`, `add dword [0x75A78],4` advances to the next entry.
- Branch at `0x86D26` makes a direct relative `CALL` to function `0x9377C`; the original displacement was independently checked.
- At `0x93793`, the consumer reads the object's *current sprite descriptor* from `[edi+0x3C]`. `0x93796` compares it with `EBX` (next pointer) and follows a conditional reconfiguration path if different.
- At `0x937C4` the consumer clears an object control word at `+0x4A`; at `0x937CA–0x937D3` it updates sprite-related per-object fields `+0x2C`, `+0x28`, `+0x24`, and crucially **stores the selected descriptor pointer to `[edi+0x3C]`**.
- At `0x937E4` and `0x937E7`, the same path updates two object position fields at `+0x1C` and `+0x18`. This does **not** establish absolute world locations for an extracted sprite or runtime parallax.

The six source lists are re-read directly from the canonical EXE to establish that the previously exported 43 original descriptor pointers are the kind of data consumed by this path. This gives source-backed evidence that the lists are connected to actual sprite descriptor replacement logic—not merely uninterpreted pointer tables.

**Limits:** instruction execution and a particular animation's visibility in a fight have not been observed. No FPS, wall-clock timings, frame pauses, trigger rules or exact positions are derived. A conditional path may skip reconfiguration when the descriptor and mode are unchanged. Source list order is not proof of real-time sequence playback speed.

**Software:** `tools/mk2_animation_binding/trace_o138_effect_binding.py`, `verify_o138_independent.py`, `test_o138_binding.py`, and `research_outputs/O138_ORIGINAL_FRAME_TO_RENDER_OBJECT.json`. The verifier implements separate source opcode and pointer reads (68 assertions); 15 negative/positive regression tests passed, including wrong-source rejection and deliberately forged evidence.

The O137 full-width scene and original animation pack remains unchanged: it contains 158 original PNGs plus exact frame index and alpha planes. Source-level binding does not justify flattening frames into static stage layers or assigning invented durations.

**Next:** trace the object initialized as EDI, the sprite object instance's stage association, original effect-list advance timing and conditions, then corroborate any duration claim against DOSBox. Recover renderer ordering and parallax independently. Maintain the user's requested independent layers, original full-width assets and 16:9-authoring friendliness.
