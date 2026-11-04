# MK DOS Archive — O110D: executable-backed Probe and Acclaim intro cadence

**2026-10-09 · Original DOS Mortal Kombat II · Source-backed scheduler units · MK2 REMAINS OPEN**

## Important promotion: authentic script structure and scheduler-tick requests

The O110B resource investigation recovered 30 real 320×200 indexed LZW frames from `PROBE.GRA` and one image from `ACCLAIM.GRA`, but their timing was unknown. This pass locates both packed resource IDs and their actual in-executable normal-flow presentation loops.

- The executable's **original filename pool** identifies packed resource ID **0x2A = ACCLAIM.GRA** and ID **0x28 = PROBE.GRA**.
- At physical executable `0x98CBD`, the Acclaim routine requests packed resource `0x2A000000`, passes the loaded pointer to `0x98C45` (a palette-plus-image routine), and requests **100 scheduler ticks** from `0x6710F`.
- At `0x98CEC`, the Probe routine requests packed resource `0x28000000`, calls the image/palette parser `0x98C56`, then requests **100 scheduler ticks**. It then sets `ECX=0x1D` (**29 additional iterations**); each iteration invokes the same image/palette parser and makes a **one-tick scheduler request**. A final **100-tick** request follows the 29-iteration loop.
- `0x98C56` itself calls genuine LZW decoder `0x627A4`; `0x98D0C` and `0x98D35` save the consumer's returned next-pointer for sequential frames. This joins the *original playback-side image consumer* to O110B's byte-for-byte resource frame series. No external image-timing guess is necessary to establish its bounded scheduler request sequence.
- The `0x6710F` implementation stores the requested `AX` scheduler count at process `+0x06`, stores the resume address at `+0x1C`, while the scheduler decrements the count at `0x67158` and resumes via the saved callback. This validates the meaning of the constants as **scheduler counts** without claiming a clock frequency, vertical retrace ratio, or wall-clock FPS.

### Nominal Probe timing as scheduler ticks

For the normal, uninterrupted control path, letting display frame 0 begin at normalized tick 0:

| Frames | Normalized start | Nominal hold until next transition | Executable source |
| --- | ---: | ---: | --- |
| Frame 0 | 0 | 100 scheduler ticks | `0x98D07` decode; `0x98D19` wait 100 |
| Frames 1–28 | 100–127 | 1 scheduler tick each | `0x98D30` decode; `0x98D42` wait 1; `0x98D4F` loop |
| Frame 29 | 128 | 101 scheduler ticks (1 + final 100) | final iteration wait plus `0x98D56` tail wait |
| **Whole normal sequence** | 0–229 | **229 scheduler ticks** | 100 + 29×1 + 100 |

These are requested scheduler waits in one conditional code path, **not** measured gameplay frames or elapsed seconds. The game may yield, switch presentation modes, or branch elsewhere; live execution was not observed. The first and final holds are supported by straight-line code, not inferred from how an animation preview looks. Similarly, `ACCLAIM.GRA` has one decoder call and one requested 100-tick wait.

### Optional diagnostic preview

The separate `MK2_PROBE_SOURCE_CADENCE_DIAGNOSTIC_20MS_PER_TICK_O110D.gif` reuses all 30 independently decoded indexed source images and their existing RGB555 **candidate** palette. It chooses **20 milliseconds per scheduler tick solely for a portable viewer preview**, producing 2.0 seconds for frame 0, 20 ms for each frame 1–28, and 2.02 seconds for the final frame. GIF is not configured to repeat continuously. **20 ms is not asserted to be the game’s tick length**, and candidate palette RGB555 is not a DOS DAC trace.

The machine-readable `MK2_PROBE_ACCLAIM_NATIVE_SCHEDULER_CADENCE_O110D.json` stores every source frame index, original compressed header offset, normalized start tick, hold count, relevant call sites and source-pixel SHA256. Original `.GRA` bytes remain unchanged; the complete 31-image original-index export from O110B is still authoritative for decoded pixels.

## Independent verification and adversarial testing

- A separately authored Python verifier uses the original `MK2.EXE`, both original `.GRA` files and O110B's independently qualified indexed frame export, not producer-internal timing objects. It validates actual x86 `MOV`, `CALL`, `LOOP` and scheduler instruction bytes, packed resource name ordinals, native frame counts and source hashes, all 30 timeline events, exact diagnostic GIF centisecond frame delays, and **each of the 1,920,000 GIF RGB pixels** against the original image index and explicit RGB555 **candidate** color table. **1,920,211 checks; zero failures.**
- Four deliberate false evidence reports (wrong first hold, wrong source frame offset, wrong frame ordinal and omitted final hold) all rejected. The pristine state passed again after restoring files.
- O110B independent LZW/source image verification remains clean, 4,640,455 checks; O110C packed-stage viewport verifier 277,954 checks and PNG verifier 276,592 checks remain unchanged and passed in their own preceding checkpoint.

## Reproduction

```bash
python scripts/run-mk2-o110d-intro-timing.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110d
python scripts/verify-mk2-o110d-intro-timing.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110d/MK2_PROBE_ACCLAIM_NATIVE_SCHEDULER_CADENCE_O110D.json /tmp/o110d/MK2_PROBE_SOURCE_CADENCE_DIAGNOSTIC_20MS_PER_TICK_O110D.gif
python scripts/test-mk2-o110d-negatives.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110d/MK2_PROBE_ACCLAIM_NATIVE_SCHEDULER_CADENCE_O110D.json /tmp/o110d/MK2_PROBE_SOURCE_CADENCE_DIAGNOSTIC_20MS_PER_TICK_O110D.gif scripts/verify-mk2-o110d-intro-timing.py
```

## MK2 progress and continuation

- Both known source compressed intro graphics now have **consumer-backed source order and requested scheduler timing**. This does not give a general FPS for combat animations. A single scheduler unit is not equated with 1/60 second or any other wall-clock time.
- Seven mixed packed stage tails now have renderer-backed *conditional 320-pixel scanline projections* from O110C, but their real palette bank start, actual scene selection, final 320×200 composition and animation remain open.
- `CAVE`, `MONKS`, `FONTS`, `VFRAME` and `PLAYSTA` still have incomplete semantics/ownership despite lossless source exports. Source-indexed strict exact-full graphics classification remains **110/124**, alongside two recovered intro LZW resources in a separate format class.
- Font-to-TTF/OTF remains optional low priority. Basic/default and user-supplied soundbanks remain a future extractor requirement. Ignore DOSBox Sound Blaster configuration as requested.
- Priority order remains **MK2 → MK1 → MK3 → UI/usability → extractor**. Do not claim MK2 finished without actual palette/geometry and animation closure.
