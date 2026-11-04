# MK DOS Archive — Pit II continuation through O270

**Baseline:** O269 source (`MK_DOS_Archive_Source_O269_Cross_Game_Mechanisms_2026-10-18.zip`). **Current checkpoint:** O270 source-verified framebuffer geometry and special-buffer synchronization. O269's cross-game mechanism registry and all inherited source remain byte-for-byte unchanged.

## Most important verified chain

O260–O266 live witness: Pit wall palette old cache entry released; new wall reacquired 15 palette references; pending flag `1`; DAC command source `0x0022795A`, VGA destination index 64, 81 colors; queued 8-byte command consumed; pending flag subsequently `0`; original palette-pending video-transfer CALL site at `0180:00205458` reached, **before call executed**. Source confirms code to write DAC ports `0x3C8`/`0x3C9`, but direct port I/O wasn't externally traced. 

O268 source: call target original file offset `0x65420`, normal-mode delta helper `0x65A54`, conditional changed DWORD store to VGA `0xA0000`; mode3 full-copy helper `0x65521`. Live conditional path inside transfer still unknown.

O270 source: verified full 64,000-byte (320×200) copy geometry; 80 DWORDs × 200 rows, stride 320; A buffer original operand `0x56524`, B `0x65F24`; delta compares opposite software buffers, not VRAM, writes only mismatches; special non-mode3 path performs **delta A→VGA versus B, then A→B full software-buffer synchronization**, separate from mode3 full copy A/B→VGA. Thirty-one negative byte-mutation controls rejected, O270 verifier deterministic. **No new live breakpoints or VRAM dumps.**

## Interpretation constraints

- CALL reached ≠ callee executed ≠ VRAM changed ≠ new host-rendered frame.
- Changed palette can update visible colors even when VRAM indexed bytes are unchanged.
- O248 captured video was 30fps; ~50fps game observation separate; task clock and periodic scheduling not equivalent.
- Last source-verified static original MK2 EXE SHA256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- O270 does not modify any working application/editor code or executable.

## Suggested next action

Either (A) a single bounded runtime discriminator for `0x65420` and `0x65A54` with safe, verified DOSBox-X protected-mode virtual addresses, or (B) further offline inspection of O248 selected sprites/timeline to separate asset changes from palette-only changes. Do not assert exact duration before independent controller+screen-change evidence exists.

See `CHECKPOINT_2026-10-31_O270_FRAMEBUFFER_GEOMETRY_AND_BUFFER_RESYNC.md` and `O270_FRAMEBUFFER_GEOMETRY.json` for exact machine-readable proof and limitations. Test using `scripts/verify-o270-framebuffer-geometry.py` on canonical MK2.EXE (user-supplied original; never bundled in the package).
