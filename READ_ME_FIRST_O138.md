# MK DOS Archive — Source through O138

O136/O137 recovered **43 original source-ordered effect frames** in six original animation lists across Kombat Tomb, Portal and Tower, with independently verified pixel-perfect individual PNG and raw index/mask exports. O138 now traces the original per-frame source reader through the executable to the code that can write the new sprite descriptor pointer into a render object's `+0x3C` field.

Source findings are distinct from a runtime playback timeline: **no verified FPS, activation triggers, live sprite placement or parallax**; Tower's palette record remains source-associated rather than DOSBox-verified. The original commercial MK2 game files are required for extraction and excluded as newly bundled inputs. Some historical research evidence in the inherited project may contain extracted original media data.

Read `CHECKPOINT_2026-10-12_O137_TOWER_AND_ORIGINAL_ANIMATIONS.md`, `CHECKPOINT_2026-10-12_O138_FRAME_RENDER_OBJECT_BINDING.md`, and `MK_DOS_Archive_MASTER_HANDOFF_2026-10-12_THROUGH_O138_ANIMATION_BINDING.md`.
