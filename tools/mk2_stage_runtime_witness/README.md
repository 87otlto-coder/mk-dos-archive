# O114 — MK2 X-ruler runtime screenshot witness

This stage of the research **consumes actual user DOSBox screenshots**, rather than generating new binary probes. Original sources are available in the full O113 seven-installation kit. The three new gameplay screenshots reside under `evidence/mk2_o114/`.

Run at repository root, after installing Pillow:

```sh
python tools/mk2_stage_runtime_witness/fit_o113_ruler.py evidence/mk2_o114/21.png --stage tomb
python tools/mk2_stage_runtime_witness/fit_o113_ruler.py evidence/mk2_o114/24.png --stage portal
python tools/mk2_stage_runtime_witness/fit_o113_ruler.py evidence/mk2_o114/20.png --stage portal
python tools/mk2_stage_runtime_witness/verify_o114_witness_independent.py
python -m unittest discover -s tools/mk2_stage_runtime_witness -p 'test_*.py'
```

The tool uses the 32-cell binary source ruler and only two RGB swatches per stage, previously observed in the O110Z experiments. It compares candidate offsets on individual rows; reports never claim access to the emulator's camera or palette memory. Inputs at non-native dimensions are explicitly flagged and horizontally normalized approximately.

See `CHECKPOINT_2026-10-11_O114_RUNTIME_XRULER_RESOLVED.md` for the full evidence and next DOSBox tests (22, 25, 23, 26).
