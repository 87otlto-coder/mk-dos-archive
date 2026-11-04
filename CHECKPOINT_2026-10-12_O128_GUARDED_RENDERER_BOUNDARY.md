# MK DOS Archive — O128 guarded renderer and source boundary

**Date:** 2026-10-12. **Priority:** MK2. **Research status:** source-authenticated static code/data only. **Accounting:** one substantive checkpoint, not a 50-pass batch. **Game testing needed:** none for this source-only finding.

## Important correction to O127

O127 correctly established that the source index at Object-2 `0x7747F` is used by `ADD ESI,[0x2EF54+4*EAX]` at file offset `0x9E16A`. However, O127 sampled **31 consecutive DWORDs** because the independent configuration *root tables* have 31 entries. There was no machine-code evidence that the renderer's indexed data had that same extent. This was an overextended inference.

The original source supports **10 consecutive packed-resource candidate DWORDs** at Object-2 `0x2EF54..0x2EF7B` (physical `0xCFBA8..0xCFBCF`). The following Object-2 address `0x2EF7C` (physical `0xCFBD0`) has **its own LE type-7 relocated pointer**, at Object-2 `0x2F1CF` (physical `0xCFE23`), and begins a different-looking DWORD sequence (`0x00A4B7B7`, `0x00A4B7B7`, ...). The first ten DWORDs include source-word zero slots at indices 0, 6, 9; index 1 has high resource byte `0x1C` (Tomb, resource 28); and index 7 has high resource byte `0x19` (Portal, resource 25).

**Careful limitation:** a separately referenced following region is strong evidence for a source-data boundary, **not formal proof** of the original programmer's C array length or maximum permissible runtime index. Neither 31 nor 10 is a verified maximum legal input. O127's 31 raw values are retained for historical reproduction; the project viewer and new code no longer call them a 31-entry authenticated stage-renderer table.

## Guarded invocation and control loop

1. The original Object-1 renderer `0x9E118` has one directly encoded `E8 rel32` caller in the loaded code image: `0x93585`. This is a direct-call census, not proof that indirect calls are absent.
2. The caller's command loop beginning at `0x93547` tests a token; negative `-1` reaches `0x9356E`. It loads source/control registers from three subsequent DWORD fields, advances the control cursor at `0x9357F`, then calls the renderer at `0x93585`.
3. The renderer's opening instruction tests Object-2 `0x562D4` with mask 1. The branch at `0x9E122` skips the body when the bit is clear. The source contains authenticated operations to **XOR**, set and clear the same flag (among 11 typed LE references). This explains a conditional pathway, not its live value during a fight.
4. The same renderer reads saved index `0x7747F` at `0x9E165`, performs its indexed source-word add at `0x9E16A`, bounds destination row access against **200** at `0x9E173`, and calls packed row consumer `0x659C6` from `0x9E191` on the branch that reaches it.

## Reproduce from user's own original MK2 files

The commercial MK2.EXE and .GRA files are **not** distributed in the development-source package. On the canonical DOS executable (`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`):

```bash
python tools/mk2_native_stage_palettes/trace_o128_renderer_gate_boundary.py --exe /path/to/MK2.EXE --out /tmp/O128_REPORT.json
python tools/mk2_native_stage_palettes/verify_o128_renderer_boundary_independent.py /path/to/MK2.EXE /tmp/O128_REPORT.json
python tools/mk2_native_stage_palettes/test_o128_renderer_boundary.py /path/to/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o128-renderer-boundary-bridge.mjs /path/to/MK2.EXE /tmp/O128_REPORT.json
```

A separate verifier (`verify_o120_independent.py` LE parser) rederives source bytes and typed relocations without importing the O128 producer. Tests include forged indexed-value and boundary claims, forged gate/caller/clip metadata, false runtime evidence and tampered input rejection.

## Verification and integration

- O128: 49 independent source assertions; 32 targeted Python tests; 23 browser/Python bridge assertions; isolated TypeScript type-check passed.
- O125, O126, O127 inherited regression suites: 30 + 30 + 34 = **94 passing tests**, plus existing O127 bridge **41 assertions**.
- Browser stage-layer viewer explains the O128 correction and source gate. Actual React production build/visual interaction **not tested**.
- O127 raw report and code are preserved for reproducibility. O128's caveat supersedes the **31-entry renderer-array claim only**, not the independently verified 31-entry *configuration root* arrays.

## Next legitimate boundary

The next useful research is **not to guess a new array length**. Trace the actual producer of the `-1` command tuple and the circumstances of flag `0x562D4` being set while stage setup index 1 or 7 survives to guarded emission. Static data flow may narrow that further; definitive live values require DOSBox state instrumentation. Also preserve the unresolved dynamic camera, palette handle, and other stage layers. MK2 extractor/compiler remains priority; the testing bot and enhanced runtime remain future milestones.
