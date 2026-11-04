# O205 — Correct MK2 Kombat Tomb / The Pit gameplay identity

**Date:** 2026-10-17. **Nature:** forensic correction + native-source-to-video pixel witness, **not** new GUI or completed stage render.

## Error corrected

The 39.85-second DOSBox recording `Recording 2026-10-15 215828.mp4` was labeled **The Pit II** by the O203 video-intake script and subsequent summaries. This identification was **incorrect**. The video shows the red/orange **Kombat Tomb** stage, associated in the original MK2 executable with **TOMB.GRA** (resource ID 28). **PIT.GRA** (resource ID 32) contains a distinct blue/purple structure belonging to **The Pit**. These are separate stage resources; do not conflate them.

This correction was prompted by the user's observation that the two stages are different. The script and original O203 artifacts have intentionally **not been altered**, in order to preserve historical evidence. O205 explicitly supersedes the O203 **stage label**, not its actual measured video-to-video displacements. Subsequent analyses of this recording must identify it as Kombat Tomb. O204 Portal findings are unaffected.

## Source and video verification

All sources are the exact original user fixture with the SHA-256 hashes recorded in `O205_corrected_stage_identity.json` (MK2.EXE, TOMB.GRA, PIT.GRA, video). Original descriptor source setup offsets in executable Object 2:

- **Kombat Tomb:** `0x17358`, `0x1736A`, `0x1737C`, `0x1738E`, `0x173A0`, `0x173B2` — 6 validated setup-local graphics layers, `TOMB.GRA` resource ID 28, palette word record at physical EXE offset `0x893C6` (80 words).
- **The Pit:** `0x18B44`, `0x18B56`, `0x18B68`, `0x18B7A`, `0x18B8C`, `0x18B9E` — 6 validated setup-local graphics layers, `PIT.GRA` resource ID 32, source-linked palette pointer via Object-2 `0x18D40` to 81-color original record.

The original decoder decoded all 12 setup-local layers without malformed graphics commands. Source previews use game-linked candidate palettes, not necessarily a captured live DAC palette. Original layer masks and clipping remain distinct. These are source-local setups, not automatically assembled scene composition.

At gameplay time **3.5 seconds**, a unique 35×30 source feature at `TOMB.GRA` setup 3 local `(136,85)` appears in the native-resolution recording at `(130,27)`; source-local translation is `(-6,-58)`. On all 1,050 opaque pixels of the selected patch, the mean absolute per-channel RGB difference is **15.176825 / 255** after lossy-video capture. It strongly corroborates the source's identity; it does not prove complete scene assembly.

Eight additional timestamped source-patch matches (`0.5`, `3.5`, `7`, `12`, `18`, `24`, `30`, `35` sec) are recorded with scores and alternate-placement caveats. Repeated skull motifs allow multiple horizontal candidates; **do not derive final parallax/camera equations from strongest-template positions alone**. The matched vertical origin is 27–28 at most samples and 38 at 24 sec, compatible with the visible gameplay camera response but not an independently established implementation mechanism.

## Deliverables

- `stage_identity_comparison.png`: recorded original gameplay, original TOMB setup 3, distinct original PIT setup 2; inset original and video-matched patch.
- `original_source_layers/tomb/*`: six source-local Tomb previews.
- `original_source_layers/pit/*`: six separate original Pit previews.
- `recorded_tomb_setup3_source_local_alignment.png`: diagnostic source-local layer placement only.
- `O205_corrected_stage_identity.json`: all fixture hashes, controls, descriptors, palette sources, placement and pixel-match evidence.
- `O205_source_feature_matches.json`: eight source-to-video source-feature match candidates, including alias caveats.
- `scripts/verify-o205-kombat-tomb-pit-identity.py`: deterministic read-only reproducer with canonical fixture SHA guards.

## Reproduce

```sh
python scripts/verify-o205-kombat-tomb-pit-identity.py --exe /path/to/MK2.EXE --tomb /path/to/TOMB.GRA --pit /path/to/PIT.GRA --video '/path/to/Recording 2026-10-15 215828.mp4' --out /fresh/O205
```

Requires NumPy, Pillow, OpenCV. Inputs are never modified. The evidence ZIP includes original *derived* PNGs and reports but not the original commercial GRA/EXE or full video. The archival source ZIP contains the reproducer and research text, not commercial data.

## Research follow-up

1. Reuse O203 measured **Kombat Tomb** video motions under corrected identity. Test them against the Tomb-specific original O133 source renderer ratios (not Forest or Pit assumptions), resolving patterned architecture aliases with source-registered placements.
2. Match Tomb's independent railing and floor layers across video for multiple camera positions. Keep source-local coordinates separate from runtime positions.
3. Obtain a **separate real The Pit** gameplay video before assigning any live motion to PIT.GRA. Existing decoded PIT.GRA source layers remain valuable independently.
4. Resume Portal source-to-video timing investigation after establishing an adequate frame sampling rate.

## Verification boundary

Canonical source fixture hashes checked; 12 original setup-local layers decoded; native pixel patch checked; 8 timestamped observations reported. Full MK2 scene compositor, palette activation, Pit gameplay comparison, original renderer camera equations and Vite app build are **not** established by this milestone. No inherited O204 source file was modified or removed.
