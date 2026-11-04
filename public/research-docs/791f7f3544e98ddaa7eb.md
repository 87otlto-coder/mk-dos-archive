# MK DOS Archive — O96A Authenticated Indexed Resource-Tail Rendering Consumer

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED MACHINE-CODE CONSUMER / MK2 RESEARCH OPEN

## Inputs / authority

O96A follows O95Y/O95Z, whose six original O95X suffix starts plus a seventh BATTLE.GRA EOF-tail reference were found in a contiguous original executable DWORD grouping. Source from O95Z checkpoint; original MK2 fixture read-only. Exe SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

**Critical coordinate correction:** O67's historical `UNRESOLVED_POST_LE_OVERLAY` was **superseded by O72**. The bound MZ header is at physical `0x26654`; `e_lfanew=0x28B8` points to LE `0x28F0C`; the LE data page offset `0x3B600` is **module-relative**, making the true physical page base **`0x61C54`**. The 113 pages extend to original executable EOF `0xD23CD`. The resource descriptor corpus and new tail-reference table are **file-backed LE Object-2 data**, not arbitrary trailing overlay. Previous O95Y prose calling the location “post-LE overlay” is historical mislabeling; its binary offsets, hashes and exact resource matches remain intact.

## O96A — Qualified code/data chain

O96A now closes the key consumer uncertainty left by O95Y:

1. The true indexed table **begins at Object 2 offset `0x2EF54` / physical `0xCFBA8`**. O95Y's seven nonzero references are at subsequent indices **1,2,3,4,5,7,8**, with an observed zero at index 6. Additional physical zero words are present at indices 0 and 9; neither establishes a runtime index bound or array length.
2. Original Object-1 code at physical `0x9E165` loads dynamic global `0x7747F`; at `0x9E16A` it executes `ADD ESI, DWORD PTR [EAX*4 + 0x2EF54]`. The encoded displacement at physical `0x9E16D` is a genuine type-7 LE relocation to **Object 2 offset `0x2EF54`**, not a same-number coincidence.
3. Guarded caller path may bypass consumption. On the bounded path, the code at `0x9E191` executes a machine-verified rel32 call to consumer `0x659C6` after the table value has modified ESI.
4. At `0x659C6`, ESI's **high eight bits** are used to index a **24-byte-stride resource-handle table** at Object 2 offset `0x2F434`; the remaining **low 24 bits** are used as a byte offset, and the loaded handle's base is added to ESI. The 0x2F434 displacement at physical `0x659DB` is independently authenticated by an additional type-7 relocation.
5. The inner loop at `0x65A14` performs **80 consecutive DWORD loads**, adds an EDX transform value to each and stores 80 DWORD results (**320 bytes per inner loop**). The source row-base variable increments by **`0x380 = 896` bytes** before the subsequent row. Caller register arguments and branches control how many rows are used; their complete runtime bounds are not yet established.

The original O95Y seven EOF suffixes (including BATTLE.GRA) are each an exact multiple of **896 bytes**, and their row-stride-unit totals are **48,40,64,32,56,40,40**, in O95Y table order excluding zeros. All are also multiples of eight stride units, which accounts arithmetically for O95Z's 7,168-byte divisibility. This is now **code-backed stride context**, although 896 bytes is a *source-memory stride*, not a proven visible screen width, tile dimension, or camera frame.

### Limits / not yet qualified

- The permitted **runtime values of index global `0x7747F`** and the exact index/row pairs reached during gameplay have not been bounded. The presence of eight or nine observed slots does not prove the renderer ever selects them all.
- The palette transformation operand, correct-color binding, stage naming/order, camera position, screen raster geometry, audio/animation closure and sprite compilation remain OPEN.
- The code-backed packed resource copy establishes a concrete consumer, **not** universally exportable whole-stage assets, not a seven-stage count, and not a license to assume 256-pixel raster width.
- The O69 exact-full `.GRA` count remains **94/124**; `BATTLE.GRA` remains zero-candidate under O69's 12-byte sprite descriptor grammar. No earlier evidence is overwritten.

## Reproducibility

Machine-readable evidence: `mk2_bound_le_packed_suffix_consumer_o96a_2026-10-08.json`. Original producer: `scripts/run-mk2-o96a-tail-table-consumer.mjs`; independent Python verifier: `scripts/verify-mk2-o96a-tail-table-consumer.py`.

- Producer against authentic fixture: **PASS**; **27,004** original LE relocations independently parsed for lookup and handle references.
- Separate Python verifier: **27,170 checks / zero failures**, independently parses page maps/fixups and validates indexed read, control-flow/call displacement, packed resource handling, DWORD copy loop, stride and all seven EOF-tail alignments.
- Negative controls rejected: changed table offset, changed 896-byte stride, fabricated palette ownership.
- O95Y regression: **83/0**; O95Z regression: **1,526/0**; O95X: **62/0** on same fixture. Both new scripts syntax-checked.

## Continuation: O96B

Trace `0x7747F` runtime-index provenance (a bounded immediate writer at physical `0x82326` copies `0x75A80` into this scalar), and the caller row-count/cropping parameters into `0x9E118..0x9E197`. Preserve all branch guards and producer changes to `0x75A80`; do not assign scene identities without a numerical identity relationship established in executable data flow. If this stalls, return to the other MK2 closure obligations without speculative semantics.

**Mandatory order:** finish MK2 -> finish MK1 -> finish MK3 -> discuss UI/usability -> implement extractor.
