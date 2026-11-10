# P81 accepted original DOS and real Chrome consolidation checkpoint

**Acceptance date:** 2026-11-10 (user's local Windows run)  
**Development branch tested:** `interim/p79-original-extraction`  
**Status:** **ACCEPTED — all 9/9 original-fixture and real Chrome groups passed**  
**Source commit tested:** `78fde5eda21723aea5b43b9b3214a9f362c292fb`  
**Source tree tested:** `92974d30ce9363661b5d19d4a4608e5ef7ffbf4c`  
**Working copy:** `F:\Dev\MKEXT\SOURCE\mkdosext`  
**Original game sources / private reports:** `F:\Dev\MKEXT\FIXTURES` (excluded from Git)  
**Stable branches:** `main` and `develop` **not promoted**.

## Exact provenance and confidence

The user ran the actual original DOS MK1, MK2 and MK3 installations through the **committed full `scripts/verify-p81-checkpoint.py` runner** in Windows PowerShell. The complete process-produced final JSON was supplied in the conversation, including `status:PASS`, the source commit/tree fingerprints, nine required groups and full independent-original/Chrome flags. The GitHub commit API independently confirms that the reported **commit SHA and tree SHA form the actual accepted Git commit/tree pair**. The nested per-group report, copyrighted original game files, individual downloaded ZIPs and media remain in the user's private `FIXTURES\VALIDATION` work directory; they were **not independently opened by this assistant or uploaded**. The reported P81 pass is user-provided reproducible original-fixture/Chrome evidence, not a claim that GitHub Actions itself had commercial game files.

The actual final report fields supplied by the user:

```json
{
  "pass": "P81",
  "status": "PASS",
  "sourceBranch": "interim/p79-original-extraction",
  "sourceCommit": "78fde5eda21723aea5b43b9b3214a9f362c292fb",
  "sourceTree": "92974d30ce9363661b5d19d4a4608e5ef7ffbf4c",
  "requiredGroupsPassed": 9,
  "inheritedP76OriginalGroups": 6,
  "inheritedP71OriginalGroups": 10,
  "originalThreeGameBaseline": 17211,
  "originalMk3AssetCounts": [9186, 9205, 9402, 9619],
  "additionalIndexedImageRepresentations": 217,
  "additionalOriginalRawStoredRecords": 216,
  "optInThreeGameAssetRepresentations": 17644,
  "originalDosAndRealChromeP76P78P80Verified": true,
  "originalP77P79SourceVerifiedViaIndependentOracles": true,
  "sourceAuditUnchanged": true,
  "nativePaletteOpacityStageOrAnimationOwnershipClaimed": false,
  "mainOrDevelopPromoted": false
}
```

The `privateReport` field of the original response pointed to a private JSON file in `F:\Dev\MKEXT\FIXTURES\VALIDATION\P81-c58d79410f6d47aeb66aa87ddb450e14\report.json`. **Do not publish that report, the original DOS archives, or any downloaded copyrighted media**. Keep it available for local reproducibility and follow-up failures.

## Nine required original/Chrome groups — all passed

| Group | P81 acceptance | Distinguishing assertion |
|---|---|---|
| `p76_inherited_three_game_original_and_chrome` | **PASS** | Existing P76 full six-group fixture/browser gate including P71 ten inherited MK1/MK2/MK3 original+Chrome groups; source commit/tree and game EXEs audited |
| `p77_chained_original_source_refusals` | **PASS** | Nine strict chained source/refusal controls |
| `p79_leading_original_source_refusals` | **PASS** | Four bounded leading-span source/refusal controls |
| `p78_additional_images_source_refusals` | **PASS** | Additional indexed image source and fabricated-evidence refusals |
| `p80_leading_index_and_raw_source_refusals` | **PASS** | False native mask/frame claims and malformed leading records refused |
| `p78_complete_original_index_and_zip` | **PASS** | Original MK3 197 additional indexed records; 6,616,595 positions; 1,182 indexed ZIP sidecars; P77 independent 432-PNG oracle |
| `p78_real_chrome_index_and_zip` | **PASS** | Real original MK3 browser selection and downloaded indexed ZIP independently compared against source |
| `p80_complete_original_index_and_raw` | **PASS** | Original base 64,000 indexed positions and all 216 header+payload raw records, preserving six empty records and 1,775,852 source bytes |
| `p80_real_chrome_index_and_raw` | **PASS** | Browser opt-in to 9,619 MK3 representations; downloaded index-map ZIP and separate nonempty + empty raw records independently checked |

The unchanged default original-game catalogue remains **MK1 2,656 + MK2 5,369 + MK3 9,186 = 17,211**. Explicit source-backed MK3 opt-ins give **9,205** after P76 (19 images), **9,402** after P78 (197 more images), **9,619** after P80 (one further index-map image and 216 individually exportable *raw* records). All optional combined representations: **17,644**. Counting the 216 raw records as independent decoded animation frames would be unsupported and is prohibited.

The 216 P77/P78 **source-indexed image records** and the different 216 P79/P80 **raw continuation stored records** refer to different source mechanisms and must not be conflated.

## Why one first P81 replay failed before acceptance

The first P81 Windows run completed the nested original P76 subprocess but rejected its mixed progress+JSON stdout, because P81 had attempted to `json.loads` all of P76's output. The fix on the tested commit requires the exact six canonical P76 progress markers, a single final JSON matching `p76-original-three-game\summary.json`, six nested ordered PASS groups, original EXE identities and the matching unchanged source audit. Separate regression tests reject missing/reordered markers, substituted summaries and forged source-tree claims. These source-only controls passed [GitHub Actions 42882842029](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42882842029) on the source/test commit `5696bc3ad922ee5ede930efad063df9d5ca985a1`; the later source-identity-tested `78fde5e` is **documentation-only relative to that code/test baseline**. Crucially, the **complete original DOS P81 nine-group test was rerun and passed on `78fde5e`**, not inherited as an untested result from the earlier failure.

## Research and implementation confidence

- **VERIFIED:** original-game file/asset counts; exact original source-indexed data, masks and ZIPs within the tested paths; the P77 216 source-indexed source records; P78 197 additional gallery images; P79 one base index image and 216 bounded raw stored records (six empty); P80 base index and raw export, real original Chrome interactions and independent downloaded ZIP/PNG/source byte checks.
- **INFERRED / display-only:** source row-X placement and omitted-row transparency where separately marked; opaque grayscale visualization of the 320×200 P79/P80 base index plane. These are not proof of original DOS renderer semantics.
- **UNKNOWN:** original fighter and stage native palette ownership, original opacity of the base image, stage compositor/layer and camera placement, whether and how P79/P80 continuation payloads decode to visual frames, and native animation sequence, frame ordering and timing. No native gameplay or audio-CD image completeness asserted by P81.

## Fifth-pass checkpoint decision

**P77–P81 is consolidated and accepted**, tied to tested source/tree above. The source, research workbench, scripts and regression suite are already committed and recoverable on the interim Git branch. A separate full-source release bundle or `main` promotion is **not automatically justified** by test acceptance and was not performed. The accepted *source snapshot* is the original `78fde5e` commit; subsequent acceptance documentation commits should not be misrepresented as having been re-tested with commercial game fixtures. Preserve all commercial data and original-derived private outputs under `FIXTURES`, all tools under `TOOLS`, and all repository content under `SOURCE\mkdosext`.

The next development cycle should prioritize remaining usable extraction coverage (e.g., source-supported stage composition, sound/speech/music extraction gaps or independently bounded raw undecoded regions), rather than unrelated gameplay reverse engineering or UI embellishment. Do not begin unverified palette/animation assertions without new reproducible original DOS evidence.
