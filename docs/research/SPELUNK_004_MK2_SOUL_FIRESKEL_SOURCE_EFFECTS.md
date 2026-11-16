# Spelunk 004 — Original DOS MK2 SOUL and FIRESKEL effect-list provenance

**Date:** 2026-11-16  
**Branch:** `research/spelunk-004-mk2-soul-fire-sequences`, based on the previous Spelunk 003 checkpoint.  
**Research scope:** static original-source effect animations, not character gameplay, stage compositing or DOSBox live state.  
**Confidence:** **VERIFIED STATIC SOURCE ORDER AND CONDITIONAL CONTROL**. Runtime execution, palette allocation, animation timing and screen placement remain **UNKNOWN / VALIDATION PENDING**.

## Why this spelunk mattered

Spelunk 003 added original Armory and Living Forest source-ordered effect sequences. For 004 we screened additional MK2 executable Object2 runs of relocated sprite-descriptor pointers, concentrating on blood, fire, soul, impact and related effects.

Important inherited work: the O69 resource/descriptor census already identified many individual graphics; O136/O137/O169 had authenticated other stage-linked list/normal-reader mechanisms; O218/O219/O228 already established Pit's `BLOOD.GRA` sprite177 source and its original descriptor-linked palette record. **Do not rebrand those prior individual sprite discoveries as new.** This pass adds **control-flow and animation-list provenance** that permits a stronger native indexed sequence export.

Our initial permissive pointer-run screening found many candidate clusters, including scores, fonts, menu art, blood, fire, BANG, SUCK and SOUL. Such a run is **not automatically an animation**. To qualify a new list we required exact original resource identity, typed LE descriptor relocations, all source frames decoding with the original row-indexed RLE grammar, exact terminal marker, and an independently connected executable code consumer or selected-list writer.

The user-owned original ZIP was read without editing. Original `MK2.EXE` is 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. Full LE parsing recovered **27,004 relocation entries / 26,994 unique sites**. Nothing commercially derived was uploaded.

## Main discovery: 100% source-byte partition of SOUL.GRA

`SOUL.GRA` — original resource ID **16**, 47,612 bytes, SHA-256 `39483001099bad825de6e6f219020ef12e9f1f97a4fbbe1449312d6572479376`.

Two authenticated lists contain **17 distinct indexed sprite streams**, adjacent in the original GRA with no gaps and *no remainder*. This is a complete resource-byte partition **for original compressed sprite stream coverage**, not proof of actual palette ownership, complete gameplay animation behaviour, or even that every list runs during a fight.

| Source list Object2 | Native ordered entries | End control | Original resource byte range [start,end) | Stream span SHA-256 |
|---|---:|---|---|---|
| `0x1DD28` | **3** | DWORD `1`, typed LE back-pointer to `0x1DD28` | `0x00000–0x03FC8` | `01fc53b78d7c87e84afdf9be45b67e7374b3183ff1ed9ca992ed33d0e37ef7f0` |
| `0x1DD3C` | **14** | Unrelocated zero | `0x03FC8–0x0B9FC` | `17e6f33c9cefe9977c5a8577914aadb43600752080c3f5b0681f0fb27f342cb2` |

Source code **also connects the two lists into one two-phase control path**:

1. At original physical **`0x94634`**, an LE-authenticated instruction writes the three-entry list pointer into Object2 animation cursor `0x75A78`.
2. At **`0x94648`**, the code directly calls the already established normal descriptor-list reader `0x86CC5`.
3. Source at `0x9463E` initializes a raw counter `16`; the path invokes scheduler helper `0x6710F` with raw argument **4**, and branches back to the first reader through a conditional decrement at `0x94677`.
4. At **`0x9468D`**, another relocation-backed instruction replaces the same cursor with the **14-entry** `0x1DD3C` list, sets another raw argument **4**, and jumps to the original sequence runner `0x86C99` at `0x946A6`.

This source proves a **conditional program transition from list A to list B** and the different list terminator types. It does **not** prove that list A's three unique poses occupy three displayed frames per loop, that the counter 16 is a display count, or that either raw argument 4 represents milliseconds/FPS. Task scheduling and display presentation need real emulator evidence before timed playback.

The 17 descriptors preserve width, height, signed local X/Y and packed GRA offsets. The independent source-data decoder also recovered exact 8-bit colour indices and 0/1 opacity planes in memory and hashed them, but no sprite image or raw index plane entered GitHub.

## Second discovery: conditional FIRESKEL.GRA list ownership

`FIRESKEL.GRA` — original resource ID **7**, 57,128 bytes, SHA-256 `a530b1840d4bc7adf6303cc0388262e51dfd21b5801ed1dc9523c3339ea19b8e`.

The two lists below contain **twelve distinct sprites** (six per list). All entries have typed LE original descriptor pointers; their corresponding encoded streams are adjacent. Both lists terminate in a DWORD `1` and a typed back-pointer to their respective list start.

| List Object2 | Entries | Source encoded range | SHA-256 of source span |
|---|---:|---|---|
| `0x1D938` | 6 | `0x0D354–0x0DBA4` | `0c4b334e628f7135a38311bacd2c08e4097947ec45d0cbd20a0ce9d68aff5b47` |
| `0x1D958` | 6 | `0x0DBA4–0x0DE34` | `a3c3bc87bf4af776ee95f18008c4cd812c37ceb5d7385d63300913097c879174` |

**Not complete resource coverage:** the authenticated linked lists cover `0x0D354–0x0DE34` (2,784 encoded bytes). The original file also contains a preceding **54,100 bytes** and a remaining **244 bytes** after the last linked frame. Those regions were not promoted to effect-list frames by this investigation.

The source-code discriminator is unusually precise:

- `0x94088`: set EBX to source list `0x1D938`.
- `0x9408D–0x94097`: load Object2 global `0x75AC4`, test its sign, and conditionally skip the next list assignment.
- **If signed negative**, EBX remains `0x1D938`. **If nonnegative**, `0x94099` replaces it with `0x1D958`.
- `0x9409E`: writes the chosen list pointer to task field `+0x5C`.
- `0x941A0–0x941BC`: sources the first descriptor from that selected list and reaches the original sprite constructor `0x64548`.
- `0x9410C–0x94110`: on the separate continuation path, transfers the preserved task field into global frame cursor `0x75A78`. `0x94138` jumps to `0x916F3`, whose original `0x91704` calls shared frame-advance helper `0x6435A`.

This means **two alternative source animations are selected through a task-local list pointer**. It does not mean they are both active, alternate every frame, draw at known coordinates, or own any particular palette bank. The meaning and live value of `0x75AC4` are not established here.

## Implications for the extractor

**VERIFIED extraction data:** four original-code-linked animation tracks; 29 ordered entries referencing **29 distinct original compressed sprites**. This adds list/consumer relationships to artwork already addressable through the broad O69 source census. SOUL's two tracks form a complete resource-byte partition; FIRESKEL's two are only a proven local range.

The later extraction adapter should preserve original indexed pixels, opacity mask, resource ID, descriptor address, signed descriptor-local offsets and source span for each unique sprite, then store **source program linkage and list control markers separately**. In particular:

- SOUL should be represented as *two source phases*, not a single guessed 17-frame loop.
- FIRESKEL should be represented as *two alternatives under a sign-condition expression*, not an unconditional 12-frame playback strip.
- List end token `0` stops the original reader's traversal; token `1` plus back-reference permits rewind. Neither, on its own, proves runtime effect lifespan or timing.
- Do not render/export claimed original RGB from an assumed source palette when the actual live DAC allocation is not known.

Previously authenticated source-ordered tracks remain untouched: six O136/O137 Tomb/Portal/Tower lists (43 entries), two O221 Pit lists (14), and Spelunk 003 Armory/Forest (32). Adding these 29 yields **118 documented entries across the selected investigated effect tracks**, *not* a universal animation census and *not* 118 new sprites.

## Candidate disposition (what was deliberately not promoted)

- **BLOOD.GRA:** multiple source pointer runs and potentially distinct animation consumers; existing O218/O228 already prove source177 and its placement/palette *source relationship*. Other BLOOD lists require independent callback/normal-vs-alternate-grammar classification.
- **BANG.GRA, SUCK.GRA:** structurally plausible multi-list and loop-marker candidates, but groups can be selected through larger tables and different consumers. A zero/one marker by itself is not sufficient.
- **EXPLODE.GRA:** the permissive contiguous-pointer screening did not establish a source-linked list. This does **not** prove the resource has no effects, no decoder, or no animations.
- **FONTS.GRA, SCORE.GRA, title/menu artwork:** pointer runs also occur outside effects and should be used as negative controls against blind animation discovery.

Next high-value static expedition: trace **BANG/SUCK multi-list selection tables**, identify original consuming function/flag grammar and reuse across effects, then extend list-and-stream export only for source-authenticated branches. Broad resource sprite counts or scan heuristics alone are not a valid animated-sequence ledger.

## Reproduction and evidence classification

- Source-safe original-input producer: `scripts/research/spelunk004/trace_soul_fireskel_source.py`, requires original owner `mk2.zip` and a **nonexistent** destination JSON, hashes all source inputs, reparses LE fixups, checks original instructions, typed descriptor/link pointers and every decoded compressed source stream. Does **not** export copyrighted bytes.
- Original-fixture adversarial regression *source*: `scripts/research/spelunk004/test_original_fixture.py`. The **exact committed suite has not been executed on the private fixture** in this conversation and must not be called passed.
- Separate **independently written read-only private checker** actually ran against the uploaded original files: **194 positive checks** plus **10 intentional in-memory falsification controls**, all passed; these are not counts from the committed original-fixture test source. See source-safe evidence JSON for the independent summary and exact source spans.
- Original-free Windows GitHub CI [#43947941505](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43947941505) **SUCCESS, 13 synthetic tests** plus Python compile checks; no owner original binary was available in CI and no artifacts were uploaded.
- Machine-readable provenance: `docs/validation/SPELUNK_004_MK2_SOUL_FIRE_EFFECT_PROVENANCE_20261116.json`.

**Confidence register:** VERIFIED STATIC — four source-linked lists, original resource and descriptor typed identity, source spans, indexed/mask RLE, source SOUL phase transition, conditional FIRESKEL list selection, program call/jump pointers. INFERRED EXTRACTOR DESIGN — two-phase/alternate-list manifest representation. UNKNOWN — live activation, branch value, palette ownership/DAC, exact object coordinates, camera/occlusion, native presented frame and time. VALIDATION PENDING — actual game capture and comparison.

No modification to original commercial DOS files, preserved P90/P91 branches, existing animation exports, extractor application, or user's `F:\Dev\MKEXT\SOURCE/TOOLS/FIXTURES` directory. No release ZIP or browser UI changes made.
