# MK DOS Archive — Pass 1E.3N.2 Single-Player Ladder Grammar

25 September 2026

## Purpose

Pass 1E.3N.2 continues directly from the verified 1E.3N.1 first-encounter access harness.

The bounded question is no longer merely "which opponent does a ladder byte select?" It is:

> **What grammar do the four original 16-byte single-player ladder maps encode, and can the non-opponent event tokens be qualified mechanically without altering gameplay code?**

This pass remains a research/convenience layer. It does **not** patch combat, fighter AI, damage, rendering, fighter initialization, or stage-selection code.

---

## Runtime closeout carried forward from 1E.3N.1

The user has now exercised both late-game access routes in DOSBox:

- forced token `6` / character ID `7` produced **GORO** as the first opponent;
- the composite `GONGORO_P` magenta edit colored Goro while the selected fighter remained normal;
- forced token `7` / character ID `8` produced **SHANG TSUNG** as the first opponent.

These screenshots provide runtime identity confirmation for the two special IDs. A screenshot alone cannot independently prove the exact EXE hash running at capture time, so the machine-generated 1E.3N.1 reports remain unchanged; the runtime observations are recorded here as separate evidence.

Both forced boss encounters appeared in Goro's Lair. The user supplied the relevant gameplay context that the final endurance fight, Goro, and Shang Tsung normally occur on that stage. Do not yet promote a precise stage-selection mechanism from this observation; stage selection remains a future dedicated research pass.

A further visual clue from the Goro test is that Goro's body consumed the edited palette while the ground shadow remained black. Treat this as evidence that at least some shadow/effect presentation is separate from the fighter palette path; do not yet generalize the exact rendering mechanism.

Status carried forward:

- **1E.3N.1 first-encounter access route — RUNTIME VERIFIED for token 6 / Goro and token 7 / Shang Tsung.**
- **1E.3N slot 7 `GONGORO_P` ownership — RUNTIME VERIFIED.**

---

## Canonical fixture

- `MK1.EXE`
- size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Coordinate model carried forward:

- Segment-1 code file-image base: `0x00050A54`
- Segment-2 static-data file-image base: `0x0008CA54`

1E.3N.2 requires the authoritative 1E.3N.1 access qualification from the same authentic fixture before it runs.

---

## Four original ladder maps

The four verified 16-byte maps remain:

```text
Map 0: 0, 1, 2, 15, 3, 4, 5, 15, 8, 16, 17, 15, 18, 6, 7, -1
Map 1: 5, 4, 3, 15, 2, 1, 0, 15, 8, 19, 20, 15, 21, 6, 7, -1
Map 2: 3, 5, 4, 15, 2, 1, 0, 15, 8, 16, 18, 15, 20, 6, 7, -1
Map 3: 4, 3, 5, 15, 0, 1, 2, 15, 8, 18, 19, 15, 16, 6, 7, -1
```

All four now parse to the same structural grammar:

```text
3 ordinary fights
TEST YOUR MIGHT
3 ordinary fights
TEST YOUR MIGHT
mirror match
endurance
endurance
TEST YOUR MIGHT
endurance
special ID 7   [runtime observed: Goro]
special ID 8   [runtime observed: Shang Tsung]
END
```

Classification:

**VERIFIED_SINGLE_PLAYER_LADDER_GRAMMAR**

---

## Token dispatcher — direct machine-code evidence

The exact dispatcher is reproduced at physical `0x0005E819`.

It operates on the signed ladder byte already loaded from `MAP_START[MAP_POSITION]` and performs these bounded tests:

1. `cmp eax, 0x0F` → dedicated branch;
2. `cmp eax, -1` → terminator branch;
3. `cmp eax, 0x10` / `jge` → endurance branch;
4. otherwise call the already-verified `OFFSET_TO_OCHAR` ordinary-opponent mapper.

The ordinary mapper target is physical `0x0005E872`.

Classification:

**VERIFIED_LADDER_TOKEN_DISPATCH**

Tokens `9..14` do not occur in any of the four recovered maps and remain **UNASSIGNED**. Do not invent semantics for them.

---

## Token 15 / 0x0F — Test Your Might

The `0x0F` branch lands at physical `0x0005E839` and immediately increments `MAP_POSITION`.

That branch subsequently transfers to physical `0x0006076C`.

Within the bounded destination path, the executable loads the static-data record at Watcom offset:

- `0x0000B337`
- physical `0x00097D8B`

That record contains the literal heading:

`TEST YOUR MIGHT`

at physical `0x00097DA3`.

This is direct binary linkage between ladder token `15` and the Test Your Might event path.

Classification:

**VERIFIED_TEST_YOUR_MIGHT_TOKEN**

---

## 0xFF / signed -1 — ladder terminator

The dispatcher reads ladder bytes with sign extension.

`0xFF` therefore becomes signed `-1` and takes the explicit terminator branch, which returns with carry set rather than passing through opponent mapping.

This closes the earlier speculation that `-1` could identify the green ninja. It does not.

Classification:

**VERIFIED_LADDER_TERMINATOR**

The green-ninja route remains the separately recovered `F_GNINJA` + character-ID-4 + `GNINJA_P` conditional state path from 1E.3N.1.

---

## Endurance grammar — exact arithmetic

Values `>= 0x10` branch to the endurance path. The compact mapper begins at physical:

`0x0005E884`

Its exact bounded shape is:

```text
load player-specific row pointer
AND AL, 0x0F
load byte [row + EAX*2]     -> first fighter
load byte [row + EAX*2 + 1] -> second fighter
return
```

Therefore the endurance token encoding is:

```text
token = 0x10 + pair_index
pair_index = token & 0x0F
```

Recovered pair tokens are exactly:

`0x10..0x15` / decimal `16..21`.

---

## Seven player-relative endurance rows

The mapper selects one of seven pointers from:

- Watcom offset: `0x0000A3CF`
- physical: `0x00096E23`

The seven 12-byte rows are:

```text
selected ID 0: 1,2,3,4,5,6, 1,4,2,5,3,6
selected ID 1: 0,2,3,4,5,6, 0,4,2,5,3,6
selected ID 2: 1,0,3,4,5,6, 1,4,0,5,3,6
selected ID 3: 1,2,0,4,5,6, 1,4,2,5,0,6
selected ID 4: 1,2,3,0,5,6, 1,0,2,5,3,6
selected ID 5: 1,2,3,4,0,6, 1,4,2,0,3,6
selected ID 6: 1,2,3,4,5,0, 1,4,2,5,3,0
```

For every selected playable character:

- the first six entries contain exactly the six other playable fighter IDs;
- their **order is endurance-specific** and is not always identical to the ordinary `OFFSET_TO_OCHAR` row order;
- define those first six entries as `A, B, C, D, E, F`;
- the complete 12-byte row serializes the six pair definitions as:

```text
16 / 0x10 -> A + B
17 / 0x11 -> C + D
18 / 0x12 -> E + F
19 / 0x13 -> A + D
20 / 0x14 -> B + E
21 / 0x15 -> C + F
```

So the user's intuition that the endurance grammar was mathematical was directionally correct: the tokens are not numeric sums of fighter tokens, but a compact `0x10 + pair-index` encoding over a player-relative six-fighter row.

Classification:

**VERIFIED_PLAYER_RELATIVE_ENDURANCE_PAIR_TABLE**

---

## Research access exports

1E.3N.2 extends the existing first-byte harness for the grammar/event tokens:

- token `15` — Test Your Might;
- tokens `16..21` — the six endurance definitions.

As before, an export changes only the first byte of each of the four original maps:

- `0x00096D24`
- `0x00096D34`
- `0x00096D44`
- `0x00096D54`

No code bytes are modified.

Independent reconstruction against the canonical fixture produced exactly four changed bytes and exact reversal for every exposed token.

Reference hashes:

| Token | Meaning | Edited SHA-256 |
|---|---|---|
| 15 | Test Your Might | `025f6acaa6abad11e83e2c1b1c30e765e523253a64d808550434e682142b56b7` |
| 16 | Endurance pair 1 | `4ec8d00119a0123b775b670f17d311ef71d028fcf7ea774bc4d645cfa4583389` |
| 17 | Endurance pair 2 | `24926b7f3eb79c67d8d3374551af0ced4ab00c6846885dc8feaeeb380cd30987` |
| 18 | Endurance pair 3 | `d60c8af79616791fccdf391b770fceb28821e6c9379cd48ee81c6579becf38c8` |
| 19 | Endurance pair 4 | `7cf227408e495627d05ff6a5bb58470043a441db6c171b63e87caccb363ddf1e` |
| 20 | Endurance pair 5 | `5eef714f7d31e3c386ae577fa8ba0d2570c4408addd2ceea0f1ba7e95779bc99` |
| 21 | Endurance pair 6 | `c4f11a2fe73d167a0cc066aed78b7163c4df22181a81f67ea8042e9b26bb294b` |

The application previews the predicted endurance pair for each selectable fighter before export.

---

## UI / implementation

New panel:

**Single-player ladder grammar · 1E.3N.2**

It shows:

- the four original map streams;
- the invariant progression grammar;
- the six endurance pairing formulas;
- a selectable Test Your Might / endurance token;
- a selectable playable fighter used only to preview the expected player-relative endurance pair;
- a guarded first-event bundle export.

`Run What's Needed` now contains nine dependency-aware stages and ends with 1E.3N.2.

Main new files:

- `src/games/mk1/research/singlePlayerLadderGrammar.ts`
- `src/components/LadderGrammarHarness.tsx`
- `scripts/run-ladder-grammar.mjs`

New direct smoke command after dependencies are installed:

`npm run smoke:ladder-grammar -- /path/to/mk1 /path/to/evidence`

---

## Validation status

In the packaging environment:

- the new research module passes targeted TypeScript checking;
- the new UI plus modified quick-run path pass targeted TypeScript checking with dependency shims;
- the smoke-script syntax passes `node --check`;
- the grammar locator was executed directly against the canonical authentic MK1 executable bytes;
- it reproduced the unique dispatcher at `0x5E819`;
- it reproduced the Test Your Might destination and literal heading;
- it reproduced the endurance mapper at `0x5E884` and table at `0x96E23`;
- it reproduced all six stable pairing patterns across all seven playable-character rows;
- all four maps matched the invariant grammar;
- all seven exported research tokens produced only the four expected byte edits and reversed to the canonical original hash.

The full npm/Vite/Vitest suite is not claimed in this packaging environment because the source package does not include installed dependencies. Browser-generated 1E.3N.2 evidence remains pending until the user runs the source against the authentic installation.

Status:

**1E.3N.2 IMPLEMENTED — DIRECT AUTHENTIC-BINARY VALIDATION PASSED — USER BROWSER/RUNTIME SPOT-CHECK PENDING**

---

## Recommended immediate runtime spot-check

A single endurance spot-check is sufficient to validate that the recovered table is being consumed as reconstructed.

Recommended default:

**token 18 / 0x12 — Endurance pair 3**

The UI will preview the expected two fighters for whichever playable character the user intends to select.

Record:

1. selected fighter;
2. first endurance opponent;
3. second endurance opponent;
4. stage;
5. whether the transition between the two opponents behaves like a normal endurance match.

A Test Your Might token-15 spot-check is optional because the code/data linkage to the literal heading is already direct; it would be useful mainly to observe how forcing that event at ladder position zero affects continuation.

---

## After this pass

Do not turn the access harness into a general cheat menu. Its purpose is controlled observation of original engine states.

Once one endurance runtime spot-check agrees with the qualified pair table, return to the pending asset-model questions, especially:

- slot 8 / Shang Tsung palette ownership (`YANG_P` / `EMP_P` relationship);
- the deferred green-ninja encounter path when there is a bounded reason to qualify it;
- later, stage selection via a separately recovered stage-access grammar rather than opponent hacks.

The overall product target remains the full MK-DOS asset compiler/reassembler, not a trainer.
