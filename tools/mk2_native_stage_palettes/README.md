# O118 — Native MK2 stage-floor palette source witnesses

**This is a source-file palette match, not a live DOSBox palette handle identification.**

O115's 128 screenshot-observed source-index/RGB values (Tomb 2–51, Portal 3–80) match *exactly* two 80-color counted palette records in the user's original `MK2.EXE`:

| Stage | EXE record physical offset | Count | Source index -> record word | Screenshot matches |
|---|---:|---:|---|---:|
| Kombat Tomb | `0x893C6` | 80 | `word[sourceIndex - 1]` | 50/50 |
| The Portal | `0x891E0` | 80 | `word[sourceIndex - 1]` | 78/78 |

Word-to-DAC6 conversion is source-verified in O71/O110E (red `((w>>9)&63)|1`, green `((w>>4)&63)|1`, blue `((w<<1)&63)|1`). Crucially, the screenshot-compatible 8-bit channel expansion is **bit replication** `((v << 2) | (v >> 4))`, **not** O110E's explicitly *diagnostic* `floor(v*255/63)` expansion. O110E is not retroactively altered.

Two preexisting 79-color counted records at `0x8CDBE` and `0x8CD1E` form a negative/ambiguity control: the Portal 79-color record also reproduces all 78 witnessed colors, and the Tomb 79-color record reproduces 49/50 (exception: source index 31). Both 80-color originals have multiple exact typed LE Object-1 relocation pointers: Tomb 9, Portal 12; their 79-color alternatives have 9 each. These are file-backed structural references, **not proof of runtime allocation or which palette handle the stage renderer reads**.

O118 exports a source palette preview whose entire 320×48 Tomb and 320×40 Portal RGBA buffers are **byte-identical** to O116's witness-derived preview buffers (28,160 pixels). This additionally connects the O115 screenshot evidence to authentic EXE palette data.

## Run with your own original MK2 game files

From the project root:

```bash
python tools/mk2_native_stage_palettes/native_stage_palettes.py \
  --exe PATH_TO_ORIGINAL_MK2.EXE \
  --witness-csv research_outputs/O115_OBSERVED_STAGE_FLOOR_RGB_TABLE.csv \
  --report NEW_REPORT.json \
  --stage portal --gra PATH_TO_ORIGINAL_PORTAL.GRA \
  --source-left 292 --png NEW_PORTAL_FLOOR.png
```

Both output paths must be new and distinct. No original game files are included in the release or modified by the tools.

```bash
python tools/mk2_native_stage_palettes/verify_o118_independent.py PATH_TO_ORIGINAL_MK2.EXE \
  research_outputs/O115_OBSERVED_STAGE_FLOOR_RGB_TABLE.csv NEW_REPORT.json
python tools/mk2_native_stage_palettes/test_o118_native.py PATH_TO_ORIGINAL_MK2_DIRECTORY
node --experimental-strip-types scripts/run-mk2-o118-native-stage-palette-bridge.mjs PATH_TO_ORIGINAL_MK2_DIRECTORY
```

The React MK2 floor preview panel now optionally enforces exact matching to the original EXE palette record and shows an explicit provenance notice. The **complete app build is not verified** in this environment (npm dependencies not installed). Core TS type checking and the Node browser bridge passed.

## Still open

- Which palette record (80-color or 79-color alternative) is requested or resident during the actual Tomb/Portal fight?
- What 60-handle palette allocator state and DAC start index are in effect at the render point?
- What game camera RAM state corresponds to screenshot-relative source crops?
- Which background and foreground layers compose with the packed floor?
- Can the same strict provenance be recovered for Battle, Tower, Forest, Armory and Arena?

Next high-value experiment is precise emulator instrumentation of the original DOS MK2 palette record pointer / handle table / DAC queue during a stage transition; do not invent ownership from static RGB matches.

## O118 runtime disambiguation kit

The separate verified full-game DOSBox kit contains 40 control, 41 Tomb 80-record, 42 Tomb 79-record, 43 Portal 80-record and 44 Portal 79-record. These executable variants patch exactly one palette word each (plus the shared F9 cheat-menu unlock), leaving all game resource bytes unchanged. See `build_o118_runtime_kit.py` and `verify_o118_runtime_kit.py` for audit. **Screenshots from the user are required to establish actual game effects**; static structure and palette-matched color alone cannot resolve the runtime allocator handle.

## O119 runtime palette-origin qualification (follow-up evidence)

Tests **41 and 43** visibly recolored the selected Tomb and Portal arenas; tests **42 and 44**, which patched equivalent entries in alternative 79-color records, did not. All four test EXEs are rederived from the same canonical MK2 source; all four user screenshots are SHA-pinned. This qualifies the **80-color native EXE source records in the tested fights** but does not resolve the allocator's active VGA handle or DAC bank index.

See `CHECKPOINT_2026-10-11_O119_RUNTIME_PALETTE_SOURCE.md`, `evidence/mk2_o119/`, `research_outputs/O119_80_VS_79_RUNTIME_PALETTE_IMAGES.json`, `analyze_o119_runtime_images.py`, `verify_o119_independent.py` and `test_o119_runtime.py`. No new user DOSBox test is needed to repeat this evidence.

## O120 — Runtime-confirmed records into setup tables

The O119-confirmed 80-color records have a strict LE-typed structural route through Object-2 setup records (`+0x0E` palette pointer array) to the previously verified `0x81DD5` indirect palette allocator call. O120 also documents the 79-color alternatives as separately structured candidate tables. See `CHECKPOINT_2026-10-11_O120_STAGE_PALETTE_SETUP_GRAPH.md`. No live handle/bank assignment inferred. Use `trace_o120_setup_graph.py`, `verify_o120_independent.py` and `test_o120_graph.py` with your own unmodified original `MK2.EXE`.

## O121: palette-table selector and original GRA source ownership

`trace_o121_control_bindings.py` recovers authenticated stage graphics control entries, their encoded palette slot (2 for all 135 observed controls), exact sprite descriptor offsets, and `TOMB.GRA`/`PORTAL.GRA`/`IMAGES.GRA` provenance. The two 79-color candidates formerly labeled for their Tomb/Portal RGB resemblance are **`IMAGES.GRA`-linked** setups, not stage-file alternatives. `audit_o121_tile_layouts.py` qualifies six exact **rectangle** mosaics without claiming opaque pixels or final compositing. Run `verify_o121_independent.py` or `test_o121_control_bindings.py` to check the original binary and source files independently. See `CHECKPOINT_2026-10-11_O121_PALETTE_CONTROL_SPRITE_RESOURCE.md` for full evidence and reproduction.

## O122 indexed stage sprites and setup-local mosaics

The independently checked O121 executable control descriptors point to **49 distinct
valid MK2 indexed sprite streams**, across TOMB.GRA (16), PORTAL.GRA (13), and
IMAGES.GRA (20). Their encoded data forms exact contiguous spans. The O122
exporter combines their opacity masks and 1-based palette-index bytes into 10
setup-local layers (8 Tomb/Portal stage setups and 2 IMAGES setups). The original
80-entry Tomb/Portal palettes have O119 in-game source-perturbation witnesses.
The two 79-color IMAGES palettes have **no** such runtime source witness, and
the one-based interpretation for them is marked provisional.

Commands using original input files (outputs are exclusive new paths):

```sh
python tools/mk2_native_stage_palettes/export_o122_indexed_mosaics.py --exe /path/to/MK2.EXE --game-zip /path/to/mk2.zip --out /new/folder --pngs
python tools/mk2_native_stage_palettes/verify_o122_independent.py --exe /path/to/MK2.EXE --game-zip /path/to/mk2.zip --o121 research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json --o122 research_outputs/O122_INDEXED_LAYER_REPORT.json --portal-control evidence/mk2_o114/20.png --out /new/independent_audit.json
python tools/mk2_native_stage_palettes/test_o122_indexed_mosaics.py /path/to/MK2.EXE /path/to/mk2.zip
node --experimental-strip-types scripts/run-mk2-o122-indexed-mosaic-bridge.mjs /path/to/MK2.EXE /path/to/TOMB.GRA /path/to/PORTAL.GRA
```

The browser-side decoder in `src/games/mk2/research/stageIndexedMosaicsO122.ts`
reproduces the Python output byte-for-byte for all eight stage 80-color setups.
The optional viewer is in the MK2 Advanced Research section. No commercial
original assets are bundled. The renderer computes conditional **setup-local**
layer mosaics, NOT final-stage screen coordinates, layer order, camera state or
which runtime setup was selected.


## O123 — Original Tomb architecture and sky screenshot registrations

O123 tests two additional original indexed setup layers against the untouched Kombat Tomb screenshot from O117. Both are derived from the exact original user-supplied MK2.EXE and game resources by the O122 indexed sprite decoder. The registrations refer to this 637×397 screenshot only; they do **not** report DOS camera RAM values, live palette handles, setup activation objects, or a complete stage compositor.

- Architecture (Object-2 setup `0x1737C`, original 850×224): screenshot-relative source offsets +267 columns, +57 rows under 2× sampling; 960/960 fit pixels and 2,650/2,650 disjoint heldout pixels.
- Orange sky (Object-2 setup `0x173B2`, original 320×80): screenshot-relative source offsets +2 columns, −47 rows under 2× sampling; 1,074/1,074 fit pixels and 823/823 disjoint heldout pixels.
- 14 wrong shifts/repeating-architecture alternatives are falsified using their original sampled RGB values and coverage. Sample ROIs exclude characters, interface and overlapping artwork.

CLI (supply your own authenticated game files; outputs must be new paths):

```sh
python tools/mk2_native_stage_palettes/fit_o123_tomb_architecture.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --screenshot evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png --out /new/O123_REPORT.json
python tools/mk2_native_stage_palettes/verify_o123_architecture_independent.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --screenshot evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png --report research_outputs/O123_TOMB_LAYER_SCREENSHOT_REGISTRATION.json --out /new/O123_AUDIT.json
python tools/mk2_native_stage_palettes/test_o123_screen_registration.py /path/MK2.EXE /path/mk2.zip
```

## O124 original-game screenshot source attribution

`build_o124_scene_provenance.py` combines the previously verified Tomb/Portal backdrop/sky/architecture and floor *source predictions* at their individual screenshot-relative registrations, and produces one color-coded pixel-attribution PNG per original screenshot. Attribution means a projected original source pixel matches the observed screenshot RGB, not that the full runtime compositor or draw order is recovered. Two untouched screenshots have **268,431 / 506,572** capture pixels matched by one or more source predictions, including 128 pixels matching more than one layer. Since uniform colors can coincide, this must not be interpreted as recovered-engine coverage. The two images and independently verified report are in `research_outputs/O124_*`. See `CHECKPOINT_2026-10-11_O124_SCREENSHOT_SOURCE_ATTRIBUTION.md` for exact commands and evidence limits. Original EXE/GRA files must be provided locally. 50 passes is a maximum, not a quota.
