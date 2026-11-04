# MK DOS Archive — O221: Original Pit distant-actor animation source-control path

**Date:** 2026-10-17. **Predecessor:** O220; inherited O219, O214–O218, O210 and all earlier source unchanged. **Nature:** bounded original MK2 executable source/LE relocation research, NOT a live executable trace or gameplay patch.

## Source-authenticated finding

The two seven-sprite distant bridge-actor sequences identified in O220 have exact original **Object-2 animation lists** at `0x18AFC` and `0x18B20`, corresponding to physical `MK2.EXE:0xB9750` and `0xB9774`.

- Green actor: seven original descriptor pointers to `PIT.GRA` small graphics at physical `0xB98E4`, `0xB98F4`, `0xB9900..0xB9930`, each 16×24. Every entry is supported by an original type-7 32-bit Object-2 LE relocation.
- Flaming actor: seven original descriptor pointers at `0xB993C`, `0xB994C`, `0xB9958..0xB9988`, each 16×32. Every entry likewise has a correct LE relocation.
- Each list has the original DWORD marker `1` immediately after the seven descriptors, then a relocated DWORD back-pointer to the beginning of **its own** seven-frame list. The original interpreter's loop-marker meaning is independently known from O136/O169. List order is original source order, not video-estimated ordering.

The original Object-1 code at **physical `0x831D8..0x8325F`** connects these records to the real animation-list consumer:

1. `0x831D8` writes the green actor's first descriptor (`0x18C90`) into global sprite-selector `0x75A6C` (typed LE relocation at physical `0x831DE`) and calls setup helper `0x83260`.
2. `0x831F2` saves the green list pointer `0x18AFC` in global `0x75A80` (typed relocation at `0x831F8`).
3. `0x831FC` changes sprite-selector `0x75A6C` to the flaming actor's first descriptor (`0x18CE8`; typed relocation at `0x83202`) and calls the same setup helper.
4. `0x83210` installs the flaming list `0x18B20` in cursor global `0x75A78` (typed relocation at `0x83216`).
5. A bounded repeat path invokes the **established original sprite-list reader `0x86CC5` twice** (`CALL` sites `0x8321A` and `0x8323A`), swapping list cursors through globals `0x75A78`/`0x75A80` so the two actors advance through separate source lists.
6. The path explicitly loads `EAX=6` at `0x83254`, calls scheduler-yield `0x6710F` from `0x83259`, and jumps back to `0x8321A` from `0x8325E`.

O139/O140 already established original reader-to-renderer binding and that `0x6710F` writes a task scheduler-count field; O168 explains why task countdown, sampled IRQ magnitude and presentation rate are different quantities. Therefore, O221 proves a **source-level yield operand of 6**, not six displayed frames, not a measured millisecond duration, and not an automatically exact 50fps sprite cadence.

## User timing context correction

Carry forward the earlier Portal-stage GIF/DOSBox observation: nominal **50 fps DOS-port presentation**, reportedly stable across approximately 50%–110% DOSBox CPU cycles. Owner's 30fps gameplay recording is a **sampling** of this gameplay, not a declaration of the native render frame rate. A nominal 20ms *presentation* frame does not establish the wall-clock interval between separate original actor poses or scheduler traversals.

## Verification

Independent read-only reproducer: `scripts/verify-o221-pit-bridge-animation-list-flow.py`.

- Hash pins original MK2.EXE and original PIT.GRA in owner-supplied `mk2.zip`.
- Independently reparses **27,004** original LE fixups with the already independently validated O120 parser.
- Verifies all 14 descriptor pointers, both list loop tokens, loop target relocations, four typed code-pointer operands, original code instruction-byte fragments, five direct relative CALL destinations, two reader calls, and the back-jump.
- Rejects **5/5** deliberate evidence mutations (bad green loop marker, altered flame pointer, changed green seed, changed reader CALL destination, changed scheduler-yield literal).
- Second full verifier run reproduced an **identical report SHA-256 `133fffb853d83e3937401e0335555be344aeeb5f3e56cbd8343963781cbe4079`**.
- The original MK2 executable/resource ZIP and recordings were never altered. No code-execution trace, native timing recorder, DOSBox debugger run or application build was performed.

**Machine report:** `research_outputs/O221_PIT_BRIDGE_ANIMATION_SOURCE_CONTROL.json`.

Reproduce from project root:

```
python scripts/verify-o221-pit-bridge-animation-list-flow.py --game-zip /path/to/owner-original-mk2.zip --project . --out /new/absent/output-directory
```

## Still unresolved

- Whether/when this original callback executes in a particular live Pit game-mode and the actual object IDs/activation ordering.
- Relationship of six scheduler yields, task traversal cadence, 50fps presentation and measured real-world pose durations.
- Runtime object position/camera/parallax and final draw order for the two actors.
- Fatality state-machine dispatch, impact-effect layering, palette register ownership and sound/title scheduling. `FALL.GRA` source sprite58 remains unassigned to the sampled descent.

Next pass should be bounded: establish the **incoming executable call/dispatch path** to `0x831D8` and its state gate, or stop at a documented source ceiling and request a targeted DOSBox trace. Do not make a binary patch by extrapolating from static descriptor references.
