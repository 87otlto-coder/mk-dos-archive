# MK DOS Archive — O270 framebuffer geometry and buffer synchronization

Date: 2026-10-31. Immutable predecessor: `MK_DOS_Archive_Source_O269_Cross_Game_Mechanisms_2026-10-18.zip`.

## Scope and evidence grade

This milestone is **ORIGINAL-MK2-EXE SOURCE VERIFIED**, **not a new runtime observation**. It uses canonical, unchanged DOS `mk2/mk2.exe` (861133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). O266 observed execution stopped **before** the call at original file offset `0x670AC` / live `0180:00205458`; O270 does not upgrade that to observed entry into the video-copy callee or a measured video-memory write.

### Source-verified discoveries

1. The full-copy helper at original file offset `0x65521` loops **200 rows** (CL `0xC8`) with **80 unrolled DWORD load/store pairs per row**. Each row advances ESI and EDI by `0x140` bytes = 320 bytes; the full area is **64,000 bytes** (`0xFA00`). This is the 320×200 frame-sized copy footprint (1 byte/pixel interpretation is consistent with the VGA indexed graphics mode, but this verifier independently proves the copy geometry, not the hardware configuration).
2. The differential-copy helper at `0x65A54` likewise loops 200 rows, checking **80 DWORDs per row**, comparing `ESI` source with `EDI` opposite software buffer, and **conditionally** writing mismatched DWORDs through `EBP` set to the VGA base `0xA0000`. It does **not** compare against a direct VRAM readback. If the opposing software buffers have no differing DWORDs, this helper can traverse without changing any pixel-index bytes in VRAM.
3. The two software buffer bases in original embedded operands are `0x56524` (A) and `0x65F24` (B). Their separation is exactly `0xFA00`, **64,000 bytes**. These are original source/executable address-coordinate operands; do not treat them as raw file offsets or assume live addresses without relocation verification.
4. The non-mode-3 wrapper (`0x65499`) takes different buffer-order paths depending on the previously tracked buffer value (`0x7662A`). A separate global at `0x75CEE` chooses the special path.
5. **Newly explicit special-case fact:** at `0x65503`, with the special flag nonzero, the wrapper calls the differential VGA helper with `ESI=A`, `EDI=B`, `EBP=0xA0000`, then falls through at `0x65517` to set `ESI=A`, `EDI=B` and execute the full-copy helper directly at `0x65521`. That second copy **synchronizes software buffer B to A**; it is **not a second VGA full-copy**. The full-copy routine is general and writes to its EDI destination; here EDI is B, not `0xA0000`.
6. Mode 3 can call the same full-copy helper with EDI set to `0xA0000`, directly copying selected software-framebuffer data to VGA. These are distinct helper call-site uses.

### What this does NOT establish

- Whether the O266 pending-palette branch executed this callee, or which conditional path it took, was not witnessed.
- No count or contents of **actually changed** VGA DWORDs were measured.
- Even zero changed pixel-index DWORDs does **not** guarantee an unchanged displayed color image: the preceding DAC palette update can alter pixel colors without altering VRAM indices.
- Nothing here establishes frame-presentation timestamp, task-controller cadence, 50 fps emulator output cadence, or why O248's 30 fps recording exhibits uneven texture holds.
- No game-specific finding is generalized into an MK1 or MK3 engine rule.

### Reproducible validation

```
python3 scripts/verify-o270-framebuffer-geometry.py --exe /path/to/original/MK2.EXE --out /tmp/O270_FRAMEBUFFER_GEOMETRY.json
```

- Validates executable SHA-256.
- Asserts 17 instruction anchors, seven direct CALL targets, two loop edges, all 80 full-copy DWORD operations, all 80 differential DWORD comparisons, and all 80 mismatch-jump VGA-write targets.
- Rejects 31 separately mutated instruction/operand locations with source hash check disabled for the mutation controls, to ensure source structure, not merely identity, enforces failure.
- Repeated report exports are byte-identical.

### Continuity and next experiment

O267 and O268 original verifiers were independently rerun with the canonical executable and original O267 screenshot set. O269 registry remains unchanged: O270 is additive evidence and source verifier, not an application/runtime code change.

Next discriminating live test (only if needed): witness entry into the non-mode-3 differential helper or mode-3 full helper during **one controlled fatality wall rebuild**; record the special-buffer flag and the active source/opposite-buffer values. A separate read-only before/after dump of the same VRAM range could establish actual index-byte changes. The first test needs readouts of game mode and 0x75CEE; don't assume dynamic addresses until verified in the running DOSBox-X build. Avoid repeated unrelated breakpoints or guessing screenshot-to-controller clocks.
