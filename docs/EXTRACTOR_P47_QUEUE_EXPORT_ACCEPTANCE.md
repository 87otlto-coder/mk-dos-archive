# P47 source-order presentation export acceptance
2026-11-07; first interim after P46, develop only.

## Where we are
P46 remains the consolidated, full three-game checkpoint. P47 adds targeted original-fixture acceptance of the shared queue/export API. No runtime source changes or new assets. Full cumulative regression was not repeated; P46 remains its latest evidence.

A controllable local browser was not exposed in this session. Available capability discovery did not supply an extension controller or cloud CUA session that could access the private local application/fixtures. A cloud-only browser suggestion would not establish local original-data access. Browser clicks, preview interaction and download dialogs therefore remain VALIDATION PENDING.

## Verified this pass
Eight original source groups / 57 original frames generate **32 APNG cases / 236 presentation frames**: original order, user reordering with duplicate frames, and the 10 ms / 60,000 ms bounds. Normal cases use 137 ms, edited queues 73 ms. These are presentation settings, not native gameplay times.

Independent Python CRC/chunk/zlib/PNG reconstruction verifies every exported frame's padded RGBA against its selected-source PNG, APNG sequence numbers, full-frame rectangles, disposal/blend fields, declared frame count, presentation repetition and exact user timing. **1,085,968 RGBA channel comparisons PASS**. Transparent source RGB is treated according to the existing compositor's zero-alpha behavior; raw indexed sidecars are retained in source ZIPs.

**Four tampered APNG cases rejected:** CRC corruption, wrong sequence number, wrong user delay, and changed pixels with valid CRC. Clean export reverified. Existing P19 focused compatibility **280 checks PASS**. These checks strengthen the old header-level acceptance; they do not verify UI event handling, download permissions, native timing or palette/DAC ownership.

~~~sh
node scripts/verify-mk2-p47-queue-exports.cjs <original-dir> <private-output>
python scripts/verify-mk2-p47-apng-independent.py <private-output> --report <private-json>
node scripts/verify-mk2-p19-source-order-queue.cjs <original-dir> <private-compatibility.json>
~~~

Private output is rejected inside source or original fixtures after resolving existing ancestors. No original artwork, APNGs or ZIPs are committed. Only scripts, counts and qualification evidence are saved. Source-only CI syntax/load checks are separate from these original-fixture tests.

## What's next
P48 should exercise original-data browser report downloads, one added indexed family and a source-order queue when a controlled local session is available. If unavailable, continue a concrete extractor improvement from existing verified research and retain the browser gate as pending; do not equate shared API tests with UI validation. P51 remains the next consolidation assessment. Main stays P16.

At every stopping update, state the current pass, verified result, material uncertainty and next action, as requested.
