# O136 — Original MK2 Tomb & Portal source-ordered animation sprites

**Source-backed animation-frame breakthrough.** The executable and original stage `.GRA` files jointly authenticate **five ordered sprite-frame lists, containing 36 separately decoded original frames**, beyond the static O122 stage mosaics. This is stronger than O135's coroutine-only evidence: the source routines actually select these sprite-descriptor pointer lists. It is not yet a timed playback export.

| Original pointer list (Object-2) | Stage | Ordered frames | Original sprite resource byte span | End-of-list source token |
|---|---|---:|---|---|
| `0x17814` | Tomb flying effect A | 8 | `TOMB.GRA 0xEADC–0xF920` | Word `1`, typed back-reference to `0x17814` |
| `0x177EC` | Tomb flying effect B | 8 | `TOMB.GRA 0xD438–0xEADC` | Word `1`, typed back-reference to `0x177EC` |
| `0x164B4` | Portal swaying hanging figure | 7 | `PORTAL.GRA 0x8C48–0xC8D0` | Word `1`, typed back-reference to `0x164B4` |
| `0x164D8` | Portal hanging figure detail | 7 | `PORTAL.GRA 0xC8D0–0xD9E4` | Zero terminator |
| `0x164F8` | Portal electric effect | 6 | `PORTAL.GRA 0xD9E4–0xDE54` | Zero terminator |

All 36 descriptors carry original width, height, signed local offsets and packed resource ID/offset. Every referenced sprite stream decodes using the previously authenticated O122 indexed command grammar; all 36 consecutive source ranges join perfectly inside each list, and adjacent lists are also gapless. Tomb effects begin immediately after the known O122 Tomb static sprite chain; Portal effects begin immediately after the known O122 Portal static sprite chain.

## Original EXE code provenance

- Tomb effect routines at `0x82D33` and `0x82D9A` assign `0x17814` and `0x177EC`, respectively, to their effect-pointer global. The Tomb frame lists contain the source loop marker and LE relocation-backed back-pointers.
- Portal source routines assign `0x164D8` and `0x164F8` at `0x828FF` and `0x82994`. The larger `0x164B4` Portal list is assigned at **two** initialization sites (`0x82746`, `0x82764`) and copied through the helper's per-object field `+0x5C` into the animation-stream pointer by the registered routine at `0x8280C`. This is why that third Portal track wasn't initially obvious.
- At `0x86CC5`, the original command-list interpreter consumes sequential DWORD entries; branch `0x86D14` handles a source marker `1` and relocates the active sequence pointer to the linked list start. Other source lists terminate with `0`. These are static interpreter semantics, not a captured in-fight timeline.
- O135's coroutine waits and original runner arguments are retained as **encoded scheduler counts**, never translated to FPS or seconds without independent timing verification.

## Actual deliverables

- `tools/mk2_animation/export_o136_original_sequences.py`: exports each original source-ordered frame as an individual transparent RGBA PNG **plus raw palette-index and mask planes**, with a strict source-provenance manifest. Outputs are new directories only; original inputs are never edited.
- `tools/mk2_animation/verify_o136_independent.py`: independent command interpreter and original-file-to-RGBA comparison, without importing the O136 producer.
- `tools/mk2_animation/test_o136_sequences.py`: adversarial regression and source-preservation tests.
- `src/games/mk2/research/stageOriginalEffectFramesO136.ts`: original-resource-only browser decoder; TypeScript output compared with Python manifest.
- `scripts/run-mk2-o136-original-effect-bridge.mjs`: browser/Python parity checker.
- `src/components/MK2IndexedStageMosaicsO122.tsx`: adds a frame-list selector, source-order preview and **individual frame PNG export** for Tomb and Portal. No synthetic playback speed is assigned.

**Full-scene policy unchanged:** all sprites retain their original dimensions and local offsets. These additional small animated objects are **not** flattened into the full-width stage background or clipped to the original 320×200 gameplay camera. O132–O135's 115 layer PNGs remain unchanged.

## Independently checked qualifications

- Source EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Tomb/Portal resource SHA-256: the canonical O122 values are required.
- Five frame lists; 36 ordered frames; 108 corresponding index/mask/PNG files.
- Python independent verifier audits **40,259 assertions** across these frames, including every exported RGBA pixel.
- Browser/Python parity: **423 checks**.
- O136 regression suite: **24 tests** passed, including deliberately falsified manifests and incorrect original files.
- Individual TypeScript module passes standalone typechecking. Full React app/browser execution and DOSBox stage-effect activation are **not** verified.

## Boundaries and next work

Recovered: source-ordered individual sprite frames, original indexing and masks, descriptor-local placement, source list control markers. **Not recovered:** exact live execution, actual FPS or seconds, precise per-stage placement/draw order, relative parallax during gameplay, triggers and when the original routines switch frame lists. Conditional source waits may help future timed playback work but don't by themselves establish real-time duration. Maintain this distinction in every export.

## Reproduction

```sh
python tools/mk2_animation/export_o136_original_sequences.py --exe /your/MK2.EXE --game-zip /your/mk2.zip --out /fresh/original_effect_frames
python tools/mk2_animation/verify_o136_independent.py --exe /your/MK2.EXE --game-zip /your/mk2.zip --folder /fresh/original_effect_frames
python tools/mk2_animation/test_o136_sequences.py --exe /your/MK2.EXE --game-zip /your/mk2.zip --folder /fresh/original_effect_frames
node --experimental-strip-types scripts/run-mk2-o136-original-effect-bridge.mjs /your/MK2.EXE /your/TOMB.GRA /your/PORTAL.GRA /fresh/original_effect_frames/O136_FRAME_SEQUENCE_MANIFEST.json
```
