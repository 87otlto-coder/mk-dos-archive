# MK DOS Archive — O110C: seven executable-derived packed-stage viewport projections

**2026-10-09 · Original DOS Mortal Kombat II · Source-backed bounded research · MK2 REMAINS OPEN**

## Significant advance: exported authentic-source 320-byte scanline projections

The seven packed suffixes have *not* been promoted to complete 320×200 gameplay backgrounds. They now have a source-executable-backed deterministic **320×R viewport projection**, an optional horizontal source-position and a precisely modeled palette-base operand. Each projectable row is reproduced with the authentic 80-iteration DWORD ADD rather than by cropping bytes and shifting pixel values independently.

**Original raster input:** 320 distinct 896-byte source rows; 286,720 source bytes, preserved in the export. Seven resources and source-order lengths:

| GRA suffix | Rows | Packed source offset | Native packed resource ID |
| --- | ---: | ---: | ---: |
| `TOMB.GRA` | 48 | 63,776 | 28 |
| `BATTLE.GRA` | 40 | 59,436 | 34 |
| `TOWER.GRA` | 64 | 56,268 | 30 |
| `FOREST.GRA` | 32 | 198,116 | 27 |
| `ARMORY.GRA` | 56 | 126,336 | 26 |
| `PORTAL.GRA` | 40 | 56,916 | 25 |
| `ARENA.GRA` | 40 | 90,488 | 31 |

**Twenty-eight controlled render experiments:** x=288 for all original rows with hypothetical palette-bank starts 1 and 193, plus x=176 and x=400 for 16 source rows each under bank start 1. Thus 7×4 outputs; 276,480 pixel bytes in these derived viewport outputs, in addition to the lossless 286,720 original suffix bytes. Outputs are 8-bit index planes and independent grayscale PNG diagnostics, **not** original game frames or authenticated stage RGB.

## Native-source derivation and important traps

1. `0x93585` calls protected-mode routine `0x9E118`, which calls packed resource emitter `0x659C6` at `0x9E191`. The previous O96/O102 evidence fixed those code paths; O110C independently rechecks their CALL displacements and authentic instruction ranges.
2. `0x9E118` uses source x from low 16 bits of ESI, establishes a neutral center **0x120 = 288**, and calculates a signed 16.16 adjustment of `(288 - x)*65536 / 112` with signed truncating division. `0x9E173` clips destination row index against 200. **896−320=576=2×288** is an exact structural fit for a centered 320-byte viewport into the source stride.
3. `0x659C6` reads palette handle **slot 1** (`mov eax,1` immediately before call) from the dynamic eight-byte-stride palette handle table at `0x75B00`; the base byte is at `0x75B06 + 8×handle`. It decrements that base byte and selects a DWORD from a *file-backed* 256-entry LUT in Object-2 at `0x1084` (file physical `0xA1CD8`). LUT DWORD `i` equals `i*0x01010101`. The same byte base table is used by MK2's normal indexed-sprite renderer and written by the real palette allocator at `0x7B4B1`. Palette bank starts are established **dynamically**: no source-backed fixed runtime bank start is assigned to the seven suffixes here.
4. Each row emits 80 little-endian DWORD outputs, each computed as `(nativeDWORD + replicatedBaseDWORD) & 0xFFFFFFFF`. This is **not** guaranteed to equal a separate modulo-256 byte addition, because carries can propagate across neighboring byte channels. Under the intentionally high hypothetical bank start 193, naive per-byte shifting differs for **six of seven** centered projections (TOMB remains below the carry boundary). This independently falsifies a tempting incorrect renderer simplification.
5. After each row, the accumulator grows by the computed signed 16.16 adjustment; its signed high word is subtracted from the **next 896-byte source-stride position**. For test x=176/400, the adjustment is ±1 pixel per row *increasing*, producing **triangular** cumulative displacement, not a constant ±1 crop shift. Without bounding row count, off-row reads would eventually occur in our synthetic test. Accordingly x=176 and x=400 examples stop at **16 rows**, and the verifier proves every read remains within its corresponding 896-byte row. The game selects caller row counts and positions dynamically; no unsafe extrapolation beyond test conditions is made.
6. The emitted strips visibly resemble stage-floor/perspective artwork, especially TOWER and PORTAL. **Visual plausibility supports but does not prove actual runtime stage selection, composition, naming, Z-order, frame rate, palette ownership, or playback activation.** Source data are genuine. Chosen x and hypothetical bank starts are controlled inputs, not recorded gameplay camera or palette state.

## Independent tests and hostile controls

- Separate Node verifier **277,954 passing checks**, independently re-reading original `MK2.EXE` and all seven original `.GRA` resources. It rederives authenticated resource ID+offset entries from the packed table; rechecks Object-2 replicated-byte LUT; independently models x86 little-endian 32-bit addition and 32-bit signed accumulator with `BigInt`; compares **every emitted pixel byte**, all 28 raw data assets, and associated digests.
- Separate Python PNG audit **276,592 passing checks**: decodes all 28 PNGs with Pillow and independently compares every PNG gray channel to its indexed source payload.
- Four adversarial tests **4/4 rejected**, including modified bytes *with an updated manifest hash*, forged camera, false assertion that 32-bit carries do not matter, and forged packed-source offset. Restored package passed again.
- Previously authoritative O110B LZW/fontrun verification: **4,640,455 checks, zero failures**. O110A held-14 component verification: **5,111,493 checks, zero failures**. No prior source was mutated.
- **Total new + selected regression checks: 10,306,494**, zero failures. This is not a count of unique image pixels or automatically verified gameplay frames.

## Deliverables and reproduction

Packaged source scripts:

```bash
python scripts/run-mk2-o110c-stage-viewport.py "$MK2/mk2.exe" "$MK2" /tmp/o110c
node scripts/verify-mk2-o110c-stage-viewport.mjs "$MK2/mk2.exe" "$MK2" /tmp/o110c/MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip
python scripts/verify-mk2-o110c-viewport-png.py /tmp/o110c/MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip
python scripts/test-mk2-o110c-negatives.py "$MK2/mk2.exe" "$MK2" /tmp/o110c/MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip scripts/verify-mk2-o110c-stage-viewport.mjs
python scripts/create-mk2-o110c-stage-diagnostic-contact.py /tmp/o110c/MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip /tmp/o110c/contact.png
```

The separated asset package is `MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C_2026-10-09.zip`. It holds original suffix index planes, 28 320-pixel-wide indexed raster variants and grayscale PNGs, and a machine-readable manifest with all exact byte lengths, row counts, source hashes and output hashes. The contrast-enhanced seven-resource contact sheet is a *visual diagnostic only*. It is not an authentic color palette or gameplay screenshot.

## What remains and next priority

**Do not raise exact-full indexed coverage beyond 110/124 on this evidence alone.** The seven source raster strips now have executable-backed bounded viewport projections, which is a more specific qualification, but their palette selection and full-screen compositing are not resolved. Two former held intro resources (`PROBE.GRA`, `ACCLAIM.GRA`) were separately recovered as complete LZW images at O110B. `FONTS.GRA` command tape is syntax-qualified, but glyph boundaries and character mapping remain unresolved and font conversion remains *low priority*. `CAVE.GRA` 120-byte candidate syntax and `MONKS.GRA` word runs still lack executable-qualified graphic ownership. `VFRAME.GRA` and `PLAYSTA.GRA` competing descriptor interpretations remain open.

**Next actions:** Trace palette-handle slot 1's runtime palette record selection, the seven suffixes' actual row count and destination row positioning in the control walker, and their final compositing with other layers. If those are not statically resolvable, explicitly preserve as runtime-dependent and progress to other high-value MK2 animation/palette blockers. The user does not want soundcard troubleshooting or speculative stage labels.

Eventual extractor product constraints: basic default soundbank plus optional user-provided soundbank/sample mapping; standalone usable font output optional and low priority. Research order MK2 → MK1 → MK3 → UI/usability → extractor.
