# MK DOS Archive — O110A Held-14 Lossless Graphics Component Extraction

**2026-10-09 · Authentic DOS Mortal Kombat II · MK2 OPEN**

## Scope and outcome

All **14** previously held root `.GRA` resources are exported byte-for-byte, along with every descriptor-backed indexed image currently qualified by the game executable, distinct alternative interpretations, and every separately qualified packed source-row region.

- Original files: **14/14 preserved exactly**, source-total **1,838,252 bytes**.
- Independently re-decoded: **572 descriptor instances** (`8-byte` and `12-byte` instruction witnesses), representing **552 unique encoded source intervals**. Twenty duplicate intervals are kept as separate executable witnesses, not misrepresented as new artworks.
- Each instance: native-resolution **8-bit pixel-index array**, independent **8-bit transparency mask**, plus clearly marked **diagnostic grayscale+alpha PNG**, never claimed to use the authentic palette.
- Packed raw source: **7 resources / 320 rows / 286,720 bytes**, each an exact **896-byte source row** from the executable's packed-resource pointer and 896-byte stride. Diagnostic previews visualize 896-byte rows, **not verified game-screen width or correct-color output**.
- **9/14** resources are fully covered at the source-byte level by qualified indexed streams and/or packed-row regions. Competing interpretations remain parallel, not forced into one rendition.
- Five files retain exactly one unqualified interval each: **CAVE (120 bytes), FONTS (103,840), PROBE (327,672), ACCLAIM (2,036), MONKS (2,432)**: **436,100 bytes total**. They are extracted *unaltered* both as original resources and as unqualified `.bin` segments.
- **No change to the strict exact-full indexed resource total: 110/124.** Source-byte coverage and byte-preserving extraction are not the same as authentic image semantics or executable-proven display composition.

## Independent validation

A separate verifier reads **the original MK2.EXE**, all fourteen authentic `.GRA` resources, and the generated asset ZIP. It reimplements the indexed decoder, checks descriptor bytes and packed references, compares every native index/mask payload, validates every diagnostic PNG pixel, checks raw source rows and the original-resource digests, and independently recomputes source-byte coverage. **5,111,493 checks; zero failures.**

Four deliberate false reports (bad pixel hash, false 895-byte row stride, fabricated full-image interpretation, incorrect byte-coverage count) were rejected with altered manifests. Original report passes after restoration.

Prior independent regressions: O100D–O100W **81,416/0**, O100X–O102A **109,898/0**. **191,314 checks, zero failures**.

## Reproduction

```bash
python scripts/run-mk2-o110a-held-graphics-extraction.py "$MK2" "$MK2/mk2.exe" /tmp/o110a_out docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json evidence/mk2_o98p_o99i
python scripts/verify-mk2-o110a-held-graphics-extraction.py "$MK2/mk2.exe" "$MK2" /tmp/o110a_out/MK2_HELD14_LOSSLESS_COMPONENT_EXPORT_O110A.zip
python scripts/test-mk2-o110a-held-graphics-negatives.py "$MK2/mk2.exe" "$MK2" /tmp/o110a_out/MK2_HELD14_LOSSLESS_COMPONENT_EXPORT_O110A.zip scripts/verify-mk2-o110a-held-graphics-extraction.py
```

## Important distinctions and subsequent work

1. A lossless resource copy is an extraction result; it does **not** automatically make every byte a decoded graphic. Five unqualified structures remain, and VFRAME/PLAYSTA have competing valid indexed witnesses.
2. Seven packed suffixes have source-backed 896-byte row strides and diagnostic panoramas, but correct palette translation, runtime row origins, and exact final 320×200 compositing remain unproven.
3. `CAVE.GRA` has a prior bounded 46×1 decode hypothesis for its 120-byte prefix, but no authenticated owner; keep as a candidate. `FONTS.GRA` needs a prefix-owning consumer. `MONKS.GRA`, `PROBE.GRA`, and `ACCLAIM.GRA` are currently unqualified as indexed imagery; they may represent nonstandard or non-image data.
4. Do not raise 110/124 or animation totals without complete, independent format-owner proof.
5. The eventual extractor (not yet to be implemented per user-approved game research order) must allow a **basic default soundbank** and optional **user-supplied banks/sample collections**. Accepting custom banks is a product requirement, not a claim that the current prototypes support any particular bank format; any WAV/sample support must have documented mapping and licensing boundaries. Original audio and native score data remain available independently.

**Next MK2 work:** Executable consumers of unresolved Cave/FONTS/PROBE/ACCLAIM/MONKS, VFRAME competing presentation modes, mixed-renderer palette translation; then remaining animation, identity/palette and stage closure. Do not abandon MK2 prematurely. **MK2 → MK1 → MK3 → UI/usability → extractor.**
