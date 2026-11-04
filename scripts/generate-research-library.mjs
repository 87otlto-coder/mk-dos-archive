/** Build a read-only, browsable copy of the project's markdown research records.
 * Does not read commercial game assets. Deterministic, safe relative URLs.
 */
import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const target = join(root, 'public', 'research-docs');
const indexFile = join(root, 'public', 'research-index.json');

async function listMd(folder) {
  const files = [];
  let entries;
  try { entries = await readdir(folder, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const full = join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await listMd(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) files.push(full);
  }
  return files;
}

const top = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
  .map(entry => join(root, entry.name));
const included = [...top, ...await listMd(join(root, 'docs')), ...await listMd(join(root, 'research_evidence')), ...await listMd(join(root, 'legacy_evidence'))]
  .sort((a, b) => a.localeCompare(b));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
const index = [];
for (const path of included) {
  const rel = relative(root, path).split(sep).join('/');
  if (rel.startsWith('../')) throw new Error('Research document escaped source root');
  const content = await readFile(path);
  const body = content.toString('utf8');
  const heading = body.match(/^\s*#\s+(.+)$/m)?.[1]?.trim() || rel.split('/').pop();
  const clean = body.replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*#{1,6}\s+/gm, ' ').replace(/[*_`|]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const id = createHash('sha256').update(rel).digest('hex').slice(0, 20);
  const url = `/research-docs/${id}.md`;
  await writeFile(join(target, `${id}.md`), content);
  index.push({ id, path: rel, title: heading, summary: clean.slice(0, 300),
    bytes: content.byteLength, group: /MK1|1E3|KANO|RAYDEN/i.test(rel) ? 'mk1' :
      /MK2|O\d{2,3}|PORTAL|TOWER/i.test(rel) ? 'mk2' : /MK3/i.test(rel) ? 'mk3' : 'shared', url });
}
await writeFile(indexFile, JSON.stringify({ schema: 'mkdos_research_library_v1', documents: index }, null, 2) + '\n');
console.log(`Research library: ${index.length} records; original markdown remains untouched.`);
