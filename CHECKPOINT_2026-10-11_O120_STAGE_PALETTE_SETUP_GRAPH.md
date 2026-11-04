# O120 — Authenticated MK2 stage-palette setup-record graph

**Date:** 2026-10-11 | **Priority:** MK2 | **Classification:** static LE relocation provenance after runtime-confirmed O119 record identity | **No additional DOSBox tests run**.

## Why this matters

The O119 gameplay perturbations confirmed that editing the *80-color* Tomb and Portal EXE records recolors their stages. O120 traces these specific source records into **Object-2 setup-record palette tables** and the previously known indirect `ESI+0x0E` palette allocator path. This is stronger than matching RGB values or counting unclassified relocations. It is not proof of a particular runtime palette handle or active DAC bank.

## Canonical object and record identities

- Canonical game executable SHA256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` (861,133 bytes).
- Object-1 file image begins at `0x61C54` (63 pages); Object-2 file image at `0xA0C54` (50 pages). Read from the LE object table, **not** hardcoded as presumed page ownership.
- Full LE fixup stream: **27,004 records**, representing **26,994 unique `(source object, offset)` sites** after **10 identical duplicate/aliased fixups**. All duplicate entries agree. Some fixup sources near the end of the final page are 16-bit and must **not** be wrongly rejected merely because four complete bytes do not fit in the file.

| Candidate | Original counted EXE record | Words | Object-2 palette-table offset | Direct consecutive pointers to record | Authenticated 18-byte setup records |
|---|---:|---:|---:|---:|---:|
| Tomb 80, **runtime perturbed O119** | `0x893C6` | 80 | `0x177D0` | 7 | `0x17358`, `0x1736A`, `0x1737C`, `0x1738E`, `0x173A0`, `0x173B2` |
| Portal 80, **runtime perturbed O119** | `0x891E0` | 80 | `0x16538` | 9 | `0x16514`, `0x16526` |
| Tomb 79 alternate, not perturbed visibly in O119 | `0x8CDBE` | 79 | `0x2E848` | 9 | `0x2E7E4` |
| Portal 79 alternate, not perturbed visibly in O119 | `0x8CD1E` | 79 | `0x2E784` | 9 | `0x2E720` |

The table above counts **34 direct contiguous palette-table pointers**, plus five **additional** typed Object-1 palette references outside the respective 80-color tables (two Tomb; three Portal). That recovers all **39 O118 relocation-backed palette-record references** without inventing a functional role for the five other sites. **The Tomb table contains seven consecutive Object-1 palette pointers, not nine; the other two palette-record fixups are elsewhere in Object-2 graphics structures.** These are not interchangeable counts.

## Exact setup-record shape and executable consumer

Each of the **10** setup records has 18 bytes with three relocation-backed Object-2 pointer fields at offsets `+0x06`, `+0x0A` and `+0x0E`. The last one targets the palette table listed above. The three initial 16-bit values are preserved as **raw words**, not confidently assigned width/height/gameplay semantics. For the 80-color setup records, the graph also captures 24 exact incoming LE references to the setup starts (18 Tomb, six Portal), not proof of execution.

The executable code previously qualified in O96W is rechecked byte-for-byte. O120 additionally traces the **conditional ESI origin**, re-verifying physical `0x81C4E` (`CALL 0x81E16`, a selection helper) and `0x81C53` (`MOV ESI,[EAX]`, setup read from the selected runtime object). The same routine references `[ESI]` and `[ESI+2]` as span-like operands, `[ESI+4]` as a count comparison, `[ESI+6]` as a control pointer, and `[ESI+0x0A]` as another pointer table, before `[ESI+0x0E]` is dereferenced for the allocator. These are exact code/field reads, **not** evidence that a specific Tomb or Portal setup was chosen during the supplied fights.

The palette allocation instructions:

- Physical `0x81DD5`: `ADD EDX,[ESI+0x0E]` — load the array pointer from setup.
- Physical `0x81DD8`: `MOV EAX,[EDX]` — select the palette source pointer.
- Physical `0x81DDA`: `CALL 0x7B439` — known counted palette allocator.
- Physical `0x81DDF`: `MOV WORD [EBP+0x30],AX` — store the returned handle in the object.

**Conditional link only:** If ESI points to one of these ten authenticated setup records during a call through this code, the matching palette table provides the source pointer. O120 **does not verify** that runtime binding, the selector slot, the returned handle, or the DAC start. In particular, the word `widthWord` used in the JSON denotes only the first raw 16-bit field, **not** a verified geometric width.

## Reproduction

From the source root, provide the exact original `MK2.EXE` yourself:

```bash
python tools/mk2_native_stage_palettes/trace_o120_setup_graph.py \
  --exe /path/to/original/MK2.EXE \
  --out /new/location/O120_STAGE_PALETTE_SETUP_GRAPH.json
python tools/mk2_native_stage_palettes/verify_o120_independent.py \
  /path/to/original/MK2.EXE \
  /new/location/O120_STAGE_PALETTE_SETUP_GRAPH.json
python tools/mk2_native_stage_palettes/test_o120_graph.py /path/to/original/MK2.EXE
```

Producer and **separately implemented verifier** each parse all 27,004 LE fixups from the game. The independent verifier rederives **92 graph assertions**, and 23 targeted regressions passed, including 16 falsified source/provenance/semantics cases and an overwrite refusal. Previous O119 Python regressions (12 cases) and the O119 Node/TypeScript contract bridge (15 checks) were rerun successfully. No canonical game files are modified or bundled by this tool.

## Priorities after O120

1. Trace the **producer of ESI** at `0x81DD5` through its callers until a specific `+0x0E` setup record is bound under a defensible control-flow path; if ambiguous, retain its runtime identity as unknown.
2. For runtime handle and DAC-bank ownership, instrumentation of the original emulated execution at palette registration and rendering remains more decisive than additional source-color matches.
3. Extend authenticated palette setup/resource evidence to the remaining five packed stage sources without inventing RGB output or a 50-pass claim.

**Accounting:** O120 is a targeted static provenance and tooling checkpoint, not a fresh batch of 50 substantive gameplay/research passes. O111 and O112 are still the completed 50-pass batches. MK2 → MK1 → MK3 → extractor/compiler; bot/wrapper ideas remain deferred.
