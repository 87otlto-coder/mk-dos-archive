# MK DOS Archive — 2026-10-08 source checkpoint through O95N

This remains an unfinished forensic-reconstruction checkpoint. Read `CHECKPOINT_2026-10-08_O95N.md` first, then O95M, then O95L/O95K/O95J/O95I/O95H/O95G/O95F/O95E/O95D/O95C/O95B/O95A and the O94 audio passes for preceding state. Older handoffs are retained as history and can contain superseded continuation prose.

## Current continuation authority

Read `MK_DOS_Archive_MASTER_HANDOFF_2026-10-08_FULL_PROJECT_THROUGH_O95N.md` before starting new work. The user-directed order remains: **finish MK2 research completely -> finish MK1 -> finish MK3 -> discuss UI/usability -> only then build the extractor.** Product/browser integration remains deferred.

## Current O95N animation-consumer boundary

O95N classifies all **31** formerly generic O95H `UNRESOLVED` routes: **23 terminal-qualified**, **3 strong nonterminal consumers**, and **5 structural-only**. Strict terminal-qualified coverage is now **208/253** and strong selected-pointer consumer-qualified coverage is **237/253**, leaving **16/253** without a strong qualified consumer. A new terminal consumer at `0x83ECD` walks a zero-terminated cursor-record grammar; its field semantics remain unknown.

The next bounded pass is **O95O — final 16 held/problematic selected-pointer routes**. Do not merge uncertainty classes or infer semantics across consumers.

## Build/runtime note

The included `dist/` is still the **pre-O91 October 7 build**. O91-O95L source/research changes have not been regenerated into `dist/` in this execution environment. Do not hand-edit generated JavaScript to simulate a rebuild. In a normal development environment run `npm install`, `npm run lint`, `npm run build` before browser-testing the newer source changes.

## Run the included prebuilt checkpoint

Install Node.js if needed. Double-click `Launch_Checkpoint.bat`, then open **http://127.0.0.1:3001/** in Chrome or Edge. No npm installation is required for this prebuilt version. Keep the launcher window open.

For source development: `npm install`, `npm run lint`, `npm run build`, `npm run dev -- --host 127.0.0.1`.

## Current MK2 U8 boundary

O94D authorizes a bounded **source-domain** mono 8-bit PCM WAVE for the authenticated mixer-readable interval `[U32(+0x00), U32(+0x04))`, using header `+0x10` as the source sample rate (11025/22050 Hz) and XOR `0x80` for signed-to-unsigned 8-bit PCM conversion. This is not a bit-exact capture of the runtime resampler/mixer. The 33-byte/1-byte unread tail purpose remains unknown and is excluded from WAV output.

O95A completed the MK2 closure-blocker census. O95B–G establish two authentic identity-indexed lookup families, the standard composition interpreter, five fixed numeric witnesses, and at least one distinct direct-descriptor grammar. O95H partitioned all **253** authenticated Family-A/B lookup calls; O95I corrected the 23 `0x6334A` paths to segment-navigation rather than terminal consumers. **O95J now follows all 23 navigation routes downstream:** **20** reach the already-qualified standard composition interpreter family through direct, helper, transformed-cursor, scheduler-preserved, or dual-secondary-cursor paths; **3** remain unresolved because `0x75A78` is explicitly replaced before a qualified terminal consumer is reached. Terminal-qualified lookup routes therefore rise from **141** to **161 / 253**, leaving **92** structural-handoff/unresolved routes. No fighter/move name or wall-clock timing is inferred. Historical O95J continuation completed by O95K/O95L. Current next action is **O95M — scheduler/reselection selected-pointer provenance**. Product/browser integration remains deferred until MK2, MK1 and MK3 are research-closed for extractor scope.
