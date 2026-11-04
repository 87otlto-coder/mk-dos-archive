# O131 — MK2 packed floor row geometry

Read-only research against the canonical original `MK2.EXE` (`861133` bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`).

```sh
python trace_o131_packed_draw_geometry.py --exe /path/to/MK2.EXE --out /new/O131_GEOMETRY.json
python verify_o131_packed_draw_geometry_independent.py /path/to/MK2.EXE /new/O131_GEOMETRY.json /path/to/mk2.zip
python test_o131_packed_draw_geometry.py /path/to/MK2.EXE /path/to/mk2.zip
node --experimental-strip-types scripts/run-mk2-o131-stage-row-geometry-bridge.mjs /path/to/MK2.EXE /new/O131_GEOMETRY.json
```

The Node command runs from the project root. The test that imports the O112 projection model uses the included `tools/mk2_packed_stage` directory. The producer imports O120/O130 source-tracers, while the verifier imports a **separate** LE relocation parser; the verifier does not import the O131 producer. The original game ZIP is required only for the seven-resource-length audit. No game files are included here.

The `zeroScrollIllustration` figures are conditional calculations, **not measurements**. The first stream operand points beyond the original EXE's file-backed object data; the corresponding runtime DWORD must be observed or traced further.
