# MK DOS Archive — O267/O268 Pit II Live DAC-to-Transfer Checkpoint

Date: 2026-10-18. Previous immutable source: `MK_DOS_Archive_Source_O261_Pit_II_2026-10-18.zip`.

## Scope and classification

- **O267: LIVE DEBUGGER-WITNESSED with original-source checks.** Five original DOSBox-X screenshots supplied by the user; raw PNG SHA-256 locks each to the evidence JSON. Screen hexadecimal values are independently visually transcribed, **not OCR or machine RAM dumps**. Only this one observed fatality wall-replacement event is promoted.
- **O268: ORIGINAL-SOURCE VERIFIED / RUNTIME ROUTE NOT YET WITNESSED.** Qualifies the transfer wrapper called by the O267 breakpoint, but the debugger stopped **at** the CALL, before it executed. It is not proof of a particular VRAM write.
- Both analyses preserve the original game executable, graphics, inherited historical research and the distinction between source image offsets, code-object loaded offsets, writable-data relocation and palette-source addresses.

## O267 — authenticated runtime sequence

The live physical/code file mapping is `live_EIP = 0x200000 + (original_file_offset - 0x61C54)` in CS `0180`. Source **writable globals** relocate by `+0x240000`, whereas **palette source pointer** `0x27958` resides in the different `+0x200000` domain and therefore becomes `0x00227958`. **Do not apply `+0x240000` to palette source pointers.**

| User screenshot | Original source / live address | Direct observation |
|---|---|---|
| `O262_PENDING_FLAG.png` | physical `0x7B48F` / code `0180:0021983B`, live global `002963E0` | pending DWORD `1` after wall rebuild |
| `O263_DAC_QUEUE_CURSORS.png` | live globals `002963D8` / `002963DC` | read cursor `002962F0`, write cursor `002962F8`, **one** 8-byte active entry; pending `1` |
| `O264_DAC_QUEUE_COMMAND.png` | live address `002962F0` | bytes `5A 79 22 00 40 00 51 00`: palette color pointer `0022795A`, destination index **64**, count **81** |
| `O265_DAC_QUEUE_DRAIN.png` | physical `0x7B3ED` / `0180:00219799` | read and write cursors **both** `002962F8`; pending still `1` *immediately before the instruction clearing it* |
| `O266_PALETTE_FORCED_TRANSFER.png` | physical `0x670AC` / `0180:00205458` | hit `call 002037CC`, the **palette-pending** frame-controller transfer path; pending DWORD now `0` |

Original executable `0x7B30B` handles retrace and palette queue processing. Source `0x7B381–0x7B3D4` decodes source pointer/index/count and writes the VGA DAC index/data ports `0x3C8`/`0x3C9`; `0x7B3E7` commits the read cursor and `0x7B3ED` clears the pending flag. The O265 cache state and code IP corroborate the drain path. The screenshots are not a direct external capture of the port writes.

O260 previously witnessed Pit wall palette release/reacquisition for a single replacement; that result is inherited and **not** extrapolated to all 32 selector steps.

### O267 classification boundaries

- **Runtime verified:** cache eviction/reacquisition (O260); pending update flag (O262); one live queued 81-color command (O263/O264); read cursor catching write cursor before pending clear (O265); reaching the palette-pending frame-controller video-transfer CALL (O266).
- **Original-source verified:** DAC port-writer instructions, frame-controller branch select conditions, call-site target.
- **Not yet proved:** transfer callee executes for that frame, a particular VGA-memory dword is modified, host presents a specific composed frame, how many controller traversals correspond to 50fps output, or why O248 capture runs have unequal holds.

## O268 — exact following source-level video-copy mechanism

The original `0x670AC` call targets `0x65420` (runtime `0180:002037CC`). At `0x65420`, mode `3` is a direct/full VGA copy path; modes other than 3 enter `0x65499`, which branches on the separate `0x75CEE` flag. Each normal-mode choice reaches original delta helper `0x65A54` through direct calls at `0x654C0`, `0x654E9`, or `0x65512`, with EBP set to the VGA address `0xA0000`. The helper compares image dwords; on differences it writes the new value through `[EBP+offset]` (e.g., `0x65F50`). This can leave VRAM *unchanged* if the compared dwords match.

This explains why the O266 CALL-site hit is real but still insufficient to count changed/visible frames. We lack the live state at `0x75CEE` and a post-call VRAM-change witness. The 50fps native observation is separate from scheduler interrupts and 30fps capture sampling.

## Repeatable verification

```sh
python3 scripts/verify-o267-pit-live-dac-transfer.py --exe /path/to/ORIGINAL_MK2.EXE --screenshots research_outputs/O267_RUNTIME_SCREENSHOTS --output /tmp/O267.json
python3 scripts/verify-o268-pit-vram-copy-source.py --exe /path/to/ORIGINAL_MK2.EXE --output /tmp/O268.json
```

Both verifiers require the exact canonical executable SHA-256 and check original opcode bytes/relative-call destinations. O267 independently rejects **20** single-site mutations; O268 rejects **28**, total **48**. Original screenshots are locked by SHA-256; a screenshot alone cannot mechanically attest that a transcribed hex value is correct.

## Next concrete research boundary

If another user-assisted debugger session is warranted, use **one** validated breakpoint inside `0x65420` or `0x65A54`, with a single read-only VRAM comparison before and after that routine. Avoid assuming a texture-selector visit equals a newly visible frame; do not request repetitive captures unless necessary. For now preserve the results and continue any further static verification autonomously.
