#!/usr/bin/env node
/** P87 headless original MK1 P65 ANITAB / O60 indexed-source package bridge.
 *
 * Reuses the accepted MK1 collection/P65 package producer unchanged, then
 * independently replays the existing P65 original EXE descriptor/stream oracle.
 * NO native palette, frame duration, actor placement, Z order, or gameplay
 * animation traversal is inferred. Commercial files and private packages stay
 * outside this Git checkout. This bridge may also be invoked directly.
 */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const ts = require('typescript');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (mod, filename) => {
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText, filename);
};
if (!globalThis.crypto) globalThis.crypto = crypto.webcrypto;

const {scanAssets} = require('../src/core/assets/collection.ts');
const {MK1_P65_PACKAGE} = require('../src/core/assets/mk1AnitabIndexedStreamsP65.ts');
const {parseAnimationStoreZip} = require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');

const ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const CANONICAL_EXE = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const SHA = b => crypto.createHash('sha256').update(b).digest('hex');
const inside = (parent, child) => {
  const rel = path.relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel));
};
function requirePrivate(action, folder, archiveArg) {
  assert(!inside(ROOT, folder), 'P87 commercial original folder cannot be in Git SOURCE checkout');
  if (action === 'scan') {
    assert(archiveArg === undefined, 'P87 scan accepts no archive path');
    return null;
  }
  assert(archiveArg, 'P87 extract/verify requires private ZIP path');
  const candidate = path.resolve(archiveArg);
  assert(path.extname(candidate).toLowerCase() === '.zip', 'P87 archive must have .zip extension');
  const parent = fs.realpathSync(path.dirname(candidate));
  const target = path.join(parent, path.basename(candidate));
  assert(!inside(ROOT, target) && !inside(folder, target),
    'P87 private archive must remain outside Git checkout and commercial installation');
  if (action === 'extract') assert(!fs.existsSync(target),
    'P87 refuses to overwrite an existing private archive');
  else {
    assert(fs.statSync(target).isFile(), 'P87 verify requires an existing private ZIP');
    const original = fs.realpathSync(target);
    assert(!inside(ROOT, original) && !inside(folder, original),
      'P87 private ZIP symlink cannot resolve into Git or original installation');
  }
  return target;
}
function inventory(folder) {
  const data = new Map();
  function walk(dirname, prefix='') {
    for (const entry of fs.readdirSync(dirname, {withFileTypes: true})) {
      const relative = prefix ? prefix + '/' + entry.name : entry.name;
      const filename = path.join(dirname, entry.name);
      assert(!entry.isSymbolicLink(), 'P87 original source symlinks are not supported: ' + relative);
      if (entry.isDirectory()) walk(filename, relative);
      else if (entry.isFile()) data.set(relative, fs.readFileSync(filename));
    }
  }
  walk(folder);
  const originalExe = [...data].filter(([name]) => path.basename(name).toUpperCase() === 'MK1.EXE');
  assert.equal(originalExe.length, 1, 'P87 requires exactly one original MK1.EXE');
  assert.equal(SHA(originalExe[0][1]), CANONICAL_EXE, 'P87 canonical MK1.EXE fingerprint mismatch');
  const entries = [...data].map(([p,b]) => ({
    path: p, name: path.basename(p),
    extension: path.extname(p).slice(1).toUpperCase(), size: b.length,
  }));
  const source = {
    directoryName: 'P87 canonical MK1 DOS', isSynthetic: false,
    async listRecursive() { return entries; },
    async readSlice(p, start, count) {
      const bytes = data.get(p);
      assert(bytes, 'P87 original source file is missing: ' + p);
      assert(Number.isSafeInteger(start) && start >= 0 &&
        Number.isSafeInteger(count) && count >= 0, 'P87 invalid source byte slice');
      // Match the accepted P65 DirectorySource: return a fresh Uint8Array,
      // never a mutable Buffer view into the cached original commercial file.
      return Uint8Array.from(bytes.subarray(start, start + count));
    },
  };
  return source;
}
function independentOriginalP65(folder) {
  const result = spawnSync(process.execPath, ['scripts/verify-mk1-p65-anitab-streams.cjs', folder], {
    cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 5400000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(
    'P87 existing P65 independent original-EXE/source oracle failed: ' +
    [result.error?.message, result.stderr, result.stdout].filter(Boolean).join('\n'));
  const value = JSON.parse(result.stdout);
  const expected = {
    pass:'P65',status:'PASS',mk1Assets:2656,originalTables:8,
    verifiedAnitabCells:739,uniqueOriginalSourceStreams:514,
    sourceInstructionFrameOccurrences:1824,sourceInstructionControlOccurrences:786,
    indexedDescriptorRecords:1102,indexedSourceFramePartsVerified:1853,
    distinctLinkedDescriptorKeys:1102,
    originalExecutableOpcodesAndPointersMatched:true,
    originalO60IndexedBytesByteIdentical:true,noOriginalPaletteOrTimingAssigned:true,
    fullThreeGameRegressionPerformed:false,browserPackageDownloadVerified:false,
  };
  for (const [key, expectedValue] of Object.entries(expected))
    assert.deepEqual(value[key],expectedValue,'P87 independent original P65: '+key);
  return value;
}
async function main() {
  const [action, sourceArg, archiveArg, ...extra] = process.argv.slice(2);
  assert(['scan','extract','verify'].includes(action) && sourceArg && extra.length === 0,
    'P87 usage: node scripts/mk1_p87_source_bridge.cjs scan|extract|verify ORIGINAL_MK1_DIR [PRIVATE_ZIP]');
  const folder = fs.realpathSync(sourceArg);
  assert(fs.statSync(folder).isDirectory(), 'P87 original MK1 source must be a folder');
  const archive = requirePrivate(action, folder, archiveArg);
  const source = inventory(folder);
  const collection = await scanAssets(source, 'mk1', () => {});
  assert.equal(collection.assets.length,2656,'P87 original MK1 catalog baseline changed');
  assert.equal(collection.reports?.p65IndexedAnitabStreams?.status,'VERIFIED',
    'P87 qualified P65 indexed animation source package unavailable');
  const packages = collection.packages.filter(x => x.name === MK1_P65_PACKAGE);
  assert.equal(packages.length,1,'P87 requires exactly one P65 original package');
  const producerBytes = Buffer.from(packages[0].bytes);
  const zip = parseAnimationStoreZip(producerBytes);
  assert.equal(zip.size,4,'P87 P65 archive must contain four entries');
  const readMember = name => {
    const member = zip.get(name);
    assert(member, 'P87 missing original P65 package member: ' + name);
    return member.bytes;
  };
  const manifest = JSON.parse(Buffer.from(readMember('manifests/mk1_source_streams.json')).toString('utf8'));
  readMember('indexed/descriptor_manifest.json');
  const indexed = readMember('indexed/descriptor_pixels.bin');
  readMember('README.txt');
  assert.equal(manifest.format,'mk1_p65_lossless_anitab_source_streams_v1');
  assert.equal(manifest.originalExeSha256,CANONICAL_EXE);
  assert.equal(manifest.sourceTableCount,8);
  assert.equal(manifest.originalTableEntries,739);
  assert.equal(manifest.uniqueSourceExecutableStreams,514);
  assert.equal(manifest.indexedDescriptorCount,1102);
  assert.equal(manifest.originalIndexedBinaryByteLength,indexed.length);
  assert.equal(manifest.originalIndexedBinarySha256,SHA(indexed));
  assert.equal(manifest.nativeAnimationMillisecondsVerified,false);
  assert.equal(manifest.nativeLoopPeriodsVerified,false);
  assert.equal(manifest.originalPalettesNotAssigned,true);
  assert.equal(manifest.worldPlacementAndStageCompositionVerified,false);
  const overview = {
    status:'PASS', game:'mk1', sourceIdentity:'CANONICAL_P65_MK1_EXE',
    originalMk1ExeSha256:CANONICAL_EXE,
    originalCatalogAssetsObserved:2656, originalAnitabTables:8,
    originalAnitabTableEntries:739, sourceExecutableStreamStarts:514,
    originalIndexedDescriptorRecords:1102,
    originalIndexedBinaryBytes:indexed.length, packageMembers:4,
    nativePaletteOrTimingClaimed:false,nativeRuntimeTraversalVerified:false,
    finalActorPlacementOrStageCompositeClaimed:false,
    completeMk1CatalogExportClaimed:false,previewPngsCreated:0,browserRequired:false,
  };
  if (action === 'scan') {
    console.log(JSON.stringify({pass:'P87_CLI_MK1_SCAN',...overview},null,2));
    return;
  }
  // Source-only producer is NOT sufficient. Replay established P65 original
  // executable instruction and O60 indexed-plane oracle before any PASS.
  const originalOracle = independentOriginalP65(folder);
  if (action === 'extract') {
    // 'wx' refuses to overwrite, including races, and leaves all original
    // derived data in a user-chosen private ZIP outside Git/source folders.
    fs.writeFileSync(archive,producerBytes,{flag:'wx'});
  }
  const archiveBytes = fs.readFileSync(archive);
  assert.equal(SHA(archiveBytes),SHA(producerBytes),
    'P87 exported original P65 source package is not byte-identical to recomputed archive');
  console.log(JSON.stringify({
    pass:action === 'extract'?'P87_CLI_MK1_EXTRACT':'P87_CLI_MK1_VERIFY',
    ...overview,privateArchive:archive,
    recomputedPackageSha256:SHA(producerBytes),
    sourcePackageByteIdentical:true,independentOriginalP65Verifier:originalOracle,
  },null,2));
}
main().catch(error => { console.error('P87 MK1 source bridge ERROR: '+(error.stack||error)); process.exitCode = 1; });
