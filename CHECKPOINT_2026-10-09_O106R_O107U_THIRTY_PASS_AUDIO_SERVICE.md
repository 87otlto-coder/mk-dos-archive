# MK DOS Archive — O106R–O107U Thirty-Pass Audio Service Checkpoint

**2026-10-09 · Authentic original DOS MK2 · 30 source-backed passes · MK2 REMAINS OPEN**

## Research decision

Thirty bounded tests investigate the music filename construction, 11 actual game-code `INT 80h` call sites, native audio-driver binary entry stubs, the six exceptions to the indexed music marker convention, and three existing real-mode Sound Images bridge routines. Each pass has its own source-derived JSON evidence. **No event grammar, timed music sequence, game-stage animation, or new exact-full graphics resource has been promoted.**

## Findings that survived independent verification

1. **Sound-service request surface.** Eleven `CD 80` instruction sites exist in the qualified MK2 executable game-region code: `0x814C5`, `0x814CD`, `0x814D1`, `0x814D5`, `0x81517`, `0x815BA`, `0x8671F`, `0x86725`, `0x8672B`, `0x86731`, and `0x8674E`. The locally established AH requests are 9, 7, 3, 3, 4, 19, 18, 18, 18, 18, and 7. The AH=4/AL=1 request after successful DOS file close is the bounded music-load handoff. This is a **call-site qualification, not identification of the handler**. Four more raw `CD 80` byte matches elsewhere in the DOS/4G executable are not included in the qualified game-region call-site set.
2. **Native driver entry-stub structure.** The authentic `SCC.BIN`, `LAP.BIN`, `GRV.BIN`, `SBL.BIN`, and `AWE.BIN` all start with two 16-bit near `CALL` stubs: offset 0 returns through `RETF` (opcode `CB` at +3), while offset 4 returns through `IRET` (opcode `CF` at +7). In each file **both calls resolve to the same in-file target** (different addresses across binaries). This establishes two ABI-style entryways per driver, but no mapping from the music `INT 80h` request to any particular driver dispatch or event interpreter. Existing O94A independently links SCC/GMI to a separate PCM `.U8` sample-start path; do not conflate with the music handoff.
3. **Exact six non-indexed interior music markers.** The independent scan of all 165 music files reconfirmed 931 valid indexed offsets and exactly six additional interior `0x91`/`0x98` byte occurrences beyond the terminal markers: `pit2.mid`, `pit2.lap`, `pit2.gvs`, `pit2.sbl`, `pit2.awe`, and `animb.lap`. Every exceptional occurrence was preserved with its actual byte offset and local context, not guessed into an event grammar. One terminal marker per file accounts for the other 165 non-indexed marker hits.
4. **Five music filename branches.** The executable branches on exact hardware-selector values 1, 2, 4, 8, and 16 to append `.MID`, `.LAP`, `.GVS`, `.SBL`, and `.AWE`. The branch targets are confirmed by their conditional jump bytes. This does not automatically bind the suffixes to similarly named driver `.BIN` files.
5. **Real-mode bridge contracts.** `RM.DRV` +`0x0962` sends AH=`0x11` through an installed far API pointer as already authenticated in O94A; `RM.DRV` +`0x09B4` issues `INT 80h` with AH=`0x13` and checks BX against `0xFFFF`; `RM.DRV` +`0x09C0` reads the audio control field +`0x32` and applies a bounded integer transform. These contracts concern PCM and channel-query paths. They do not identify the AH=4/AL=1 handler or prove note events, tempo or timing.

## Pass grouping

| Passes | Count | Test |
|---|---:|---|
| O106R–O107B | 11 | Original game-region sound-service `INT 80h` callsites and AH/AL inputs |
| O107C–O107G | 5 | Original 16-bit BIN driver dual-entry local call targets and return modes |
| O107H–O107M | 6 | Six exceptional interior music marker byte positions and contexts |
| O107N–O107R | 5 | Five executable music filename construction branches |
| O107S–O107U | 3 | Independent real-mode `RM.DRV` PCM/interrupt bridge instructions |

## Independent verification and falsification

- Python producer creates **30 bounded original-byte evidence reports** and one combined ledger.
- **Independent Node.js verifier:** **2,693 checks / zero failures**, inspecting the original executable, original five BIN images, RM.DRV, 165 music files, and all 30 JSON reports. It reconstructs all 931 indexed references and all six exceptional interior markers without trusting producer-derived marker lists.
- **30/30 falsified reports rejected**. The negative suite changes the semantic content of each report, recomputes its ledger hash, and requires verifier rejection. Every pristine report passes after restoration.
- Earlier O105N–O106Q: **8,494 checks / zero failures**; O104J–O105M: **6,802 / zero**; O103F–O104I: **7,695 / zero**; O94A PCM independent verifier: **20 / zero**.
- Total new + selected regressions: **25,704 independent checks, zero failures**.

## Reproduction

```bash
python scripts/run-mk2-o106r-o107u-audio-service-thirty-pass.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o106r_o107u
node scripts/verify-mk2-o106r-o107u-audio-service-thirty-pass.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o106r_o107u
python scripts/test-mk2-o106r-o107u-audio-service-negative-controls.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o106r_o107u scripts/verify-mk2-o106r-o107u-audio-service-thirty-pass.mjs
python scripts/verify-mk2-u8-o94a-caller-trace.py "$MK2"
```

## Unresolved and next high-value research

- Identify the **AH=4/AL=1 `INT 80h` service implementation** or real-mode/DOS extender bridge into whichever native music driver consumes the loaded buffer; mere interrupt-call bytes cannot prove the handler's identity.
- Decode a real music event grammar only after an executable or driver consumer backs it; distinguish actual event/control bytes from accidental raw values.
- If the handler's code is outside accessible static fixtures, pivot to outstanding graphics/palette or bounded animation blockers instead of endlessly repeating sound-byte censuses.
- **MK2 remains open**: 110/124 exact-full indexed graphics resources; seven bounded fixed-identity animation witnesses; no new confirmed correct-color scene, animation or audio timing in these passes.
- Mandatory order remains MK2 → MK1 → MK3 → UI/usability → extractor.
