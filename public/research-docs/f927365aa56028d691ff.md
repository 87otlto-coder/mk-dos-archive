# MK2 held-14 lossless component format (O110A)

The standalone zip contains one directory per resource. `original.gra` is an unchanged copy. `indexed/*.idx8` is a width×height array of original byte palette **indices**; the corresponding `*.mask8` has one byte per pixel (0 transparent, 1 opaque), and `*.preview.png` is grayscale+alpha for **inspection only**. Every indexed member has descriptor physical byte address, source interval, dimensions and hashes in `MANIFEST_O110A.json`.

`packed_raw896/source_rows.bin` preserves the original suffix with an executable-proven 896-byte source-row stride, and `diagnostic_grayscale.png` is an uncolored 4× vertically enlarged view. It does **not** imply an original 896-pixel-wide gameplay screen.

`unresolved/unqualified_*.bin` holds original bytes with no qualified decoder. Five such ranges are presently open. Alternative/overlapping VFRAME and PLAYSTA interpretations intentionally coexist. All originals remain available byte-for-byte; the manifest is backed by an independent source audit. No palette handles or runtime layering have been inferred.
