# O133 stage movement source words

Original `MK2.EXE` supplies a nine-DWORD signed 16.16 table per stage configuration; the selector provides that table to several rate-setting paths. The render loop increments nine accumulators, while stage commands use their high halfwords. These original values are **not measured playback motion rates**.

```sh
python trace_o133_stage_motion_sources.py --exe /path/to/MK2.EXE --out /new/O133_STAGE_MOTION_INPUTS.json
python verify_o133_stage_motion_independent.py --exe /path/to/MK2.EXE --report /new/O133_STAGE_MOTION_INPUTS.json
python test_o133_stage_motion_sources.py --exe /path/to/MK2.EXE
```

No original commercial EXE or GRA data is bundled with this tool. The O132 scene exporter includes per-stage provenance, and remains uncropped and animation-preserving rather than flattening or synthesizing footage.
