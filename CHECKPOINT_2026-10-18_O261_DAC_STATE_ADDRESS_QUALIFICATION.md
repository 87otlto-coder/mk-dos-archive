# MK DOS Archive — O261 | Source-qualified loaded DAC state addresses

**Status:** ORIGINAL-SOURCE VERIFIED for operand locations; **PROPOSED / LIVE CONFIRMATION PENDING** for newly derived live addresses.

The user's debugger showed `cmp [002B5B00+ebx*8],eax` where unrelocated `MK2.EXE` contains `[00075B00+ebx*8]`, and showed `mov eax,[0025376B]` where original source uses `0x1376B`. These independently imply a data relocation addend of `0x240000` in this DOSBox-X session. The loaded code base was separately established as `0x200000` for Object-1 code offsets.

| Function | Original operand | Derived live address | Evidence status |
|---|---|---|---|
| Palette cache | `0x75B00` | **`0x002B5B00`** | Live witnessed |
| Selector index | `0x1376B` | **`0x0025376B`** | Live code operand witnessed |
| Palette pending | `0x563E0` | `0x002963E0` | Derived; not live read |
| Alternating-frame toggle | `0x562D4` | `0x002962D4` | Derived; not live read |
| DAC queue start | `0x562D8` | `0x002962D8` | Derived; not live read |
| DAC queue read cursor | `0x563D8` | `0x002963D8` | Derived; not live read |
| DAC queue write cursor | `0x563DC` | `0x002963DC` | Derived; not live read |

The original sources at `0x7B48F` and `0x7B499` set the pending flag and clear the alternating toggle on cache miss. The queue function at `0x7B2D0` enqueues 8-byte commands into a 32-entry ring. The source at `0x6708C` checks the pending flag in frame control; the queue flush clears the flag at `0x7B3ED`.

**Scope boundary:** These addresses are not an automatic runtime trace. Observe the relocated instructions in DOSBox-X and then read the corresponding data; only after that should we infer active flag states. No game modifications are required.

Verification: `verify_o261_dac_probe_map.py` checks eight exact opcode anchors and regenerates `O261_DAC_PROBE_SOURCE_MAP.json` deterministically from the canonical unmodified executable. Two reports reproduced byte-for-byte.
