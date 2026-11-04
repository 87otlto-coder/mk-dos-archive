# MK DOS Archive — O203 Portal and Pit II comparative video evidence

Status: **Video intake / measured feature candidates**. This does **not** claim source-verified Portal or Pit II parallax, camera equations, scene composition, palette activation, or animation tick rates.

## Input recordings

- `Recording 2026-10-15 215828.mp4`: MK2 The Pit II, 39.83s, H.264 644×432 at 30fps. SHA-256 `5295afece147c8de1978ab67db6aaa1cd0beb1db4a32b369dfd0ff289de16c44`.
- `Recording 2026-10-15 220325.mp4`: MK2 Portal, 36.63s, H.264 638×426 at 30fps. SHA-256 `18290d9850dc4a6f936aadd6086b03dd95bc43df6541ab97baa7bb280957963c`.
- Independent MK2 test fixture `MK2.EXE`: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- `PIT.GRA`: SHA-256 `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`.
- `PORTAL.GRA`: SHA-256 `cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82`.

## Method and measurement limits

Crop DOSBox title bars and normalize picture to 320×200. The Pit II capture uses [x=2,y=32,w=640,h=400]; the Portal capture uses [x=0,y=26,w=638,h=400]. The Portal screenshot's width is slightly less than 640 screen pixels, so the 320-native-pixel conversion includes a small horizontal rescaling. This is not pixel-exact extraction of the original DOS video buffer.

Use SIFT feature matches from t=0.5s to t=3,7,12,18,24,30,35. Match descriptors with a 0.7 ratio criterion, reject displacement larger than ±25 vertical pixels, and group original keypoints into upper scenery (y38–89), middle scenery (y90–144) and floor/lower (y145–199). Export every retained match (coordinates, dx,dy,descriptor distance) and the top five competing displacements in each region. A top mode is an **observation candidate**, NOT a measured renderer channel or established camera position; repeating columns, railings and floor ornaments produce alias shifts.

- Pit II: **1,689** retained SIFT correspondences over seven reference-to-target pairs. At 3s, upper and middle features favor horizontal shifts of approximately +48 and +50 native pixels. At 7s, upper features favor +22 whereas lower features favor +5, but competing offsets at ±180/195 pixels from repeating architectural motifs make exact layer motion ambiguous. At ~24s, features include approximately +12px vertical movement during a jump. No original scene-layer decomposition has been derived.
- Portal: **1,804** retained SIFT correspondences. At 3s and 7s, many architectural/floor features match the opening frame at zero translation despite visually moving hanging figures/vortex content; later samples include y=+12 candidates around 12s and 24s. Moving figures, vortex animation, foreground characters and camera effects require separate masks/controls before quantitative parallax or animation timing is established.

## Key result

Both clips are suitable for source-to-video testing, but **do not transfer Forest's 1.5/1.125/0.9375/0.75/0 renderer-input values to either stage**. A proper O204 test should identify each stage's source layer descriptors and native pixel planes, then correlate them against video with separate masks for dynamic objects. The Pit II captures offer repeated architecture suited to testing camera/parallax, subject to motif aliases. Portal provides a good control for static backdrop versus separate hanging-figure/vortex animations, building on O187/O189 evidence.

## Reproduction

From the project root with Python 3, NumPy, Pillow, OpenCV installed:

```powershell
py scripts/verify-o203-portal-pit-video.py --pit "Recording 2026-10-15 215828.mp4" --portal "Recording 2026-10-15 220325.mp4" --fixture "PATH_TO_MY_MK2_DIR" --output O203_results
```

Input commercial game files and the two full source videos are not distributed in the resulting O203 source/evidence packages. Outputs contain only derived gameplay stills, diagnostic data and reproducibility instructions. Existing O202 research code and documents remain unchanged.
