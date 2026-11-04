# MK DOS Archive — O95E MK2 identity provenance and delayed lookup/interpreter joins

Date: 2026-10-07  
Status: **AUTHENTIC-FIXTURE VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

## 1. Purpose

O95E continues the MK2 animation reconstruction after O95D. It does **not** assign move names or timing. The pass asks two bounded questions:

1. can provenance for any O95D identity-parameterized route be tightened without guessing a numeric identity?;
2. are there authenticated lookup -> interpreter joins where helper/state code sits between selection and interpretation, and can any such route establish an additional fixed identity witness?

The canonical MK2 executable remains SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

## 2. O95D dynamic direct route provenance tightened

The sole O95D direct route with non-adjacent/dynamic nested index is the wrapper beginning at physical `0x63E45`:

- EAX at wrapper entry is written to global `0x75A78`;
- `EDI` is replaced by `[ESI+0x28]`;
- Family A is called at `0x63E54`;
- the shared interpreter is called at `0x63E59`;
- after one interpreter call, the resulting cursor is stored to `[[ESI+0x30]+0x14]`;
- the previous cursor global and EDI are restored.

Therefore this route is more precisely:

`FamilyA[ relatedObject.identity ][ EAX ] -> interpreter`

The identity is **related-object-derived**, not fixed numerically. O95E does not infer the related object's identity from caller context, resources or table compatibility.

Authenticated wrapper slice SHA-256: `b4f8958545e915a3da4b9cae048e7a206ce19bca8a3acf0555ae49d3fb499a36`.

## 3. Delayed Family A/B wrapper established

Two adjacent helper entries at physical `0x64ACC` and `0x64AE5` implement a bounded delayed lookup/interpreter path for Family A and Family B respectively. Both join a common tail at `0x64AFC`.

For input value `V` in global `0x75A78`, the machine code performs:

- save `V >>> 14`;
- clear the high 16 bits of global `0x75A78`, leaving `V & 0xFFFF` as the lookup index;
- call the selected identity-indexed family lookup using current `EDI+0x46`;
- add the saved `V >>> 14` to the selected pointer;
- tail-jump to the shared interpreter at `0x63E79`.

Structural form:

`selected = Family[ currentObject.identity ][ low16(V) ]`  
`cursor = selected + (V >>> 14)`  
`-> interpreter`

The added quantity is proven only as a **byte displacement into the selected target**. O95E does not name it as frame number, command count, duration or timing.

Authenticated wrapper slice SHA-256: `c6f47aa4d99236180f2e7b272edb4baeb725145f36801ec38dc9da1a709bfe88`.

A direct bounded caller at physical `0x7C2BA` first writes `0x00030001` to the global. Therefore that route proves:

- Family B;
- nested index `1`;
- entry displacement `12` bytes;
- current-object identity remains numerically unresolved.

It is preserved symbolically as:

`FamilyB[currentObject.identity][1] + 12 bytes -> interpreter`

## 4. Second fixed numeric identity animation witness

O95E establishes an executable-connected delayed route for **identity slot 7** without using filenames or visual inference.

### 4.1 Control-flow provenance

Physical `0x7987C` loads EAX with `13` and jumps through `0x79826` to dispatcher physical `0x7B588`.

The dispatcher:

- accepts EAX values up to 15;
- indexes the relocation-backed Object-2 table rooted at `0x134F8`;
- table entry 13 is Object-2 source `0x1352C`;
- authentic fixup at that entry targets Object-2 `0x1359A`, physical `0xB41EE`.

This is a machine-connected case-13 route. It is **not** claimed as user-observed runtime execution.

### 4.2 Identity and delayed selection

Inside that handler, the immediate bounded path contains:

- physical `0xB422E`: `mov eax,7`;
- physical `0xB4233`: write EAX to `[EDI+0x46]`;
- physical `0xB4236`: write global `0x75A78 = 1`;
- physical call at `0xB4240`, whose relocated operand at Object-2 `0x135ED` targets Family-B delayed wrapper `0x64AE5`.

There is no intervening call between the slot-7 write and this delayed-wrapper call.

For input `V=1`, the delayed wrapper gives:

- nested index = `1`;
- entry displacement = `0`.

Family B slot 7 root is Object-2 `0xD188`. Index 1 resolves by authentic fixup to stream Object-2 `0xD5D8`.

### 4.3 Bounded stream

Stream `0xD5D8` contains six ordered composition pointers followed by raw token 0:

1. composition `0xD640` -> descriptor `0x27B58` -> `RD0.GRA`, offset 41788, 51x107, x=18, y=-3;
2. composition `0xD638` -> descriptor `0x27B4C` -> `RD0.GRA`, offset 38300, 48x88, x=20, y=-21;
3. composition `0xD630` -> descriptor `0x27B40` -> `RD0.GRA`, offset 35180, 49x77, x=20, y=-33;
4. composition `0xD628` -> descriptor `0x27B34` -> `RD0.GRA`, offset 32396, 50x66, x=20, y=-43;
5. composition `0xD620` -> descriptor `0x27B28` -> `RD0.GRA`, offset 30708, 47x50, x=18, y=-60;
6. composition `0xD618` -> descriptor `0x27B18` -> `RD0.GRA`, offset 28404, 83x54, x=40, y=-76;
7. token 0 at Object-2 `0xD5F0` -> interpreter return.

Each composition array contains one authenticated O69 descriptor pointer followed by a zero composition terminator.

Structural order only:

`frame[0] -> frame[1] -> ... -> frame[5] -> token 0 return`

No human move/action name, dwell timing, wall-clock timing, gameplay meaning or palette ownership is promoted here.

This becomes the **second fixed-numeric-identity MK2 animation witness** after O95C's slot-12 / Family-A index-7 sequence.

## 5. Machine-readable output

Added:

- `src/games/mk2/research/animationIdentityProvenanceDelayedJoins.ts`;
- `scripts/run-mk2-animation-identity-provenance-delayed-joins.mjs`;
- `scripts/verify-mk2-o95e-animation-identity-provenance-delayed-joins.py`;
- `mk2_animation_identity_provenance_delayed_joins_o95e_2026-10-07.json`.

Machine verdict:

`MK2_O95E_RELATED_OBJECT_IDENTITY_PROVENANCE_AND_FIXED_SLOT7_DELAYED_FAMILY_B_SIX_FRAME_SEQUENCE_ESTABLISHED`

## 6. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent Python verifier:

- **54,186 checks / 0 failures**;
- independently reparses all 27,004 LE fixups;
- authenticates the related-object direct wrapper;
- authenticates the delayed Family A/B wrapper mechanics;
- authenticates the case-13 dispatcher path and Object-2 handler fixup;
- authenticates the slot-7 write and relocated call into the Family-B delayed wrapper;
- independently resolves Family B slot 7 / index 1 to stream `0xD5D8`;
- independently verifies all six composition arrays, O69 `RD0.GRA` descriptors and token-0 termination;
- reconciles the machine-readable O95E report and its uncertainty boundaries.

Regression gates remain clean:

- O95B: **54,200 / 0 failures**;
- O95C: **54,199 / 0 failures**;
- O95D: **54,335 / 0 failures**.

## 7. Boundary and decision

Established:

- related-object identity provenance for O95D's dynamic-index direct wrapper;
- delayed Family A/B wrapper encoding and common interpreter tail;
- one identity-unresolved delayed Family-B example with index 1 / +12-byte entry displacement;
- one new fixed slot-7 delayed Family-B route;
- one new bounded six-frame finite `RD0.GRA` sequence.

Still open:

- numeric identity provenance for the remaining O95D parameterized direct routes;
- broader fixed-identity routes behind other identity writers/dispatch cases;
- full stream corpus and all control-token combinations;
- loops/branches/multipart coverage beyond individually qualified witnesses;
- animation timing/dwell semantics;
- human move/action names;
- complete per-identity animation coverage;
- MK2 stages/backgrounds/dynamics and remaining palette closure blockers from O95A.

MK2 animation closure remains **OPEN**.

## 8. Next pass

**O95F — fixed-identity provenance expansion.**

Systematically trace the remaining executable writes of constants/copies into object `+0x46` and promote additional animation routes only when a bounded control-flow path reaches a lookup/interpreter consumer without an identity-obscuring call or reassignment. Keep copy-derived identities symbolic unless the source object's numeric identity is independently established. Do not infer fighter names from resource prefixes or visual appearance.
