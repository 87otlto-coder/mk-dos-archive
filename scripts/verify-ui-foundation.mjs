import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
let checks = 0;
const test = (name, fn) => { fn(); checks++; console.log(`PASS ${name}`); };
const asText = async rel => await readFile(join(root, rel), 'utf8');
const source = await asText('src/App.tsx');
const museum = await asText('src/components/MuseumWorkspace.tsx');
const stage = await asText('src/components/MK2StageEffectsPreview.tsx');
const browser = await asText('src/components/AssetBrowser.tsx');
const archive = await asText('src/components/ResearchArchive.tsx');
const docs = JSON.parse(await asText('public/research-index.json'));

test('Museum and Laboratory are both navigation destinations', () => {
  assert(museum.includes('MUSEUM_NAV') && museum.includes('LAB_NAV'));
  assert(source.includes('MUSEUM_NAV.map') && source.includes('LAB_NAV.map'));
});
test('Onboarding loads the original directory picker', () => assert(source.includes('<DirectoryPicker onSelectDirectory={handleSelectDirectory}')));
test('Source indexing remains local and read-only', () => assert(source.includes('buildDirectoryInventory') && stage.includes('source.readSlice')));
test('Ordinary asset browsing is isolated from specialized laboratory tools', () => {
  assert(source.includes('<AssetBrowser') && source.includes('page === \'laboratory\''));
  assert(source.includes('<LabGroup'));
});
test('MK1 read-only modified executable fallback survives', () => {
  assert(browser.includes('MK1_READ_ONLY_FALLBACK'));
  assert(browser.includes('Coverage & evidence'));
});
test('MK2 stage viewer uses the existing authenticated O136 decoder', () => {
  assert(stage.includes('readMK2OriginalEffectFramesO136'));
  assert(stage.includes('Original MK2 source files are required') || stage.includes('Original MK2 source files'));
});
test('Museum preview does not assert authentic FPS or screen placement', () => {
  assert(stage.includes('not proven native gameplay timing'));
  assert(stage.includes('final full-scene composition remain unresolved'));
});
test('Research archive uses source-file URLs and does not mutate historical documents', () => {
  assert(archive.includes("fetch('/research-index.json'"));
  assert(archive.includes('Download original .md'));
});
test('Index has unique stable identities and safe paths', () => {
  assert.equal(docs.schema, 'mkdos_research_library_v1');
  assert(docs.documents.length >= 300);
  assert.equal(new Set(docs.documents.map(d => d.id)).size, docs.documents.length);
  for (const doc of docs.documents) {
    assert(/^[0-9a-f]{20}$/.test(doc.id));
    assert(!doc.path.includes('..'));
    assert.equal(doc.url, `/research-docs/${doc.id}.md`);
  }
});
let verified = 0;
for (const doc of docs.documents) {
  const original = await readFile(join(root, doc.path));
  const copy = await readFile(join(root, 'public', `research-docs/${doc.id}.md`));
  assert.equal(doc.id, createHash('sha256').update(doc.path).digest('hex').slice(0, 20));
  assert(original.equals(copy), `Document copy is not byte-identical: ${doc.path}`);
  assert.equal(doc.bytes, original.byteLength);
  verified++;
}
checks += verified;
console.log(`PASS ${verified} original markdown documents copied byte-identically`);
const publicFiles = await readdir(join(root, 'public', 'research-docs'));
test('No extra or missing served research documents', () => assert.equal(publicFiles.length, verified));
console.log(`UI Foundation 1: ${checks} checks passed.`);
