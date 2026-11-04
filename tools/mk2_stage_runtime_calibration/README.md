# MK2 O113 — experimental floor camera and index mapping calibration

This separate toolset generates cryptographically source-checked **binary position rulers** in the authenticated packed suffixes of all seven original stage `.GRA` files. The runtime kit currently selects only Tomb and Portal, because those are the two stages previously observed to change on screen.

The source repository does not include original game files. To generate a private test kit, run:

```sh
python tools/mk2_stage_runtime_calibration/build_test_kit.py /path/to/mk2.zip /tmp/private_MK2_O113_kit.zip
python tools/mk2_stage_runtime_calibration/verify_test_kit.py /path/to/mk2.zip /tmp/private_MK2_O113_kit.zip
```

The game archive must be the original 614-file canonical MK2 source fixture. Any unexpected byte or structure causes fail-closed behavior. Every standalone game copy has the already runtime-proven O110Z 11-byte F9 menu unlock. Only one source file's original packed suffix is changed in the resource variants. The unchanged original game copy stays untouched.

First collect screenshots of the control **20 Portal**, experimental **24 Portal X ruler**, and experimental **21 Tomb X ruler**, choosing the correct stage via the hidden menu before the first fight. The launcher explains the procedure. All three need actual DOSBox gameplay confirmation; this is not an emulator or an autonomous fighter.

Optional screenshot inspector:

```sh
python tools/mk2_stage_runtime_calibration/inspect_screenshot.py /path/to/24.png --out /tmp/xfit.json
```

This requires Pillow (`pip install pillow`). It analyzes two dominant lower-screen colors and reports candidate source alignments under a restricted model. It explicitly refuses to declare patterns reliable when scores are too low and labels any inferred offset **conditional**, not ground truth. It handles resized screenshots approximately, though true DOSBox native screenshots are preferable.

`analyze_o110z_witness.py` regenerates RGB swatch evidence from the four prior user screenshots. Those swatches **do not** resolve bank ownership, index-to-RGB mapping, or complete stage composition.

Run tests with:

```sh
python -m unittest discover -s tools/mk2_stage_runtime_calibration -p 'test_*.py' -v
```

See `CHECKPOINT_2026-10-11_O113_RUNTIME_CALIBRATION_GATE.md` for audit details and the exact user-input gate. The **O111/O112 two 50-pass batches remain closed**; O113 is a targeted engineering and runtime-validation preparation, not an additional 50-pass claim.
