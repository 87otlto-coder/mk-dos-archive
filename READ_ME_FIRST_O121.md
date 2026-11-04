# MK DOS Archive — O121 continuation

Start with `CHECKPOINT_2026-10-11_O121_PALETTE_CONTROL_SPRITE_RESOURCE.md` for new source-level discoveries and exact commands; for complete prior history use `MK_DOS_Archive_MASTER_HANDOFF_2026-10-11_THROUGH_O121_PALETTE_CONTROL.md`.

**The main correction:** Similar-looking 79-color palette records map to `IMAGES.GRA` (file ID 22), not Tomb/Portal stage graphics. The original runtime-confirmed 80-color Tomb/Portal records each have a typed setup path through **palette slot 2**. All ten setup families yield 135 verified control rows and 49 unique sprite descriptors. Six group rectangles tile exactly, but their opacity, runtime activation and final screen composition are not established.

The source archive contains project code, research/evidence and documentation; it does not intentionally include original game executables or `.GRA` commercial assets. Running evidence tools requires your own exact original MK2 directory or ZIP. Node metadata bridges passed; **full React application build is not verified**.

O121 is not another invented 50-pass batch. No new DOSBox inputs are required for the static findings; the next live-handled palette assignment question needs emulator instrumentation.

**Distribution note:** The prior source ZIP included two original GRA demo files, which were deliberately excluded from O121 for rights/source hygiene. See the manifest for names and hashes of preserved/removed entries.
