# MK DOS Archive — O110W Controlled MK2 runtime diagnostic builds

Date: 2026-10-10. Status **IMPLEMENTED / STATICALLY VERIFIED / REAL DOSBOX VALIDATION PENDING**. This is NOT a closed 14th research pass; checkpoint tally remains **13/30** pending actual runtime evidence.

The user volunteered to test edited DOS executables during real gameplay, following the MK1 controlled-edit precedent. O110W creates exact, reversible original-executable modifications for bounded runtime experimentation.

Canonical MK2 executable SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, 861,133 bytes. The patch builder refuses any other source.

Seven total variants including canonical baseline:

- `BASELINE`: untouched original.
- `PAL48_MAGENTA`: `[uint16 count 48]` at `0x88918` retained; words 1..47 changed to RGB555 `0x7C1F`, word 0 retained.
- `PAL64_GREEN`: `[uint16 count 64]` at `0x8C77C` retained; words 1..63 changed to RGB555 `0x03E0`, word 0 retained.
- `BANK_START_1`, `BANK_START_49`, `BANK_START_65`: `MOV AL,[EAX*8+0x75B06]` at physical `0x659EA`, bytes `8A 04 C5 06 5B 07 00`, replaced in-place with `B0 xx 90 90 90 90 90`, preserving length. This tests the packed stage blitter's bank-byte lookup, **not** source-record ownership directly.
- `STAGE_SKIP`: one-byte branch change at physical `0x9E122` (`74 73` -> `EB 73`) causes the guarded packed stage render to branch to the existing early-out path; does not alter the target displacement or surrounding code.

Every variant is exactly source-length; whole-EXE comparison yields only expected changed positions. Independent `verify-mk2-o110w-runtime-probes.py` regenerates expected patches from the canonical binary, verifies all variants bytewise, checks changed-byte manifests and SHA-256, and reverses observed changed positions back to the canonical original SHA-256. Static verification: **283 assertions passed** across seven variants. This does not guarantee runtime safety or that the affected instructions execute in all modes.

Deliverables include ready-to-mount complete MK2 directories (to eliminate wrong-root testing) and compact EXE-only variants, scripts and manifest. Never overwrite canonical fixture. Keep original game data intact. Ask the user for same-stage/same-characters comparison screenshots/video and launch/crash outcome, identifying the exact test folder. The controls can qualify original record consumption and renderer-path effects, but even combined are not by themselves a live palette-handle/owner trace. A more targeted instrumentation experiment could follow informed by user observations.

Reproduction from source root:

```bash
python scripts/build-mk2-o110w-runtime-probes.py /path/to/original/mk2.exe /path/to/output/probes
python scripts/verify-mk2-o110w-runtime-probes.py /path/to/original/mk2.exe /path/to/output/probes
```

No previous 30-pass tally was advanced by this speculative runtime-facing patch. Runtime verification and interpretation remain pending.
