# O205 corrected Kombat Tomb / Pit video identification

The DOSBox clip `Recording 2026-10-15 215828.mp4` is **Kombat Tomb**, not The Pit. O203's historical label and corresponding resource-provenance entry were incorrect. Its actual video feature correspondences remain usable observations for **Kombat Tomb**. The separate `PIT.GRA` extraction is valid but has no matching runtime video yet.

From the repository root, install NumPy/Pillow/OpenCV in an isolated Python environment, then run:

```bat
python scripts\verify-o205-kombat-tomb-pit-identity.py --exe C:\path\MK2.EXE --tomb C:\path\TOMB.GRA --pit C:\path\PIT.GRA --video "C:\path\Recording 2026-10-15 215828.mp4" --out C:\path\O205_evidence
```

The tool fails closed when the known original source files or recording hashes differ; the emitted report includes source-local offsets, exact stage resource IDs, PNG previews and a native-pixel feature match. The script is **read-only** and does not bundle original MK2 binaries or video.

See `CHECKPOINT_2026-10-17_O205_KOMBAT_TOMB_PIT_STAGE_IDENTITY_CORRECTION.md` for details, limitations and follow-up.
