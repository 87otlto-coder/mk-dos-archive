# O206–O207 — Kombat Tomb video-calibrated source geometry; distinct The Pit roots

**Date:** 2026-10-17. **Predecessor:** O205 authoritative corrected Tomb/Pit source identification.
**Status:** source-authenticated static pointers and signed 16.16 values; video-corroborated Tomb component placement and qualified *empirical* horizontal motion. No original game input was modified, and no live scene mode or exact horizontal camera calculation has been proven.

## O206. Tomb and Pit original mode-root structure (source-authenticated)

The original user `MK2.EXE` SHA-256 is `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. We reparsed 27,004 original LE relocation records (26,994 unique physical source sites) and verified stage-select table pointers in all three mode tables.

- **Kombat Tomb**, source stage index **1**. Mode == 2 root Object-2 `0x171F0`: fixed 16.16 group references setups **1,2,3,5,6**; accumulator-linked group also references **1,2,3,5,6**. Alternate source root `0x1726C` for mode == 1 or fallback: fixed group **1,2,4,6**, accumulator group **1,2,3,6**. **These two group memberships differ in the alternate root**; do not describe the whole mode as a simple four-layer combination.
- **The Pit**, source stage index **6** (distinct from Kombat Tomb). Mode == 2 root `0x18990` links setups **1–6** in both reference groups. Mode == 1 and fallback share root `0x18A1C`, linking setups **1,2,6**. Its original 16.16 stage-input table is at Object-2 `0x18A84`: `(0,0,0.09375,0.1875,0.1875,0.375,1.5,1.5,0)`. This is *not* a verified gameplay parallax equation.
- The Pit's bounded original control stream at Object-2 `0x18AA8` contains ten positive two-DWORD pairs and a zero terminator. It has **no negative-one packed-floor command within that stream**, unlike Kombat Tomb's original packed-floor command. This does **not** prove no floor is ever rendered elsewhere.

### Tomb source-linked vertical operands and gameplay witness

In Tomb's original mode-2 fixed group, the setup-3 architecture has `-58 << 16`, and setup-6 orange sky has `+46 << 16`. Predicted native-screen difference is **104 rows**. Source-to-video SIFT features were independently matched against the 39.9s *correctly identified Kombat Tomb* recording (`Recording 2026-10-15 215828.mp4`). 39 frames sampled at 0.5s...38.5s. **34/39** samples contain qualifying independent sky features at the source-predicted relative Y difference (+/-1), **111** supporting correspondences. Control differences +96 and +112 have zero support under the same X-selection gate. This is direct source-to-video correlation of a static numeric relationship, not proof of runtime mode selection.

The sky remained near x=0 in these selected matches while architecture moved, so their video motion is distinguishable. Repeated skulls produce alternative original-source horizontal X shifts ~170–180 pixels apart; all raw matches are preserved and an exact camera transform is not assigned.

## O207. Original Tomb floor: native pixel and scroll witness

The original `TOMB.GRA` packed source floor begins at byte offset **63776** and contains exactly **896×48** original indexed pixels, decoded with Tomb's own executable-linked 80-color palette. Its stage stream at Object-2 `0x17320` contains an original `-1` packed-floor command with destination Y **158**, requested rows **56**, and runtime pointer operand `0x8432A`. The source plane remains **fully uncropped** in the export; original source rows beyond the runtime display clip are preserved.

Taking the architectural layer's observed vertical displacement from its original source value -58 and applying that displacement to the original floor destination 158 predicts the actual native-screen floor Y to within **one row at 38/39** sampled moments. For 38/39 eligible samples, a deliberately shifted +8-row control scores worse. The -8-row control is worse at 25/26 eligible moments. The notable exception is **15.5s**, retained in the raw evidence; local effects/occlusion/aliasing remain possible and cannot be assigned a cause without new evidence.

Floor horizontal source-X windows were fitted at the *source-predicted vertical position* across all 896 columns, independently of architecture X. A first video camera sweep (0.5–8.5s, **nine qualifying frames**) gives the **empirical** architecture/floor displacement coefficient **0.827497**. When predicting a *separate* return sweep (20.5–30.5s, **nine qualifying frames**), its held-out mean absolute positional error is **1.282 pixels**. Alternative 0.75 and 1.0 coefficients yield respective held-out errors of **14.299** and **35.086** pixels after fitting each alternative's intercept only on the training sweep. This is a **video-space regression**, not a verified original executable scroll formula or exact frame-by-frame camera state.

The source-backed diagnostic PNGs composite only the original sky, original architecture and original packed floor at independently matched positions; they intentionally omit fighter sprites, HUD, extra railings, animated effects, and a verified final draw order. No authentic complete Tomb gameplay frame is claimed.

## Evidence and reproducibility

- `scripts/verify-o206-tomb-pit-runtime-source.py` — authenticates EXE/TOMB/PIT/video SHA-256 and LE typed relocations, independently redecodes source layers through the preserved O205 decoder, tests the original 104-row relation and exports raw feature matches, conditional root matrix and PNGs.
- `scripts/verify-o207-tomb-floor-video.py` — authenticates the original packed-floor command, source plane and palette, tests vertical alternatives and fits a two-sweep held-out empirical motion model; exports 39 original floor match records, independent controls, fully uncropped pixel/index PNG and two partial scene comparisons.
- In the forensic ZIP, `O206/` and `O207/` contain raw data, summaries and plots; original unmodified `MK2.EXE`, `.GRA` and full video are NOT bundled. The original file SHA-256 hashes and script copies are included for replay.
- Both stages retain separately addressable original layers. **The Pit has no matching gameplay recording in this conversation**. It cannot be video-verified with Tomb footage, and the newly decoded Pit mode graph is strictly static evidence.

## Verification and limits

Both producer scripts ran against the canonical original fixture, and a second fresh run reproduced every output byte-for-byte. Corrupted executable input was rejected by the SHA guard. All inherited O205 project files are retained byte-for-byte with no existing research-engine or application UI edits. **No new Vite/React build is claimed.** The exact Tomb camera formula, active stage root, full graphics draw order/occlusion, live DAC palette-bank state, Pit gameplay parallax and missing dynamic elements still require further source or runtime evidence.

## Next input actually needed

To apply the Forest/Portal/Tomb source-to-video methodology to **The Pit**, request a genuine DOSBox recording of the *blue/purple Pit stage* for 30–45 seconds, with motion left and right, then a jump or comparable vertical camera event. This is **not** another Kombat Tomb clip. A gameplay recording alone may still be insufficient to prove the exact selected mode or callback activation; RAM/trace instrumentation would be needed for that narrower question.
