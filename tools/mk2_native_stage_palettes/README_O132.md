# O132 — full native stage layer source packs

```
python export_o132_scene_layer_pack.py --exe /path/to/MK2.EXE --game-zip /path/to/mk2.zip --out /new/directory --stage both
python verify_o132_scene_layer_pack_independent.py --exe /path/to/MK2.EXE --game-zip /path/to/mk2.zip --bundle /new/directory --o122-report ../../research_outputs/O122_INDEXED_LAYER_REPORT.json --o121-report ../../research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
python test_o132_scene_layer_pack.py --exe /path/to/MK2.EXE --game-zip /path/to/mk2.zip --o122-report ../../research_outputs/O122_INDEXED_LAYER_REPORT.json --o121-report ../../research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
```

Requires Pillow, Python 3.10+. Never overwrites existing output directory or original game files. Outputs complete 896-pixel source floors, discrete O122 setup mosaics, and all 29 native sprite streams (including any portions clipped from mosaics) as RGBA PNG, index PNG and opacity PNG; all derived from canonical input and documented by JSON. The 896×504 16:9 canvas is a **composition guide only**. Stage parallax, animated sequence timing and all final-world layer placements are explicitly **unrecovered**. Do not use this manifest to infer a stationary scene or artificial motion.
