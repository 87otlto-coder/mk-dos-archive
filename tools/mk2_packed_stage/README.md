# MK2 authenticated packed stage-source editor — O111 / 50-pass checkpoint

**This is an opt-in developer/research tool, not a finished general-purpose sprite editor.** It operates only on the canonical Mortal Kombat II DOS resource files confirmed by SHA-256, and only on their existing executable-referenced EOF suffixes. It never edits your original file in place.

## Why it exists

The O110Y–O110Z Windows runtime tests visibly changed the Kombat Tomb and Portal floors by modifying the raw packed suffix of `TOMB.GRA` or `PORTAL.GRA`. The original program uses a **896-byte source-row stride** with a **320-byte transfer** and a runtime palette-base transformation. This editor preserves all 896 source bytes, retains the entire resource prefix and length, and produces a reversible receipt. **Do not use a 320px-wide PNG as a replacement**: that would lose source-row margins and could break the game.

The editor also accepts five more source-qualified suffixes (`BATTLE`, `TOWER`, `FOREST`, `ARMORY`, `ARENA`) for bounded research. Their expected suffix offsets and original resource SHA-256 values are fixed. Runtime-recolored stage/floor semantics are confirmed **only** for Tomb and Portal.

## Usage (Python 3.10+, standard library only)

Run from the project root with your own original MK2 DOS installation:

```bash
# Examine and verify exact source bytes (optionally also verify MK2.EXE's table)
python tools/mk2_packed_stage/mk2_packed_stage.py inspect '/path/to/MK2/tomb.gra' --exe '/path/to/MK2/mk2.exe'

# Losslessly export the original 48 x 896 source-byte plane (NOT an RGB image)
python tools/mk2_packed_stage/mk2_packed_stage.py export-plane '/path/to/MK2/tomb.gra' tomb_source_48x896.bin --report tomb_source_manifest.json

# Change x=288..319 on source row y=5 (new output file, original untouched)
python tools/mk2_packed_stage/mk2_packed_stage.py paint '/path/to/MK2/tomb.gra' tomb_edited.gra tomb_edit_receipt.json --x 288 --y 5 --width 32 --height 1 --value 7

# Replace the complete source plane with another same-length raw 896-stride plane
python tools/mk2_packed_stage/mk2_packed_stage.py replace-plane '/path/to/MK2/tomb.gra' updated_plane.bin tomb_rebuilt.gra rebuild_receipt.json

# Undo, requiring the exact receipt and exact patched SHA-256
python tools/mk2_packed_stage/mk2_packed_stage.py restore tomb_rebuilt.gra rebuild_receipt.json tomb_original_restored.gra
```

The output `*.gra` needs its **canonical resource name** (such as `tomb.gra`) when placed in an **isolated DOSBox test directory**; never copy patched files into your only game installation. Painting a literal value may not produce a particular RGB color, because game palette ownership remains unresolved.

Receipts embed the authentic original packed suffix, making restoration possible without access to the original resource at undo time. Treat receipts as potentially copyrighted game-derived data: **do not distribute them with public source or commits**. They are generated on the user's machine, and none are included in the source checkpoint.

## Verification commands

```bash
python -m unittest discover -s tools/mk2_packed_stage -p 'test_*.py' -v
python tools/mk2_packed_stage/run_50_passes.py '/path/to/your/mk2.zip' research_outputs/MK2_O111_50_PASSES.json
python tools/mk2_packed_stage/verify_50_passes.py '/path/to/your/mk2.zip' research_outputs/MK2_O111_50_PASSES.json
```

The research run and independent verifier each independently read the user-supplied original ZIP; the verifier does not import any of the editor's implementation. The 50 investigations are **seven question families applied to seven independent authentic resources, plus a full-table aggregate**. They are separate, source-backed bounded investigations—not 50 new runtime-discovered systems, and not 50 full in-game validation runs.

Question families: executable-pointer/original identity; row structure; 320-byte center vs 576-byte margins; 32-bit DWORD carry at a **hypothetical** bank 193; one-row writer isolation; last-row edit/undo; poisoned source/receipt rejection. Final pass checks the complete table, the zero slot and a table corruption control.

**No additional Windows DOSBox execution occurred during O111.** Exact stage placement, dynamic palette assignment, full compositor behavior, complete animation and gameplay engine remain open. The original-source archives have not been altered.

## O112 — experimental renderer-index projection and inverse painting

See **[README_O112.md](README_O112.md)** for the new `mk2_stage_projection.py` tool, parameterized hypothetical cameras/palette banks, optional diagnostic grayscale PNG, projected-index-space paint-and-restore, O112 50-pass evidence and independent verification. It **does not** determine actual stage colors or live palette ownership. O111 editor functionality and source authenticity policy remain unchanged.
