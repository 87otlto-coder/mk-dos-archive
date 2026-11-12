#!/usr/bin/env node
/** P83 regression guard: prevent stale previews when switching same-named floors.
 *
 * Source-structure guard only; original DOS real-Chrome acceptance remains
 * required. No commercial game files or browser needed for this test.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src/components/AssetBrowser.tsx'), 'utf8');
const acceptance = fs.readFileSync(
  path.join(root, 'scripts/verify-p83-browser-stage-layers.cjs'), 'utf8');

// Picture holds a blob URL in state. Without an asset-specific key, React
// reuses the prior PNG until its effect installs the new source URL.
assert.match(ui, /<Picture\s+key=\{focus\.id\}\s+asset=\{focus\}\s*\/>/,
  'Inspector PNG preview must remount for a new asset ID');

// A group selection is asynchronous; a count of two cannot distinguish Tomb
// from Portal, because each has exactly two floor resources.
assert.match(acceptance,
  /await results\.first\(\)\.getByText\(target,\{exact:true\}\)\.waitFor\(\{timeout:30000\}\)/,
  'P83 runner must wait for a row from the selected resource group');
assert.match(acceptance,
  /await selectResourceGroup\('P83 '\+stage\+' · native-width floor'\)/,
  'P83 runner must switch to each named original floor group');

// Both groups have floor_indices.png. Confirm original source identity before
// waiting for native dimensions; otherwise a stale selection can appear valid.
assert.match(acceptance,
  /hasText:name==='tomb'\?'TOMB\.GRA':'PORTAL\.GRA'/,
  'P83 floor inspector must be source-qualified');
assert.match(acceptance, /assert\.equal\(await preview\.evaluate\(img=>img\.naturalHeight\),height,/,
  'P83 must still assert the strict native floor height, not suppress the check');
assert.match(acceptance,
  /await selectResourceGroup\('P83 The Portal · uncropped source sprites'\)/,
  'P83 runner must wait for Portal native-sprite group');
assert.match(acceptance,
  /await selectResourceGroup\('P83 The Portal · setup-local layers'\)/,
  'P83 runner must wait for Portal setup-local group');

console.log(JSON.stringify({
  pass: 'P83_STAGE_SWITCH_SOURCE_GUARD',
  status: 'PASS',
  originalGameFixturesUsed: false,
  staleSelectionAndPreviewPreventionChecked: true,
  originalChromeAcceptanceClaimed: false,
}));
