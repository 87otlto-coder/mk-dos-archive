# MK DOS Archive — O97G — Executable Mountain Conditional Runtime Setup Installer

**2026-10-09 SAST · Original MK2 DOS binary · independent verifier PASS · MK2 RESEARCH OPEN**

**Parent:** O97F, `MK-DOS-Archive-2026-10-09-O97F-source.zip`. The O97F source-backed index-13 configuration lookup was verified independently and remains frozen.

## Material finding

O97F proved that literal **13** is passed into an index writer and selects the same Object-2 configuration record `0x1C2E6` from each of three 31-DWORD selection tables. O97G follows the selected configuration into `0x81EB2`, with the **specific condition that the indirect callback at physical `0x81F47` returns**. The caller itself must be invoked; execution is not presumed from code existence.

The executable's interpreter at `0x81F55..0x81FA7` authenticates, in one bounded sequential path:

1. Source `0x1C2FA` is a Type-7 Object-2 relocation to `0x172DC`; code stores it in global `0x75D22` at `0x81F4F`.
2. Source `0x1C2FE` is a Type-7 Object-2 relocation to **`0x15D60`**, one of the authenticated O96H positive-token pointer-pair records; code stores this pointer in **`0x75CF6`** at `0x81F5A`.
3. Source `0x1C302` is a Type-7 relocation to writable runtime slot **`0x77453`**; code loads this as EBX before entering its assignment loop.
4. At source `0x1C306`, code loads relocated setup pointer **`0x1C31E`** (39-image tower). As it is neither 1, -1 nor -2, opcode `89 03` at `0x81F9C` writes **the address `0x1C306`** into slot **`0x77453`**—a pointer-to-pointer, not the setup address directly. EBX and EAX advance by 4 and 8 respectively.
5. At source `0x1C30E` the DWORD is **1**. The explicit marker branch at `0x81F78` writes **1** to slot **`0x77457`**, advances both cursor and slot pointer by 4.
6. At source `0x1C312`, the relocated setup pointer is **`0x1C330`** (ten-image 320×200 landscape). The ordinary branch writes source address **`0x1C312`** to slot **`0x7745B`** and advances.
7. The next source at `0x1C31A` contains **0xFFFFFFFF**, which the actual `83 3D ... FF` signed immediate compare recognizes as its terminal, returning at `0x81FA6`.
8. Independently qualified eight-row producer `0x81BB3` reads these runtime list heads and does an additional dereference at `0x81BD9` / `0x81C53`, enabling the two distinct image setups to be selected **conditionally**.

All relevant serialized pointers have independently verified LE Type-7 fixups. The callback at `0x1C2F6` is a Type-7 Object-1 relocation to `0x21227`. The exact callback semantics and runtime invocation conditions are not established by this pass.

**The important promotion is from adjacent serialized pointers to a single verified machine-code *installation* path for BOTH setups and the positive-token cursor.** It is **not** a dynamic DOS run, observed simultaneous drawing, z-order/cropping verification, correct-color RGB output, or evidence that label 13 is a fatality or jump.

## Tests

- Python source producer: independently repassed **27,004 LE records**, plus byte-exact verification of installer opcode families and bounded symbolic traversal of the serialized configuration.
- Separate Node verifier: **27,185 checks / zero failures**, freshly parsing all LE relocation records, verifying code bytes, independently symbolically evaluating the special `1` and `-1` branches, validating the installed pointer-to-pointer values.
- Four falsifications **rejected**: invented guaranteed simultaneous draw, fabricated installed destination, altered sentinel value, and forged control-cursor pointer. Pristine report reverified after restoration.
- O97F passed **27,463 / 0**; O97E **818,531 / 0**, O97C/D **1,165,876 / 0**, O96X/Y **93,666 / 0** in this continuation.

## Evidence

- `mk2_mountain_runtime_setup_install_o97g_2026-10-09.json`
- `scripts/run-mk2-o97g-mountain-runtime-install.py`
- `scripts/verify-mk2-o97g-mountain-runtime-install.mjs`

## Next: O97H

Verify whether the runtime-installed paired setup pointer slots get traversed in one renderer scheduler cycle, and trace how the `0x15D60` control stream governs linked-object visibility; or test the static callback at `0x21227` and caller execution predicates. Do not invent a frame, screen crop, stage name, fatality, jump, RGB palette ownership, or actual runtime coactivation without test evidence. If this cannot close, pivot to the remaining MK2 palette/graphics/audio blockers.

**Project order remains:** finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → build extractor.
