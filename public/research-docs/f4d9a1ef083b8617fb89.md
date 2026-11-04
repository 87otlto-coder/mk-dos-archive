# O121 — MK2 palette-slot, sprite-control and resource ownership join

**Date:** 2026-10-11. **Priority:** MK2. **Status:** static source-backed structural graph and six rectangle-layout proofs independently verified. **No additional DOSBox runtime experiment performed.**

## Key result

O119 demonstrated visible in-game edits to two original counted **80-color** EXE records, and no injected color in the chosen two 79-color candidates. O120 proved all four color records participate in relocation-backed graphics setup pointer arrays, but did not determine how the setup control data selects the record.

O121 disassembles the actual `MK2.EXE` palette-selector instructions from `0x81DAF` through `0x81DDA` and recovers the descriptor selector semantics, then independently rechecks every member of the ten O120 setup records against the original `MK2.EXE`, `TOMB.GRA`, `PORTAL.GRA`, and `IMAGES.GRA`:

- `flags = u16(control + 0)`; `selector = u16(control + 6)`.
- **Palette table slot = `(flags & 0x000F) | ((selector & 0xF000) >> 8)`**.
- **Sprite descriptor byte offset = `(selector & 0x0FFF) * 4`** from the Object-2 sprite table at `[setup + 0x0A]`. The supported descriptors are 8-byte aligned and contain `u16 width, u16 height, u32(resourceId << 24 | resourceByteOffset)`.
- `[setup + 0x0E]` points to the palette table; the 32-bit pointer at `paletteTable + slot * 4` provides the counted palette-record source pointer. The source is passed to the original palette allocator at physical `0x81DDA`; the returned handle is stored in an object field `+0x30`.

**All 135 audited control entries select palette slot 2**, and relocation-backed `slot2` points to the matching counted palette source. Both 80-color stage records have canonical resource IDs linking their graphic descriptors to their stage's original `.GRA` bytes.

| Family inherited from O120 | EXE palette record | Source graphics file (ID) | Setup records | Control rows | Distinct selected sprite descriptors | Palette slot |
|---|---:|---|---:|---:|---:|---:|
| `tomb80` | `0x893C6` | `TOMB.GRA` (28) | 6 | 87 | 16 | 2 |
| `portal80` | `0x891E0` | `PORTAL.GRA` (25) | 2 | 28 | 13 | 2 |
| `tomb79` (historical RGB-match name) | `0x8CDBE` | **`IMAGES.GRA` (22)** | 1 | 10 | 10 | 2 |
| `portal79` (historical RGB-match name) | `0x8CD1E` | **`IMAGES.GRA` (22)** | 1 | 10 | 10 | 2 |

**Crucial correction:** The 79-color candidates originally named for Tomb/Portal based on matching RGB values are actually linked to **`IMAGES.GRA` sprite descriptors**, not `TOMB.GRA` or `PORTAL.GRA`. Their names in O118–O120 were historically useful *color similarity labels*, **not authenticated stage resource ownership**. O121 does not rewrite the earlier binary or experimental reports; it supersedes their implied resource association. The O119 negative DOSBox tests are now consistent with this file-level distinction, but do not imply that either 79-color source record is unused in all game modes.

### Six exact rectangle mosaics, no pixel-opacity claim

The control offsets, signed placements, sprite dimensions and declared setup dimensions independently form six **exactly area-filling, zero-overlap, in-bounds descriptor-rectangle tilings**:

| Family | Setup offset | Declared rectangle | Tiles | Raw rectangle union |
|---|---:|---|---:|---|
| Tomb 80 | `0x17358` | 896 × 56 | 7 | Exactly 896 × 56 |
| Tomb 80 | `0x173A0` | 800 × 30 | 20 | Exactly 800 × 30 |
| Tomb 80 | `0x173B2` | 320 × 80 | 5 | Exactly 320 × 80 |
| Portal 80 | `0x16526` | 320 × 168 | 8 | Exactly 320 × 168 |
| Images 79 #1 | `0x2E7E4` | 320 × 200 | 10 | Exactly 320 × 200 |
| Images 79 #2 | `0x2E720` | 320 × 200 | 10 | Exactly 320 × 200 |

The other four setup groups do **not** satisfy this rectangle test; some contain overlapping or negative/out-of-range descriptor boxes. This is a structural finding, **not proof that every rectangle is opaque** or which layer is drawn during a specific fight. No renderer is authorized to flatten these into final pixel output on this evidence alone.

## Verification

- Canonical `MK2.EXE` SHA256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` and LE relocation fixup count **27,004** independently checked.
- **10 setup records**, **135 control rows**, **49 distinct sprite-descriptor offsets**, source resource names and lengths verified; **2,025 independent control-field assertions**.
- Source resource identities tied to original `TOMB.GRA`, `PORTAL.GRA`, `IMAGES.GRA` in the user-supplied original game ZIP; no original commercial resources are bundled with the O121 source code.
- O121 new Python tests: **32 passed**, including forged resource IDs, palette indices, record offsets, sprite geometry, runtime overclaims, wrong EXE/resource, and output overwrite protection.
- O120 prior tests: **23 passed**. O119 prior tests: **12 passed**. O121 Node/TypeScript bridge: **26 checks passed**; O119 bridge: **15 checks passed**.
- The MK2 floor-preview panel gains the O121 provenance correction and explicit runtime-limit language. The entire app's React/Vite build was **not** verified in this checkpoint; bridge source module was verified under Node's TS type stripping.

### Run with original game files

```sh
python tools/mk2_native_stage_palettes/trace_o121_control_bindings.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --out /new/path/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
python tools/mk2_native_stage_palettes/verify_o121_independent.py /path/MK2.EXE /path/mk2.zip research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
python tools/mk2_native_stage_palettes/audit_o121_tile_layouts.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --report research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json --out /new/path/O121_STAGE_SPRITE_RECTANGLE_COVERAGE.json
python tools/mk2_native_stage_palettes/test_o121_control_bindings.py /path/MK2.EXE /path/mk2.zip
node --experimental-strip-types scripts/run-mk2-o121-stage-palette-control-bridge.mjs
```

## Still unproven / next step

O121 establishes **which palette source an entry would request if that setup/control were selected**, not which setup is actually selected during a live Tomb/Portal match. The actual runtime `ESI` setup object, returned palette allocator handle, VGA DAC starting index and final scene composition remain **unmeasured**. Next: targeted DOSBox debugger / narrow instrumentation at the `0x81DD8` pointer load and `0x81DDF` handle store (or inside `0x7B439`), capture source pointer, ESI setup and return handle at one stage transition. A new DOSBox probe should only be built when it has a safe, testable trace output or deterministic state inspection plan.

**Source-release hygiene:** Two original commercial resource copies (`demo_inputs/portal.gra` and `demo_inputs/tomb.gra`) were present in the O120 parent source ZIP. They are deliberately excluded from the O121 **development-source** release; users supply the original game resources locally. All inherited code/research entries are retained except the explicitly documented updates.

**Pass accounting:** O121 is a single substantive targeted research checkpoint with independently measured subfindings, not a claim that another 50 unrelated research passes were completed. Continue the requested 50-pass cadence where 50 meaningful separable problems are available, without manufacturing counts from repetitive tests.

**Project priority remains MK2 → MK1 → MK3 → extractor/compiler milestone.** Bot/wrapper and Authentic Enhanced ideas remain deferred.
