# MK DOS Archive — O171–O176 original MK2 animation continuation and Tower browser parity

**Date:** October 13, 2026. **Authoritative source checkpoint: O176.**

**Evidence scope:** canonical original `MK2.EXE` (861,133 bytes; SHA256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`), separate original `RM.DRV` (2,522 bytes; SHA256 `87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546`), original `TOMB.GRA`, `PORTAL.GRA`, and `TOWER.GRA` supplied by the user. All offsets below are physical *source file* positions unless labeled Object-1 or Object-2 relative. **No DOSBox run or live gameplay timings were captured in this continuation.** Commercial game files are inputs only and never bundled in release ZIPs.

## O171 — Ten-way alternate animation command interpreter

The alternate reader at original `MK2.EXE:0x63E79` is called from the `0x64388` branch when render-object flag `+0x34` bit 1 is set. The original code checks for token zero, admits tokens `0–9` at `0x63E8E`, multiplies by four and uses an original **ten-entry LE-relocated jump table** at Object-2 relative `0x07A4` (physical `0xA13F8`). The source table pointer has its own LE type-7 relocation; all ten table entries are LE type-7 relocations to Object-1 handler offsets, independently re-decoded from the original 27,004 fixups.

| Token | Original physical handler | Direct instruction behavior, not a proposed safe compiler operation |
| --- | --- | --- |
| 0 | `0x63EA3` | Return (without explicitly setting carry at this instruction) |
| 1 | `0x63F00` | Read next DWORD as an indirect stream cursor target |
| 2 | `0x63F11` | Call `0x642C5`, continue reader |
| 3 | `0x63F1B` | Consume one signed 16-bit operand, invoke `0x6441B` with zero secondary operand |
| 4 | `0x63F36` | Consume two signed 16-bit operands, invoke `0x6441B` |
| 5 | `0x63F5F` | Consume DWORD, invoke `0x640DF`, then set carry and return |
| 6 | `0x63EEB` | Consume DWORD, indirect `CALL EAX`, continue |
| 7 | `0x63ED6` | Consume DWORD, call `0x8140E`, continue |
| 8 | `0x63EB7` | Consume unsigned 16-bit operand, call `0x7CF84`; based on carry, follow or skip next DWORD |
| 9 | `0x63EB0` | Call `0x642D8`, continue |

Values greater than nine reach helper `0x640DF` and a carry-cleared return. **Important:** indirect callbacks and pointer jumps mean this source command grammar cannot safely be interpreted as a universal static list codec without validated entry context or execution. It is not the same grammar as the simple six recovered effect-frame lists.

## O172 — Original normal effect-stream flags and termination

The normal reader `MK2.EXE:0x86CC5` advances Object-2 global cursor `0x75A78` by DWORDs and classifies descriptor-like pointers using high-bit mask `0xFFF00000`. In its special-control branch it constructs `0x00020000 | uint16(token)`, checks equality against the token, clears bit four from `0x75A68` and ORs in the original low-16-bit command. It then resumes stream processing. Thus not all DWORDs in this reader mean drawable frames. The concrete descriptor consumer remains at `0x9377C`.

The same source contains explicit `1`/back-pointer rewind and `0`/carry-flag exit paths; this independently reinforces O169's *four looping and two zero-terminated original lists*, but says nothing about their elapsed seconds or live activity.

## O173 — Rendering traversal reuses the ordered object link

At original `0x665D4..0x66631`, insertion compares signed render-object DWORD `+0x20` first, then signed `+0x1C`, and inserts into a `+0x00` linked chain in ascending key order (ties inserted before existing item). Positive-token stage rendering reaches the iterator via `0x935A1/0x935A3`, which traverses the **same `+0x00` field** at `0x93390`. That proves a connection between *insertion link and within-list traversal*, not full multi-list raster ordering.

Crucial caveat: the render iterator itself can add object velocity to the **mutable** `+0x18/+0x1C` position words when global gate `0x75A88` permits. Thus the original insertion sort cannot guarantee the current list remains position-sorted after movement; it cannot establish total depth, occlusion or final on-screen placement.

## O174 — Original IRQ8 modifier-qualified phase resets

The driver at `0x081C` branches past all P/M/S phase logic if the Alt table entry `+0x88` is zero/negative. The phase words at `+0xE4`, `+0xE6` and `+0xE8` initialize to `0xFFFF`; eligible pressed states increment each 16-bit word, and only **an overflow to zero** toggles its associated byte `+0x3C`, `+0xEA` or `+0xEB`.

A reset to `0xFFFF` occurs when the associated key is not positively pressed **while the Alt condition is still eligible**. If Alt becomes ineligible first, the source jumps directly to `0x08A8` without executing the per-key reset branch. Pure source-arithmetic model: first eligible handler after `0xFFFF` toggles; an uninterrupted hold requires a further 65,536 eligible invocations for another toggle. These are **counts of eligible IRQ handler visits, not wall-clock seconds**. The `+0x3C` status remains the previously established scheduler counter gate. Neither source case verifies actual user-visible hotkeys under all modes.

## O175 — Source-derived emulator capture preflight

A standalone, independently checked JSON contract identifies relative instruction offsets in original MK2.EXE Object-1 and in the original real-mode driver. It requires the user to discover and record the **actually installed** IRQ8 segment/offset from the emulator and the **runtime-loaded Object-1 mapping** before setting breakpoints. This avoids the frequent mistake of using EXE physical offsets as runtime addresses.

Recommended runtime observations: handler entry `RM.DRV:0`, actual timer code `+0x07EE`, gate `+0x08A8`, conditional increment `+0x08AF/+0x08B5`, keyboard mode and phase fields `+0x3D/+0xE4`, original input counter `+0x24`; protected scheduler read/clear `MK2.EXE:0x670E3/0x67101`, task countdown `0x67158`, descriptor mutation `0x937D3`, and presentation (`0x65420` path). Track stage identity, task/object IDs, frame indices and monotonic wall-time separately. **No runtime mapping, sampled timing or gameplay capture was fabricated by this tool.**

## O176 — Original Tower effects now available in the browser-side decoder

The existing `stageOriginalEffectFramesO136.ts` extends the strict original canonical EXE/GRA decoder to **Tower's separate seven original source frames** (stage `tower`, source list Object-2 `0x16490`, resource ID 30, SHA256 `7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8`). The conditional Tower stage setup links the counted 80-color record at physical `0x89468` via the setup/pointer table, as independently established by O137. The TypeScript renderer uses the *source-linked candidate palette* and makes **no runtime palette allocation or DAC claim**.

The original stage viewer now optionally loads `TOWER.GRA` when present in the user-selected directory and offers its original frames beside the selected Tomb/Portal sequence, with stage labels and explicit palette limitations. No Tower whole-stage scene reconstruction, FPS player or flattening is added. Original EXE/GRA are read-only; selected Tower frame PNG can be exported individually. Users can still load Tomb/Portal without `TOWER.GRA`.

**Verified browser/Python parity:** 86 independent comparisons of seven Tower frames against the already independently verified O137 Python source manifest, including original dimensions/XY, descriptor identities, encoded byte bounds, palette indices, opacity masks and source-candidate RGBA SHA256. Eight O176 browser negative/identity tests reject modified inputs, cross-resource confusion and false palette qualification. Original Tomb/Portal browser/Python parity rerun: 423 comparisons passed.

## Verified regression and source checks

| Group | Independently checked source assertions | New adversarial tests |
| --- | ---: | ---: |
| O171–O173 | 86 | 25 |
| O174 | 40 | 20 |
| O175 | 27 | 17 |
| **Total new static source checks** | **153** | **62** |

All new independent verifiers run separately from their producer. The inherited O139–O170 regression families reran (173 test methods), giving **235 passing Python test methods** through O175. Inherited independent O166–O170 verifiers also reran (125, 70, 28 assertions respectively). O176 adds 86 TypeScript/Python comparisons, 8 TS negative cases and retains all 423 previous O136 comparisons; TypeScript/JSX transpile syntax checks passed for the two changed source modules. A full React/Vite build is **not claimed**; `node_modules` are unavailable in the execution snapshot.

Earlier browser source-archive PNG assets remain byte-for-byte unchanged; the full original 158-PNG plus index/mask export was not regenerated or altered in this work. The original commercial executable/driver/resources are **not** included in development release ZIPs.

## Reproduction on user's original source files

```bash
EXE=/original/MK2.EXE
DRV=/original/RM.DRV
T=tools/mk2_animation_continuation
python "$T/trace_o171_o173_interpreters_order.py" --exe "$EXE" --outdir /new/O171_O173
python "$T/verify_o171_o173_independent.py" --exe "$EXE" --reports /new/O171_O173
python "$T/test_o171_o173.py" --exe "$EXE"
python "$T/trace_o174_original_keyboard_phase_model.py" --driver "$DRV" --out /new/O174_REPORT.json
python "$T/verify_o174_independent.py" --driver "$DRV" --report /new/O174_REPORT.json
python "$T/test_o174.py" --driver "$DRV"
python "$T/trace_o175_runtime_capture_preflight.py" --exe "$EXE" --driver "$DRV" --out /new/O175_REPORT.json
python "$T/verify_o175_independent.py" --exe "$EXE" --driver "$DRV" --report /new/O175_REPORT.json
python "$T/test_o175.py" --exe "$EXE" --driver "$DRV"
node --experimental-strip-types scripts/run-mk2-o176-tower-original-effect-bridge.mjs "$EXE" /original/TOWER.GRA research_outputs/O137_TOWER_SOURCE_FRAMES.json
node --experimental-strip-types scripts/test-mk2-o176-tower-source-hardening.mjs "$EXE" /original/TOWER.GRA /original/PORTAL.GRA
```

## Actual next input boundary

The central remaining questions—runtime scheduler frequency, first live effect activation, exact animation frame transition timestamps, loaded sprite object identities, final world/screen placement, framebuffer draw order and true Tower palette selection—require genuine emulator/real gameplay evidence. This environment had no DOSBox executable/debugger available, and no debugger captures were supplied. Do not claim a measured FPS, issue physical-file-offset breakpoints, or synthesize gameplay samples. The O175 contract narrows the requested next observation to a real debugger recording of one active Portal/Tomb/Tower fight with installed vector and loaded-code mapping.
