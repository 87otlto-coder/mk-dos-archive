# MK DOS Archive — O97M–O97O — Mountain Accumulator Initialization and Nine-Value Arithmetic

**2026-10-09 · Authentic DOS MK2 · verified static analysis · MK2 OPEN**

## New evidence

### O97M: initialization is not a single zero-only contract

- Object-1 code at physical `0x86A95..0x86AC3` broadcasts **the current EAX DWORD** into nine accumulator slots, Object-2 offsets `0x84330, 0x8432C, …, 0x84310`.
- Caller `0x81B88` zeros EAX and calls `0x86A95`; this is a supported zero-broadcast path, and then invokes `0x826FA`, whose nine stores zero increment/source slots `0x8430C, 0x84308, …, 0x842EC`.
- A different caller `0x81F17..0x81F23` reads a signed 16-bit setup field, shifts the sign-extended value 16 bits, and passes **that nonconstant value** into `0x86A95`. This disproves unconditional zero-only interpretation.
- `0x81FDE..0x81FF2` clears base source `0x842E4` and initializes base accumulator `0x842E8` from `0x75D16 << 16`. Additional writers exist, including conditional word table selection at `0x860EA..0x860FC`; therefore this is not a universal fixed initial value.

### O97N: eighteen nine-DWORD arithmetic routines

- **18 distinct, contiguous, authenticated Object-1 functions** at `0x82487..0x826FA` each read nine DWORDs via runtime global `0x75D22` and populate increment slots at `0x842EC..0x8430C`.
- Per-word variants are arithmetic right shift, copy, add shifted component, scale by 2/3/4/5, add a half to scaled values, and corresponding signed negations. Signed arithmetic shift rounds toward negative infinity for negative odd values, not toward zero. Destination arithmetic wraps modulo 2³².
- All 18 routines are executable-backed and independently checked; **this does not establish which routine is called for the Mountain configuration or how often**.
- Code at `0x81F4A..0x81F55` installs the source pointer into `0x75D22` from a setup record after an earlier indirect callback.

### O97O: exact Mountain-specific nine-DWORD source

- The previously qualified Mountain config (Object-2 `0x1C2E6`) contains a relocation-backed pointer at `0x1C2FA` to Object-2 `0x172DC`.
- Independent parsing of all **27,004 executable LE relocations** confirms the pointer as genuine, target Object 2, not a coincidental numeric value.
- The nine serialized source DWORDs at `0x172DC..0x17300` are:

  `0, 0, 0, 49152, 49152, 73728, 73728, 98304, 0`

- The nine original source values, all **18 × 9 = 162 conditional arithmetic outputs**, exact routine addresses, full code block bytes, and hashes are recorded in the attached three JSON evidence reports. These are *alternatives*, not 18 simultaneous execution observations.
- Q16.16 interpretations such as 0.75/1.125/1.5 are arithmetically possible, but video timing, pixels/frame, camera units, selected routine and runtime coactivation are **not established**.

## Verification

| Pass | Independent verifier checks | Failures |
|---|---:|---:|
| O97M | 77 | 0 |
| O97N | 247 | 0 |
| O97O | 317 | 0 |
| **New combined** | **641** | **0** |

Each verifier independently reads `mk2.exe`; O97O additionally rebuilds the native LE relocation list. Deliberate falsifications of a broadcast address, a negative-shift output, and a fake pixels-per-frame classification were all rejected (**3/3**), with originals restored and passing. Previous O97I (27,192), O97J (27,191), O97K (96), O97L (44) independently passed regressions (54,523 additional checks).

Reproduce (from extracted source directory, with genuine fixture at `$FIXTURE/mk2.exe`):

```bash
python scripts/run-mk2-o97m-accumulator-initializers.py "$FIXTURE" .
node scripts/verify-mk2-o97m-accumulator-initializers.mjs "$FIXTURE" .
python scripts/run-mk2-o97n-nine-value-transform-bank.py "$FIXTURE" .
node scripts/verify-mk2-o97n-nine-value-transform-bank.mjs "$FIXTURE" .
node scripts/run-mk2-o97o-mountain-nine-input-profile-matrix.mjs "$FIXTURE" .
python scripts/verify-mk2-o97o-mountain-nine-input-profile-matrix.py "$FIXTURE" .
python scripts/test-mk2-o97m-o97o-negative-controls.py "$FIXTURE" .
```

## Preserved limits and next target

**Proven:** bounded initialization and update alternatives; Mountain setup-specific 9-DWORD serialized increment input; code-qualified 18-way arithmetic transform bank; conditional input installation chain. **Unproven:** active profile-selection logic for the battle plan, actual cadence, camera scroll units and visible crop, final palette/RGB output, timing, frame rate or executed scene.

**Next O97P:** trace selectors or call sites for `0x82487..0x826D7` to determine whether a particular profile can be tied to the authenticated Mountain setup and its installed process, without asserting a runtime selection on structural proximity alone. If the branch cannot be closed, pivot to other remaining MK2 graphics/palette/audio blockers before returning to MK1 and MK3. Extractor/UI work remains deferred.
