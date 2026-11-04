# MK DOS Archive — O256/O257 Pit II palette queue, presentation, and relocation

**Date:** 2026-10-18  
**Inherited authoritative source:** `MK_DOS_Archive_Source_O255_Pit_II_2026-10-17.zip`  
**Status:** ORIGINAL-SOURCE VERIFIED for queue structure and code paths; LIVE RUNTIME STATE UNKNOWN.

## O256: independently verified queue versus palette cache

The original MK2 executable contains two separate structures:

- **Palette cache:** 60 entries, eight bytes per entry, at original data address `0x75B00` (source comparisons at `0x7B43E` and bound at `0x7B44C`). Each entry stores a palette pointer, reference count, and start index.
- **VGA DAC command queue:** 32 entries of eight bytes, a 256-byte ring spanning `0x562D8..0x563D8` exclusively, with read cursor at `0x563D8` and write cursor at `0x563DC`. Each command contains a source pointer, 16-bit palette index and 16-bit color count (`0x7B2D0..0x7B2F7`).

A cache miss at `0x7B48F` sets pending flag `0x563E0`, resets alternating toggle `0x562D4` at `0x7B499`, and requests a DAC command at `0x7B4A3`. The `0x67050` frame controller conditionally composes, drains the DAC queue through `0x7B30B`, and invokes the video-transfer helper `0x65420`. The pending flag is cleared at `0x7B3ED` after queue processing.

The **order of these source instructions and call edges is verified**. No real game-frame palette cache or queue entries were measured during O256. A queue is not a record of actual VGA DAC transmissions until drained, and a frame-control transfer request is not a verified displayed capture frame.

### O256 verification

- 36 original opcode anchors, 10 original `rel32` call targets, and original 32-step sprite selector checked.
- 47 deliberate byte mutations rejected.
- Two independent replay reports identical, SHA-256 `16448d0462611beb9ae7f0a50e8d0053a58e2efef27ca7d5d13854486278cb9d`.

## O257: original palette allocator can reflow later entries

At `0x7B4B8..0x7B4F4`, after allocating a new palette, the allocator scans later occupied palette-cache entries. When a later palette needs its start index moved, it writes the new destination at `0x7B4D7` and enqueues **another DAC update** at `0x7B4ED -> 0x7B2D0`.

Consequently **one cache miss may enqueue more than one palette command**. O254's zero-external-holder model gives 32 *possible cache misses*, but **not an established or fixed count of actual VGA updates**, and not even necessarily one queued command per miss when reflow occurs.

### O257 verification

- 17 original opcode anchors and 2 original `rel32` call targets checked.
- 19 deliberate byte mutations rejected.
- Two independent replay reports identical, SHA-256 `7145f3603d40605478de0df199760e878c710571c3d32ca1387b39c257dcf30e`.

## Cross-milestone limits

O252–O255 established wall removal/creation release/acquisition, lower-scene palette cache resets, conditional 32-miss/468-hit versus 0-miss/500-hit models, and nonownership by the lower fighter's normal 17-entry character palette tables. O256 and O257 establish the **separate queue and presentation** mechanics. None identifies whether an unrelated persistent same-source palette holder existed during the real video capture.

User-confirmed approximately **50 fps** game presentation, approximately **60 Hz** programmable timer, and **30 fps** MP4 samples must remain distinct. A frame-delay, selector update, palette cache mutation, queued DAC command, DAC write, video transfer call, and captured video frame are separate events.

## Actual next runtime evidence

A debugger-enabled, read-only DOS emulator could log selected sprite index, tagged object-release events, allocator hits/misses, cache reference counts, queue write/read cursors, palette pending flag, frame toggle and transfer events during a single Pit II fatality. **Original EXE physical file offsets cannot be passed directly to protected-mode breakpoints**: resolve the executable's loaded Object-1 base first. Use debugger telemetry rather than patching game behavior. No such runtime telemetry was acquired in O256/O257 because this execution environment has no DOS emulator/debugger.

See `O256_PIT_RUNTIME_TRACE_FIELD_GUIDE.md` for event fields and original source-relative offsets.
