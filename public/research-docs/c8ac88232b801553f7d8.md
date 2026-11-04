# MK DOS Archive — O104J–O105M Thirty-Pass Audio Consumer Checkpoint

**2026-10-09 · Authentic original DOS MK2 · 30 / 30 source-native passes · MK2 OPEN**

## Summary

The authentic file-backed executable contains an actual hardware-selector-to-audio-extension filename constructor at physical offset **`0x81528`**. Five tested cases load a song-name pointer, copy a zero-terminated stem into a filename buffer, select `.MID/.LAP/.GVS/.SBL/.AWE` by *exact* selector values **1/2/4/8/16**, append the suffix and a zero byte. An unmatched selector returns before suffix append, not an automatic default. The direct DOS open/read/close code at `0x815CE`–`0x81604` and adjacent sound loader code are visible, but **this research has not followed a loaded musical event into a sound-driver event consumer or proved any playback semantics**.

### Verified executable bytes / boundaries

- Indexed sound-title pointer load `0x81528: 8B 34 85 8C 43 01 00` (runtime pointer table `0x1438C`).
- Target filename buffer `0x1375E`; zero-terminated stem copy loop at `0x81534`.
- Immediate four-byte extension selectors: `0x8153C: .MID` on global `[0x30138]==1`; `0x8154A: .LAP` on `==2`; `0x81558: .GVS` on `==4`; `0x81566: .SBL` on `==8`; `0x81574: .AWE` on `==16`.
- All five `JE` branches go to common append `0x81583`; unmatched last branch returns at `0x81582`. The appended filename is NUL-terminated.
- A separate routine `0x81621` writes `.U8` suffix. Do not conflate those nonmusic file names with the five music variants.

### Corroborated source-corpus findings

- The **165** native audio files (`33` named stems × `5` hardware formats) have **155** distinct complete SHA-256 payloads, grouped into **nine** exact-duplicate sets involving **19** files. `title.mid`, `title.awe`, and `title.gvs` are byte-identical. This is native-file deduplication evidence, not proof that the remaining versions have equivalent musical events.
- Body-level `0x91/0x98` occurrences across all 165 files are **1,102**: **931** authenticated trailing-offset targets (previous O104I), **165** trailing end markers (one/file), and **six** additional unmatched interior occurrences: `pit2` in all five formats (`98 10 ...`) and `animb.lap` (`98 00 9B 40 ...`). The six interior occurrences remain **unparsed commands/candidates**, not six additional named tracks.
- `0x90` and `0x99` show different byte-context patterns: e.g., `.MID` has 3,355 raw `0x90` occurrences with 3,342 followed by two low-7-bit bytes, while raw `0x99` occurs 12,367 times but only 9,794 have two low-7-bit followers. These are *raw byte tests*, not tokenization; instruction/event boundaries are not proven.
- `gmi.bin` and `scc.bin` are byte-identical. Candidate audio-driver name pairing `.MID→gmi.bin`, `.LAP→lap.bin`, `.GVS→grv.bin`, `.SBL→sbl.bin`, `.AWE→awe.bin` remains a **filename-only hypothesis**; no runtime loader binding has yet been established.
- The complete original body intervals, offset-framed segment checksums, opcode-byte distributions, variant-equality relationships and 5 native driver binaries are preserved in per-pass evidence reports.

### Thirty bounded studies

| Passes | Investigations | Qualification |
|---|---|---|
| O104J–O104N | Five native executable filename-selection branches; fixture existence and hashes | Verified code + source bytes |
| O104O–O104S | `0x91/0x98` marker-to-table-offset correlations across five variants | Verified; six extras held as unknown commands |
| O104T–O104X | Native complete-file SHA equality across variants per song | Verified 155 unique / nine duplicate groups |
| O104Y–O105C | Candidate `0x90/0x99/0x91/0x98` low-7-bit arity tests | Raw-byte evidence, **no event grammar** |
| O105D–O105H | Offset-anchored segment boundary hashes and byte distributions | Lossless profiles, no musical track meaning |
| O105I–O105M | Five candidate driver binary identity inventories | Exact bytes verified; loader binding **unproven** |

### Verification

- Independent Node verifier (does not import Python producer): **6,802 checks / zero failures**; reopens the authentic DOS executable and all 165 audio resources. Authenticates five hard-coded machine-code selectors and all 30 report payloads.
- **30/30 deliberate falsifications rejected**, and each original report restored byte-for-byte and passed.
- O103F–O104I music-structure regression: **7,695 checks / zero failures**.
- O102B–O103E renderer/audio regression: **27,504 checks / zero failures**.
- New independent + selected regressions: **42,001 checks / zero failures** (not counting deliberate falsifications).

### Reproduction

```bash
python scripts/run-mk2-o104j-o105m-audio-consumer-thirty-pass.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o104j_o105m
node scripts/verify-mk2-o104j-o105m-audio-consumer-thirty-pass.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o104j_o105m
python scripts/test-mk2-o104j-o105m-audio-consumer-negative-controls.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o104j_o105m scripts/verify-mk2-o104j-o105m-audio-consumer-thirty-pass.mjs
```

**Scope remains unchanged:** 110/124 MK2 exact-full indexed graphics, 14 held; seven bounded fixed-identity animation sequences; remaining color, audio event/timing, runtime driver, full scene activation blockers. MK2 research is not finished.

## Next useful target

Find the **producer/consumer chain for music data after DOS load** (buffer transfer, sound driver entry, `0x99/0x90` token context), distinguish whether the five extensions share a command language, and verify candidate event parses on held-out families. Do not assign tempo/BPM, melody, note or channel names without a proven driver contract. If stalled, move to runtime packed renderer/palette binding or unresolved GRA consumers. Research order: **MK2 → MK1 → MK3 → UI/usability → extractor**.
