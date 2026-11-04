# MK DOS Archive — O96C/O96D/O96E Runtime Cursor Storage and Renderer Guard

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II (original DOS)  
**Status:** BOUNDED MACHINE-CODE AND RELOCATION VERIFIED; MK2 RESEARCH OPEN

## Authority and fixture

Starting authoritative source: `MK-DOS-Archive-2026-10-08-O96B-source.zip` (SHA-256 `377974bcfe277ff732ecbbb5626f2382b635c5d31200d0bdc4e882d7a661166c`). The authentic original fixture `MK2.EXE` SHA-256 remains `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; no original game binary was edited.

Loader model is inherited and freshly validated: bound MZ `0x26654`, LE `0x28F0C`, file-backed pages beginning `0x61C54`, 113 pages, and 27,004 relocation records. Object 2: relocation base `0x50000`, virtual size `0x86660`, 50 file-backed pages = `0x32000` bytes; its remaining `0x54660` virtual bytes have no original file-page backing.

## O96C — literal stores to the control-cursor global

Machine-code pattern `C7 05 98 5A 07 00 <DWORD>` at 15 authentic Object-1 locations sets `[0x75A98]` directly. Of these, 13 are **LE type-7 relocation-backed Object-2 offsets**; two are scalar assignments of 11 and zero (`0x8538E`, `0x8543D`). The 13 relocations reference exactly **seven distinct offsets**:

`0x84334`, `0x84338`, `0x8433C`, `0x84340`, `0x84344`, `0x84348`, `0x84350`.

All seven lie between Object 2's file-backed end `0x32000` and virtual end `0x86660`. Therefore those code-immediate targets **are not static serialized command-stream bytes inside the EXE**. The relocation target offsets cannot be treated as physical file offsets or as proof that any particular runtime buffer contains a valid command stream. The census covers exact direct-literal-store opcode sites, not all possible ways of writing this global.

Original producer: `scripts/run-mk2-o96c-runtime-cursor-targets.mjs`. Separate verifier: `scripts/verify-mk2-o96c-runtime-cursor-targets.py`. Evidence: `mk2_runtime_control_cursor_literal_targets_o96c_2026-10-08.json`. **27,170 independent checks / 0 failures.**

## O96D — renderer clipping and upstream global copies

At `0x93500` the authenticated code copies `[0x75CF6]` to `[0x75A98]` before the control-stream loop; at `0x9352B` it copies `[0x75FAE]` into `[0x75A80]`. The latter is distinct from O96B's indexed-table source writer at `0x82321`; the order/branch relationship between the two code paths is not globally established.

On the authenticated token `-1` branch, `0x9356E` assigns the control triple to ESI, EDI, EBX and calls `0x9E118`. At `0x9E118..0x9E197`, source bytes independently show:

- entry is **guarded** by global `0x562D4 & 1`;
- `ESI &= 0xFFFF` precedes an indexed Object-2 table addition;
- EDI is adjusted by the **arithmetic-right-shifted high 16 bits** of `[0x75A68]`;
- EBX is copied to ECX as an incoming quantity; adjusted EDI `>= 200` by unsigned comparison skips copying;
- if `EDI+ECX` is unsigned `>= 200`, ECX becomes `200-EDI` before the call;
- the remaining guarded path calls verified packed-resource routine `0x659C6` at physical `0x9E191`.

The literal 200 is an authenticated compare/clipping threshold, **not proof of raster height or universally valid source row count**. Conditional paths remain conditional; runtime ESI/EDI/EBX domains, palette ownership and full scene reconstruction are not established.

Original producer: `scripts/run-mk2-o96d-render-row-clip.mjs`. Independent verifier: `scripts/verify-mk2-o96d-render-row-clip.py`. Evidence: `mk2_renderer_guard_clip_and_global_sources_o96d_2026-10-08.json`. **33 independent checks / 0 failures**, covering all the specific machine-code slices and claimed fields.

## O96E — explicit runtime-slot zero initializer

Original Object-1 routine `0x81B18` preserves EAX/ECX/EDI, zeros EAX at `0x81B1B`, then issues nine sequential `MOV moffs32,EAX` instructions at `0x81B1D..0x81B49`:

`0x8435C`, `0x84350`, `0x8434C`, `0x84348`, `0x84344`, `0x84340`, `0x8433C`, `0x84338`, `0x84334`.

All nine store-target immediates have independent type-7 LE Object-2 relocations, and all nine point to unbacked virtual bytes. They include **every one of the seven O96C literal cursor destinations**, plus two more slots. Separate `REP STOSD` occurs afterwards at `0x81B54`; its broader semantic purpose is not inferred here.

This proves that an explicit **zero-initialization routine exists** for these runtime slots. It does **not** prove how often/when the routine executes, when/how nonzero command data is written, or which actual gameplay condition reaches the earlier renderer.

Original producer: `scripts/run-mk2-o96e-runtime-slot-initializer.mjs`. Independent verifier: `scripts/verify-mk2-o96e-runtime-slot-initializer.py`. Evidence: `mk2_runtime_control_slot_zero_initializer_o96e_2026-10-08.json`. **27,174 independent checks / 0 failures.** This later O96E result narrows O96C's then-open initialization question; neither claims the full runtime writer chain.

## Checks / regressions / falsifications

- New independent verifier checks: **54,377 checks / 0 failures** (O96C 27,170; O96D 33; O96E 27,174).
- Reexecuted O96A: **27,170 / 0**; O96B: **27,150 / 0**; O95Z: **1,526 / 0** on the original fixture.
- Three deliberate false report mutations were all rejected by the corresponding separate verifier: (1) falsely promote all O96C targets as file-backed; (2) replace verified clip threshold 200 with 256; (3) falsely claim O96E initializer runtime execution is proven.
- The original O96B archive/report and all earlier machine-readable evidence files remain intact; these are additive passes.

## Remaining blockers and next bounded pass

No additional animation, palette, GRA exact-full, stage identity, screenshot geometry or audio closure is claimed. Historical MK2 measures remain: seven bounded fixed-identity animation sequences; 210/253 strict terminal selected-pointer consumers; 239/253 strong; 14 held; nine of 17 qualified correct-color palette slots; 94/124 exact-full GRA resources. MK2 is **OPEN**.

Suggested **O96F**: trace actual writers or callsites that populate/use Object-2 slots `0x84334..0x84350`, with emphasis on whether `0x81B18` is invoked before those write paths. Do not assume a static control-stream grammar. If the runtime path cannot be closed, move to the outstanding MK2 palette or GRA classification obligations rather than forcing a stage export contract.

Mandatory user-directed order: **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → build extractor**.
