# O129 — Source-backed control-stream origins and token dispatch

**2026-10-12 | MK2 only | one focused checkpoint | no DOSBox execution**

Canonical source: original 861,133-byte `MK2.EXE`, SHA256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. This finding is a **static provenance graph**, not a gameplay trace or discovery of the active stage setup, camera, palette handle or DAC bank.

## Main finding

The control loop at physical `0x93547` reads a cursor from Object-2 `0x75A98`. Code at `0x93500` copies the current pointer from Object-2 `0x75CF6` into that cursor. Original instructions support four branches:

| Original token | Handler | Verified consumption |
|---|---|---|
| `0` | Exit loop at `0x935AA` | 4 bytes |
| Positive signed DWORD | Load a following Object-2 pointer; call `0x93390` using token as EBP | 8 bytes |
| `-1` | Dereference first following pointer for ESI; read EDI and EBX; call guarded packed renderer `0x9E118` | 16 bytes total (token + three DWORDs) |
| Other negative signed DWORD | Conditional helper `0x938CA`, depending on runtime mode `0x3014C`; repeat loop | 4 bytes before call |

The `-1` command's renderer call still requires **bit 0 at Object-2 `0x562D4`**, as verified in O128. This source-verified command layout makes it possible to recognize a genuine packed-row command **if a live command stream is observed**, without inventing a complete on-disk command grammar.

## Three authenticated fixed control lists

These lists are written directly to `0x75CF6` by `MOV EAX, immediate; MOV [0x75CF6], EAX`, with both operands backed by original LE type-7 relocations. Every entry is a typed **Object-2 pointer pair** and every list ends in one zero DWORD.

| List start (Object-2) | EXE setter sites (physical) | Positive pairs | Terminator (Object-2) | `-1` token |
|---|---|---:|---|---|
| `0x13CEC` | `0x80191` | 10 | `0x13D3C` | None |
| `0x1410C` | `0x805C5` | 4 | `0x1412C` | None |
| `0x15D60` | `0x84C91`, `0x9882E`, `0x98A4B` | 10 | `0x15DB0` | None |

**Crucial distinction:** the absence of `-1` in these *three fixed lists* **does not imply the renderer cannot be called in gameplay**. At `0x81F55`, the original program also reads an unknown DWORD from another runtime input stream and stores it into `0x75CF6`. That dynamic value can point somewhere other than the three authenticated immediate lists. Some of these static lists are additionally referenced from setup data structures. The provenance of **all** possible dynamic stream targets and their activation is not established.

The trace verifies **nine** original LE type-7 references to the stream-pointer global `0x75CF6` (including a data reference), and every pointer pair in the three fixed lists. These references are not execution counts.

## Code, reproducibility and security boundaries

- `tools/mk2_native_stage_palettes/trace_o129_control_stream.py`: canonical-EXE-only, fail-closed source tracer. Emits source report without modifying the EXE.
- `tools/mk2_native_stage_palettes/verify_o129_control_stream_independent.py`: independently parses 27,004 original LE fixups (using the independent O120 parser), rechecks original opcode bytes, typed list entries and source-provenance qualifiers; does not import the O129 producer.
- `tools/mk2_native_stage_palettes/test_o129_control_stream.py`: 24 tests, including forged pointer pairs, opcode semantics, source identities and false runtime claims.
- `src/games/mk2/research/stageControlStreamsO129.ts`: strict original-EXE-only browser decoder for the same three bounded lists.
- `scripts/run-mk2-o129-control-stream-bridge.mjs`: independently compares the browser list data with the Python report.
- `src/components/MK2IndexedStageMosaicsO122.tsx`: read-only explanation distinguishing fixed lists from dynamically loaded control streams.

All source tools accept **the user's original commercial game executable as input**; the development package contains no original game executable. The 50-pass figure is a ceiling, not a quota; O129 counts as **one** substantive verified checkpoint.

```bash
python tools/mk2_native_stage_palettes/trace_o129_control_stream.py --exe /path/MK2.EXE --out /new/O129_REPORT.json
python tools/mk2_native_stage_palettes/verify_o129_control_stream_independent.py /path/MK2.EXE /new/O129_REPORT.json
python tools/mk2_native_stage_palettes/test_o129_control_stream.py /path/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o129-control-stream-bridge.mjs /path/MK2.EXE /new/O129_REPORT.json
```

## Next high-value investigation

Locate concrete original source inputs to the dynamic `0x81F55` writer, then trace the associated data/command roots. If static evidence no longer resolves which stream reaches `0x93547` during a fight, instrument the emulated runtime at the read of Object-2 `0x75CF6`, the `-1` command branch and the guard at `0x9E118`. The specific watchpoints can be defined from verified code offsets, but their emulator runtime address mapping remains a separate task. **Do not guess emulator physical addresses from on-disk file offsets.**
