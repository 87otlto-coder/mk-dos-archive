# MK DOS Archive — Pass 1E.3O.56 Browser Stage Export Validation

**Status:** VERIFIED  
**Verdict:** `MK1_BROWSER_STAGE_EXPORT_BUNDLE_VALIDATED_AGAINST_O54_CANONICAL_CONTRACT`

## Objective

Independently validate the browser-produced O55 package against the verified O54 package contract and, separately, against the actual standalone `MK1_O54_STAGE_EXPORT_PACKAGE.zip` checkpoint artifact.

## In-app independent validator

`src/games/mk1/research/browserStageExportBundleValidation.ts` does not use the O55 PNG encoder to validate pixels. It independently:

- parses the STORE-only ZIP local entries;
- validates ZIP CRC32 values;
- parses PNG chunks and PNG CRCs;
- independently inflates the stored-DEFLATE zlib stream and validates Adler-32;
- reconstructs all RGBA rows;
- hashes and compares all 49 decoded RGBA buffers with O54;
- parses and compares all 48 stage documents;
- compares the exact O52/O53/O54 reports from the same workflow run;
- rejects missing or unexpected entries.

Final in-app result:

- ZIP entries: **101/101 expected**
- PNGs parsed: **49/49**
- raw-RGBA matches: **49/49**
- stage-document matches: **48/48**
- root report matches: **3/3**
- unexpected entries: **0**

## External standalone-package audit

A separate Python audit compared the final browser ZIP to the actual standalone `MK1_O54_STAGE_EXPORT_PACKAGE.zip` artifact:

- logical file set: **101 vs 101, exact**
- PNG raw RGBA: **49/49 exact**
- stage JSON documents: **48/48 byte-exact**
- README: byte-exact
- O52/O53/O54 root reports: **3/3 semantically equal after removing only expected run metadata** (`timestamp`, `operationId` and prerequisite operation IDs)

Standalone O54 ZIP SHA-256: `c8f74dd94b9d6d127c13d5442199da607879cae5f9bae27739f7d2e50b8008b9`  
Final browser ZIP SHA-256: `158c0e1c4311fa8eed4d897d50fdc34176b46d44920a35f2d3196b7efbdd34f7`

Different archive/PNG bytes are expected because O54 standalone used Node zlib while O55 uses deterministic stored-DEFLATE. Decoded pixels and stable structured content are exact.

## Workflow state

O55 and O56 are integrated as stages **64/65** and **65/65**. The new research modules compile through the targeted TypeScript path; both runner scripts pass `node --check`; `ResearchQuickActions.tsx` and both new modules pass TypeScript `transpileModule` syntax validation. A full application typecheck is still not claimed because the archival source does not contain installed React/lucide dependencies.

## Product result

The verified 24-stage MK1 background package is now directly downloadable from the normal browser/user-directory workflow. Research generation and product download are no longer separate manual steps.
