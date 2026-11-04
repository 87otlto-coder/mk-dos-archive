# O202 Forest relative parallax — analysis and user test

This checkpoint extends O201 with a video-validated test of the *original source renderer ratios* (O198). It does not change the browser UI, original research decoders, or commercial game files.

## Prerequisites

Python 3.10+, `numpy`, `Pillow`, `opencv-python`, plus the original MK2 Forest recording and the O196/O197/O198 forensic ZIPs. The recorded video and commercial game data are not embedded in the source release.

Run from the `MK-DOS-Archive` source folder, substituting your actual paths:

```powershell
py -m pip install pillow numpy opencv-python
py scripts/verify-o202-forest-parallax.py `
  --video "Recording 2026-10-15 213702.mp4" `
  --o196 "MK2_O196_Forest_Original_Floor_Forensic_Evidence_2026-10-15.zip" `
  --o197 "MK2_O197_Forest_Five_Original_Layers_Forensic_Evidence_2026-10-15.zip" `
  --o198 "MK2_O198_Forest_Conditional_Root_Graph_Forensic_Evidence_2026-10-15.zip" `
  --output O202_local_results
```

Results include `REPORT.json`, 150 feature-match rows, raw pixel-translation matches, 60 alternative-model pixel-control scores, motion SVG and eight visual frame comparisons, plus a GIF. The extraction script is deliberately pinned to the O201 recording's native capture rectangle (642×430 with viewport x=1,y=30,w=640,h=400) and rejects other video dimensions. This is **not** a generic video ingestion tool yet.

Validate the separate supplied forensic evidence ZIP without needing OpenCV:

```powershell
py scripts/audit-o202-forest-parallax.py "MK2_O202_Forest_Parallax_Forensic_Evidence_2026-10-15.zip"
```

## Next videos: Portal and Kombat Pit

When convenient, record a **30–45 second** original DOSBox clip for each stage, preferably with an uninterrupted full-screen visible viewport, an initial stationary interval, walking both ways to move the camera, and another stationary interval. If possible, avoid opening menus during capture and keep one capture at one resolution/crop. Any native display zoom level is fine if the capture area is unambiguous. Source game files should remain unmodified unless you explicitly identify a patched copy. Upload recordings and identify which stage/test version they represent; the same measurement method can be adapted after that stage's original layers are selected. Distinct stages may have different dynamic layers and may not support all Forest metrics.

The graphical workbench remains on the O201 UI. A live React/Vite build is not claimed in O202.
