# MK DOS Archive — Pass 1E.3O.41 Renderer History / Clipping / Equal-Key Order Handoff

**Status:** VERIFIED (read-only/static canonical-fixture qualification)  
**Verdict:** `MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED`

## What O41 closes

O29 established renderer list traversal, sort keys and camera projection but left exact-equal sort-key order dependent on insertion/culling history. O41 follows the canonical maintenance and special-list code far enough to explain that dependency precisely and to identify one bounded fresh state where the tie order is deterministic.

### Special lists

Canonical `YZSORT` at Watcom `0x11111` repeatedly repair-sorts `OBJLST` (`0x563BC`), `OBJLST2` (`0x563C4`) and `OBJLST3` (`0x563C8`) by object `+0x18`, then signed 16.16 `+0x14`. The adjacent-swap comparator swaps only strict inversions. Exact-equal keys are therefore stable with respect to the list's current order.

List `0x563B8` is qualified as the shadow special list: `SHADST` inserts into it through the dedicated wrapper at `0x11307`; `DISPLAY_ALL` temporarily substitutes `SHAD_SCRNTL` for the normal top-left/min render bound while drawing it, then restores `SCRNTL` before `OBJLST`.

Renderer clipping uses descriptor dimensions against the active rectangle. Flag `0x4000` bypasses camera subtraction. Low-byte flag `0x80` selects object-local clip-byte inputs at `+0x36/+0x37`; O41 preserves that bounded observation without inventing broader semantics.

### Ordinary BAK active-set history

`BAKCLR` at `0x42C8` clears BAKLST0..8, zeroes the placement-occupancy region beginning at `BAK0BITS` (`0x49910`, `0xE4` dwords), and restores BAK module sentinels. `BACKGROUND` at `0x45F0` executes `MULTI_PLANE` on an eight-scheduler-tick cadence.

`BGND_UD1` expands the current renderer rectangle by exactly 68 pixels horizontally and 48 vertically. Active objects that leave that expanded window are unlinked, have their placement occupancy byte cleared and return to `OFREE`. Placement records are subsequently scanned in increasing record-index order; eligible occupancy-zero records are recreated and inserted with `INSOBJ_V`.

`INSOBJ_V` inserts a newly created exact-equal key before an existing equal peer. Surviving peers retain their relative order. Therefore arbitrary later BAK tie order is genuinely camera/cull/recreate-history dependent rather than merely unresearched.

## Fresh-initial PIT fixture established for O42

For the deliberately bounded state:

`BAKCLR / empty occupancy -> PIT initial camera X=211,Y=35 -> first MULTI_PLANE ordinary-background population`

with a 320x200 viewport, the expanded active world rectangle is X `[143,599)` and Y `[-13,283)`. `bridge0BMOD` contributes no active/visible placement; `bridge1BMOD` contributes 15 active records:

`50,58,59,72,75,77,96,115,124,143,144,165,169,188,216`

Six intersect the viewport:

`58,72,75,124,143,169`

Fresh creation scans increasing record index, while exact equals insert before existing equals. The exact head-to-tail plane-1 draw order is therefore:

`169 -> 124 -> 72 -> 143 -> 75 -> 58`

The equal-key 169/124 pair overlaps geometrically, so this tie order can materially affect raster output.

## Evidence / validation

- authentic `MK1.EXE` SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- 15 exact canonical code signatures checked in the implementation;
- O28/O29 prerequisites required and hash-bound;
- independent Python audit re-read the code bytes and directly reparsed the canonical `bridge1BMOD` placement/descriptor records from EXE, reproducing the same 15-active / six-visible set and fresh draw order;
- no write path introduced.

## Boundaries preserved

O41 does **not** establish a history-independent total order for arbitrary later BAK snapshots. Scheduler ticks remain non-wall-clock units. It does not claim special-list gameplay semantics beyond the exact lists/behaviors qualified above, and it does not itself claim a complete stage raster.
