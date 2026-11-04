# MK DOS Archive — Pass 1E.3O.39 STRIPPED BIGEMP Process Qualification

Status: **VERIFIED**

Verdict: `MK1_STRIPPED_BIGEMP_MULTIPART_VIEW_SELECTION_ESTABLISHED`

O39 resolves O30's external STRIPPED-family child callback `0x276B4` through authentic Watcom symbols as `BIGEMP_PROC` in `EMP.ASM`. All three `STRIPPED_MOD` variants unconditionally spawn the process as process ID `0x2000`.

The process creates a five-part multipart from local setup list `0x128FE`, directly binds the count-prefixed 23-colour `EMP_P` / `YANG_P` record at `0x10356` through `EMPCLP2 +0x0C`, anchors the multipart at world animation coordinates `(558,42)`, sets every part's primary sort field to `0x00010000`, and inserts every part into `BAKLST4` / renderer plane 4. Its parts use ordinary scroll projection; the 0x4000 no-scroll flag is not set.

Seven exact five-part frame records are selected by signed-high-word `WORLDTLX`. Every eight scheduler ticks, values `<=169` select index 3; otherwise the index is `min(6, floor(abs(589-x)/60))`. This is a deterministic view/camera-driven state function, not an autonomous frame cycle. The initial STRIPPED camera X=405 selects state 3 / `EMPHEAD1`.

Twelve unique `FU8HDRS.GRA` descriptors used by setup/view state decode successfully and all opaque indices are inside `EMP_P`. Independent Python reconstruction re-read canonical `MK1.EXE` and `FU8HDRS.GRA`, matched all key code signatures, all 12 sprite checksums, the palette record, seven frame records, selector results and part positions.

Boundaries retained: adjacent `EMPEROR_CLAP` is out of scope; absolute first process/display phase, universal scheduler-tick/display equivalence and wall-clock timing are not established; no write path is introduced.
