# O249 — Pit II renderer composition / video-transfer gate qualification

**Date:** 2026-10-17. **Inherited checkpoint:** O248, unchanged. **Status:** Original MK2 executable source verified; runtime branch values and exact captured-frame mapping unknown. Read-only pass.

## Material result

The original entry at physical `0x66E34` calls the frame controller at `0x67050` on each outer main-loop pass. Its instructions do NOT guarantee that an invocation of frame composition (`0x933C2`) is followed by video transfer (`0x65420`) in that same pass.

Source-backed branch matrix (the branch gates below are *hypothetical runtime inputs*, not observed Pit runtime values):

| `0x75CF2` render flag | mode `0x3014C` | special `0x563E0` | calls to `0x933C2` | calls to `0x65420` | visible consequence bounded by source |
|---|---|---|---:|---:|---|
| zero | any | any | 0 | 1 | transfer wrapper invoked without a compositor call in the controller pass |
| nonzero | `3` | any | 1 | 1 | forces transfer |
| nonzero | not `3` | nonzero | 1 | 1 | forces transfer, resets the alternating bit |
| nonzero | not `3` | zero | 1 | 0 or 1 | **alternating branch**: XORs bit `0x562D4` at entry; if toggled bit is one, skips transfer; if zero, waits for a second retrace and calls transfer |

In the normal alternating branch the complete original edges are: `0x67050` toggles DWORD `0x562D4` with XOR 1, calls object maintenance `0x935E6`, reaches the compositor via `0x670BD`, calls VGA sync `0x7B30B` via `0x670C2`, tests bit `0x562D4` at `0x670C7`, then either jumps to counter sampling `0x670DD` (no transfer) or calls a second VGA sync at `0x670D3` and video-transfer wrapper at `0x670D8` before counter sampling.

The other transfer branches are `0x67085` (mode 3), `0x670AC` (special mode). The render-disabled path branches directly to the shared `0x670D3` sync+transfer path without calling the compositor within this frame controller. The transfer wrapper can dispatch different internal copy/delta paths; one original route at `0x65441`/`0x65465` sets the destination to VGA address `0xA0000` and calls a copy loop at `0x65521`. A call to the wrapper is **not** proof that the VRAM contents actually change.

## Scheduler relationship

Following all four controller branches, source at `0x670DD` waits for the nonzero counter at `[ [0x3177C] + 0x24 ]`, samples and smooths it, clears the counter, and then traverses the task list from `0x67108`. The task handler at `0x67158` decrements each visited 16-bit task countdown **once**, not once per accumulated counter tick; yielding stores the counter and continuation at `0x67110–0x67114`. This corroborates inherited O168, and does not establish that the game operates the texture selector at the raw interrupt frequency.

**What this explains:** source mechanism exists by which a selected texture can survive compositor steps without each compositor result being newly submitted to the video-transfer wrapper; other conditions can force transfer on every pass. This helps explain why a selector table is not a display-frame table.

**What it does NOT explain:** which `0x75CF2`, `0x3014C`, `0x563E0`, `0x562D4` values are active during the recorded Pit fatality, which intermediate graphic-58 steps actually present in any particular run, the O248 5-entries-one-video-frame vs 3-entries-three-video-frames inversion, exact native 50fps/60Hz interaction, or real VRAM updates. These require live state evidence. O247 graphic58 runtime presentation and O248 unequal-hold observations remain independently valid.

## Verification

- Original canonical `MK2.EXE` and `FALL.GRA` SHA-256 are checked against owner fixture.
- Existing O248 report hash is checked before any analysis; inherited evidence is never silently replaced.
- 23 independent targeted byte mutations covering the controller entry, key gates/branches, compositor/retrace/transfer edges, VGA destination and scheduler save/decrement are rejected.
- A 16-row exhaustive **static branch-state matrix** records all input combinations. These are source branch enumerations, not a runtime experiment.
- Two independent runs produce the exact same JSON SHA-256: `73cd71592b0193125c27133276f1207333571cfd095e59d285ec6ebf6907bc6c`.

Reproduce:

```sh
python scripts/verify-o249-pit-frame-presentation-gates.py \
  --game-zip <unchanged owner MK2 ZIP> \
  --source-zip <inherited O248 source ZIP> \
  --out <new empty output directory>
```

No original game file or existing archive member has been changed; no new application build or runtime framebuffer trace claimed.
