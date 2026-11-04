# MK DOS Archive — O110O–O110V MK2 Palette/Stage Continuation

**2026-10-10 | Interim development state: 13/30 substantive passes since O110G**

This continuation uses the original `mk2.exe` (861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). No game binaries or source resources were edited. New code is static investigation plus offline, explicitly synthetic conditional replay. **No live DOSBox trace was produced and MK2 remains OPEN.**

## Newly qualified work — six substantive passes

| Pass | New bounded result | Evidence | Independent checks |
| --- | --- | --- | --- |
| **O110O** | Source-anchored 32 × 8-byte palette queue, 31-record safe pending limit, ring wrap, DAC6 port replay from actual 48/64-color palette words (338 modeled port events). Palette entry-zero update is a different code path. | `evidence/mk2_o110o_o110q/MK2_O110O.json` | Grouped O–Q: 141 |
| **O110P** | Conditional allocator simulator for reuse, release and a later-slot bank relocation. With explicit **synthetic distinct-pointer** source, an existing 64-color record's base moves from 49 to 65 and is queued for re-upload. No assertion that that synthetic request occurs in MK2. | `evidence/mk2_o110o_o110q/MK2_O110P.json` | Grouped O–Q: 141 |
| **O110Q** | Found **31 raw four-byte matches** for global `0x75CE8`: 30 qualified direct accesses and one false numerical match, `CALL` instruction `E8 5C 07 00 00` at `0x99C0A`, targeting `0x9A36B`. | `evidence/mk2_o110o_o110q/MK2_O110Q.json` | Grouped O–Q: 141 |
| **O110T** | Conditional, source-constrained replay of **seven explicitly synthetic histories** at the `MOV EAX,1` packed-stage draw call. Opposite registration order assigns handle 1 to different original records: the 64-color record at bank 49 or the 48-color record at bank 65. Gate-off and unknown-event cases fail closed. | `evidence/mk2_o110t/MK2_O110T.json` | 76 |
| **O110U** | Separately derived palette-zero VGA upload path: writes to index 0 at `0x3C8`, then three DAC6 bytes to `0x3C9`, sets bit `0x8000` in state global. If high bit already set, that path skips the DAC0 write. Synthetic 0 / `0x7FFF` source cases produce DAC `(1,1,1)` / `(63,63,63)` respectively; these are **not observed gameplay colors**. | `evidence/mk2_o110u/MK2_O110U.json` | 73 |
| **O110V** | Typed all 30 direct operands from O110Q: 13 `A3` EAX writes, 3 ModRM register writes, 7 literal `C7 05` writes (5 zero, 2 `0x7FFF`), 1 read-modify-write OR, 4 reads and 2 tests. 16 writes are register-dependent. No completeness assertion for indirect memory accesses. | `evidence/mk2_o110v/MK2_O110V.json` | 144 |

**New independent assertions:** 434 checks, zero failures. **Adversarial controls:** 55/55 falsified reports/source mutations independently rejected. The existing O110K–N verification batch, which also runs O110F–J regression/hostile controls, passes. All samples were derived from the canonical original, without modifying it.

## O110R/S — regression hardening, NOT two additional passes

Additional stage-provenance reports and tests were implemented for the selector-copy chain (`0x82321 → 0x7747F → 0x9E165`) and the `-1` command-token triple (source pointer, destination Y and row count, consumer at `0x93585`). The independent tests pass **102 assertions** and reject **15/15** deliberate mutations.

**Independent historical cross-check found that both mechanisms were already qualified in O96B** (with further corroboration in O96C–E and O97F). The R/S scripts are kept as new regression coverage **but are excluded from milestone progress**. Do not promote them as new discoveries or use them to inflate the 30-pass checkpoint count.

## Important execution boundary

The source-derived replay models show *why* code-adjacent palette pointer loads cannot establish the palette present in stage-renderer handle 1. Missing authoritative runtime inputs include the active palette-table contents at `0x9E118`/`0x659C6`, draw gate, palette-zero state, actual queue sequencing, stage source selector, row count and compositing layers. Synthetic traces are not game execution, and no new correctly colored MK2 gameplay scene is claimed.

This environment has no runnable DOSBox/DOSBox-X/debugger. An actual runtime capture is needed to close the handle-one identity claim. In the meantime, substantive MK2 work can pivot to unresolved `VFRAME.GRA`/`PLAYSTA.GRA` witness ownership, animation/descriptor linking, nonstandard graphics, and stage composition without assigning unsupported RGB.

## Reproduction

From the updated source root, with the original MK2 files in `/path/to/mk2`:

```bash
python scripts/verify-mk2-o110o-o110v-batch.py /path/to/mk2
python scripts/verify-mk2-o110o-o110v-batch.py /path/to/mk2 --full
```

The first command runs all new positive source checks, R/S regression, and the inherited K–N and F–J regressions. `--full` also reruns all 70 O–V and R/S falsifications; they were separately run successfully during development. The source does not include copied game binaries. This is an **interim preservation package (13/30)**, not the 30-pass consolidation and not an MK2 completion claim.
