# O235 — Pit II fatality tile object lists to conditional display path

Status: **CANONICAL SOURCE VERIFIED**; no original runtime framebuffer trace; does not prove `FALL.GRA`58 was presented.

Original selector `0x80721` selects a descriptor-and-tile coordinate stream including five steps of source texture58. Objects are created by `0x64548`, and `0x646B4` jumps to `0x665EB`. The latter inserts a new object in the object head list `0x84358`, sorted by object DWORD at +`0x20`, then +`0x1C`. Each new tile object is tagged with `0x070B`. Ahead of the next selector step, `0x86BB1`/`0x86C3F` removes objects with tag `0x070B` from list heads `0x84358`, `0x84360`, `0x84364`.

Original frame routine `0x66E34` calls `0x67050`, which begins with `0x935E6` sorting/maintenance over the three lists through `0x93647`, before conditional frame drawing/composition `0x933C2`, VGA retrace routine `0x7B30B` (status port `0x3DA`), and video-memory transfer routine `0x65420` (one branch copies to `0xA0000` through `0x65521`). **This proves a structural route from selected tile to the shared object/frame machinery, but not an uninterrupted single-object draw path, buffer-swap timing, or visibility of graphic 58**. The existing O233 negative timing result stands.

Read-only verifier: `scripts/verify-o235-pit-wall-object-present-gate.py --game-zip <owner ORIGINAL mk2 zip> --out <new empty destination>`. Twice identically SHA-256 `e62fdbd49797e11ce559520bcc549adb3ba9fe31c384f6f49150244a514a0053`. Nineteen deliberate source mutations rejected.
