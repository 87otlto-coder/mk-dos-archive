# MK DOS Archive — O107V–O108Y Thirty-Pass Sound Options and Driver Initialization Checkpoint

**2026-10-09 | Authentic original DOS MK2 | 30 bounded passes | MK2 REMAINS OPEN**

## Runtime observation supplied by user (not independently replayed)

User reports that a sound driver can be selected from MK2's options menu. In their DOSBox session, a Roland choice worked but Sound Blaster did not. These are firsthand observations, **not a diagnosis** of Sound Blaster software, DOSBox hardware emulation, port/IRQ/DMA settings, sound driver compatibility, or game-file integrity.

## Source-backed discoveries

1. The game has a persistent-in-memory active sound-selector global `0x30138` and a settings shadow copy at `0x3030B`. At code `0x9A9AD`, the active value is saved to the shadow; code `0x9AA82` reads the shadow, `0x9AA87` compares the values, `0x9AA8D` makes an **unconditional** short jump to the application path, and `0x9AAA4` stores the selected value back into the active global. A comparison is present but does **not** by itself prevent reinitialization on this path.
2. The options-apply code calls initializer `0x62DE4` at `0x9AAA9`, tests AL at `0x9AAAE`, and enters different conditional continuations for success and failure. The same initializer begins with a teardown/reset at `0x62DBC` and clears fields in a shared structure pointed to by global `0x3177C`.
3. Five executable initializer branches each test one flag (`1,2,4,8,16`), make a resource allocation request through `0x62C74` using the distinct constants `0x39000000` through `0x3D000000`, then call a shared setup routine `0x62C94` with the corresponding bit value. These are **initialization mechanics**, not decoded native driver ABIs, verified music-event handling, or proof of successful device initialization.
4. The separate music filename constructor `0x81528` compares the same active selector value `0x30138` with the same five literals and chooses `.MID`, `.LAP`, `.GVS`, `.SBL`, or `.AWE`. The DOS music-load sequence opens, reads, closes and issues `INT 80h` request AH=4, AL=1. That interrupt's actual music-event handler is **not** identified.
5. Five native files `SCC.BIN`, `LAP.BIN`, `GRV.BIN`, `SBL.BIN`, and `AWE.BIN` have source-byte-verified dual 16-bit entry stubs (RETF/IRET) targeting their respective shared internal subroutines. This **does not** independently prove the selected-bit-to-native-driver-file binding (even where names appear consistent).
6. A separate settings snapshot copies the other globals `0x30130`, `0x30134`, `0x3012C`, and `0x3013C` to their own shadow fields and subsequently restores them. It is invalid to treat all settings globals or all sound service calls as interchangeable.

## Passes and validation

| Passes | Count | Contract |
|---|---:|---|
| O107V–O107Z | 5 | Options setting snapshot and reapplication, with distinct audio-selector behavior |
| O108A–O108E | 5 | Five gated initializer branches and exact alloc/setup call targets |
| O108F–O108J | 5 | Five music suffix branches using the same hardware mask values |
| O108K–O108O | 5 | Five authentic driver dual-entry byte contracts, without runtime binding claims |
| O108P–O108T | 5 | Settings apply instructions, unconditional branch, active-global write and initialization guard |
| O108U–O108Y | 5 | Filename construction, DOS open/read/close and sound service request sites |

- 30 evidence reports in `evidence/mk2_o107v_o108y/` and a combined ledger.
- Separate Python source-byte producer and JavaScript independent verifier: **670 checks / 0 failures**.
- **30/30 falsification reports rejected**, including updated per-report ledger hashes. Pristine suite restored and passed.
- Selected earlier independent regression suites: O106R–O107U **2,693 / 0**, O105N–O106Q **8,494 / 0**, O104J–O105M **6,802 / 0**.
- New and selected regressions total **18,659 independent checks / zero failures**.

## Next targets and research boundaries

A. Establish when and how the initializer's downstream routine `0x62C94` activates one of the native drivers, if the receiver's implementation is available in authentic fixtures. Determine what observable result bits, errors and parameters mean before diagnosing any Sound Blaster failure.

B. Examine the actual `INT 80h` handler or DOS extender/service installation. Request AH=4/AL=1 remains **not decoded**. Consider tracing error states with a controlled Sound Blaster-vs-Roland DOSBox test using recorded audio-device configuration, but do not invent the user's DOSBox values.

C. If no source-backed consumer can be found, pivot to MK2 graphics/palette/animation closure. Do not conflate native sound-driver entry points, music-file suffix, emulator hardware names and actual playback success.

**Unchanged coverage:** 110/124 exact-full indexed graphics resources, 14 held; 7 bounded fixed-identity animation sequences. No new correct-color stage, rendered gameplay frame, note-event grammar, or audio timing claimed. **Mandatory order** MK2 → MK1 → MK3 → UI/usability → extractor.

## Reproduction

```bash
python scripts/run-mk2-o107v-o108y-option-driver-thirty-pass.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o107v_o108y
node scripts/verify-mk2-o107v-o108y-option-driver-thirty-pass.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o107v_o108y
python scripts/test-mk2-o107v-o108y-option-driver-negative-controls.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o107v_o108y scripts/verify-mk2-o107v-o108y-option-driver-thirty-pass.mjs
```
