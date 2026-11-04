# MK DOS Archive — O98P–O99I Twenty-Pass Graphics Stress Test

**2026-10-09 · authentic MK2 · 20 consecutive research passes · new graphics coverage 110/124 · MK2 remains OPEN**

## Result and evidence hierarchy

Twenty executable/asset investigations completed with an independent JavaScript verifier after a separate Python producer. **554,997 independent checks / zero failures**; each of **20 deliberate report corruptions was rejected**, and all original reports passed again. The verifier reparsed all **27,004 LE relocation records** and independently decoded **535 eight-byte descriptor instances** plus **413** O69 source-witness stream comparisons. Legacy O69, O95W, O96X/Y, and O98D–O98O regressions passed **122,114 checks** total.

This is a discovery of **a file-backed eight-byte indexed-graphics descriptor family** in original MK2 Object 2: `u16 width, u16 height, u32 packed_resource_reference`, with a high-byte pool resource index and a 24-bit byte offset. The family is verified against actual resource bytes using the previously established transparent-skip / indexed-RLE / aligned-literal grammar; there is no transfer of MK1 semantics.

## Twenty-pass outcome table

| Pass | Question and resources | Outcome |
|---|---|---|
| O98P | Three reused control-cursor installer contexts | Verified three distinct cursor installers; no shared runtime-scene inference |
| O98Q | STORY.GRA | 1 new exact-full indexed resource |
| O98R | IMAGES.GRA | 1 new exact-full indexed resource |
| O98S | DEDPOOL.GRA | 1 new exact-full indexed resource |
| O98T | KONTIN.GRA | 1 new exact-full indexed resource |
| O98U | BIO.GRA | 1 new exact-full indexed resource |
| O98V | T1HDRS.GRA | 1 new exact-full indexed resource |
| O98W | T2HDRS.GRA | 1 new exact-full indexed resource |
| O98X | ENDH.GRA | 1 new exact-full indexed resource |
| O98Y | ENDV.GRA | 1 new exact-full indexed resource |
| O98Z | COPY.GRA | 1 new exact-full indexed resource |
| O99A | LOGO.GRA | 1 new exact-full indexed resource |
| O99B | PLAYSEL.GRA | 1 new exact-full indexed resource |
| O99C | STONE.GRA | 1 new exact-full indexed resource |
| O99D | PORTAL.GRA | Decoded bounded 8-byte family; full-resource claim held |
| O99E | ARMORY.GRA | Decoded bounded 8-byte family; full-resource claim held |
| O99F | FOREST.GRA | Decoded bounded 8-byte family; full-resource claim held |
| O99G | TOMB.GRA | Decoded bounded 8-byte family; full-resource claim held |
| O99H | TOWER.GRA, ARENA.GRA, PIT.GRA, TITLE.GRA, VFRAME.GRA | 2 new exact-full indexed resources |
| O99I | BATTLE.GRA, CAVE.GRA, FONTS.GRA, PLAYSTA.GRA | Decoded bounded 8-byte family; full-resource claim held |

## Exact-full promotions (15)

**Ten complete eight-byte families:** `STORY.GRA`, `IMAGES.GRA`, `DEDPOOL.GRA`, `KONTIN.GRA`, `BIO.GRA`, `T1HDRS.GRA`, `T2HDRS.GRA`, `ENDH.GRA`, `ENDV.GRA`, `COPY.GRA`.

**Five complete hybrid eight-byte + original O69 twelve-byte families:** `LOGO.GRA`, `PLAYSEL.GRA`, `STONE.GRA`, `PIT.GRA`, `TITLE.GRA`. Each joint sequence has an independently verified exact transition and ends at GRA EOF, with no overlapping encoded spans within the adopted joint sequence.

New resources account for **1,605,228 encoded source bytes**. Starting from O69 **94/124**, with O96Y's authenticated `MOUNTAIN.GRA` as number 95, the additional 15 make **110/124 exact-full indexed graphics resources** (**14 still held**). Source indexed pixels and masks are exportable, but correct RGB palette handle ownership and actual runtime compositing are not proven. Do **not** rewrite the frozen O69 census as if it had already contained this later work.

## Remaining and rejected hypotheses

- **`VFRAME.GRA`**: the new ten-piece 8-byte decoding covers 0–47,384 and O69 covers 47,384–EOF, but the old O69 also decodes 0–19,152 through a different valid descriptor. Therefore **do not** claim a unique exact-full sprite segmentation.
- **`BATTLE.GRA`**: two exactly repeated 20-record 8-byte descriptor arrays decode the same 0–59,436 prefix. The 35,840-byte suffix belongs to the separately verified packed-reference region, but its raster/layout semantics remain unresolved. Not exact-full indexed.
- **`CAVE.GRA`**: 49 gapless indexed streams cover bytes 120–57,312, leaving **120 leading bytes** structurally unqualified. Not exact-full indexed.
- **`PORTAL`, `ARMORY`, `FOREST`, `TOMB`, `TOWER`, `ARENA`**: their newly qualified leading streams do not cover independent raw/opaque suffixes; no blanket promotion.
- **`FONTS`, `PLAYSTA`**: this eight-byte scan does not close the established O69 ambiguity/coverage limits.
- **Control cursor** `0x15D60`: three independent installers, still no verified scene coactivation.
- **`PROBE.GRA`, `ACCLAIM.GRA`, `MONKS.GRA`** and other held resources remain for a subsequent bounded investigation; no new fixed-identity animations or correct-color gameplay screenshots claimed.

## Independent reproduction

With the original game fixture extracted as `$FIXTURE` (containing `mk2.exe` and `.gra` files), from archive root:

```bash
node scripts/run-mk2-broad-indexed-census.mjs "$FIXTURE" "$WORK"
python scripts/run-mk2-o98p-o99i-twenty-pass-graphics.py "$FIXTURE/mk2.exe" "$FIXTURE" "$WORK/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json" "$WORK"
node scripts/verify-mk2-o98p-o99i-twenty-pass-graphics.mjs "$FIXTURE/mk2.exe" "$FIXTURE" "$WORK/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json" "$WORK"
python scripts/test-mk2-o98p-o99i-twenty-pass-negative-controls.py "$FIXTURE/mk2.exe" "$FIXTURE" "$WORK/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json" "$WORK" scripts/verify-mk2-o98p-o99i-twenty-pass-graphics.mjs
```

All twenty source JSON reports, the regenerated O69 input, paired O95W baseline, coverage ledger, producer, independent verifier and negative-control runner are retained in the archive. **Research sequence remains MK2 → MK1 → MK3 → UI/usability → extractor**. The next pass should address the **14 held resources**, especially the explicitly unclassified stage raw tails and incompatible VFRAME segmentations, rather than chasing scene-globals without new evidence.
