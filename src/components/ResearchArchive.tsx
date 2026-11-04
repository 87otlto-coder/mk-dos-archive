import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, ExternalLink, FileText, Search } from 'lucide-react';

interface ResearchDocument {
  id: string; path: string; title: string; summary: string; bytes: number;
  group: 'mk1' | 'mk2' | 'mk3' | 'shared'; url: string;
}
interface ResearchIndex { schema: string; documents: ResearchDocument[] }

export function ResearchArchive({ highlight = '' }: { highlight?: string }) {
  const [library, setLibrary] = useState<ResearchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(highlight);
  const [group, setGroup] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/research-index.json', { signal: ac.signal })
      .then(async r => { if (!r.ok) throw new Error(`Research index could not be loaded (HTTP ${r.status})`); return await r.json() as ResearchIndex; })
      .then(data => { if (data.schema !== 'mkdos_research_library_v1' || !Array.isArray(data.documents)) throw new Error('Research index format mismatch'); setLibrary(data.documents); })
      .catch(err => { if (!ac.signal.aborted) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return library.filter(doc =>
      (group === 'all' || doc.group === group) &&
      (!term || `${doc.title} ${doc.path} ${doc.summary}`.toLowerCase().includes(term)),
    ).reverse();
  }, [library, query, group]);
  const selected = library.find(doc => doc.id === selectedId);

  useEffect(() => {
    if (!selected) { setText(''); return; }
    const ac = new AbortController();
    setFileLoading(true); setFileError(''); setText('');
    fetch(selected.url, { signal: ac.signal }).then(async r => {
      if (!r.ok) throw new Error(`Document could not be loaded (HTTP ${r.status})`);
      return await r.text();
    }).then(setText).catch(err => { if (!ac.signal.aborted) setFileError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!ac.signal.aborted) setFileLoading(false); });
    return () => ac.abort();
  }, [selectedId]);

  return <div className="mw-page mw-archive-page">
    <div className="mw-intro"><span className="mw-eyebrow mw-lab-accent">LABORATORY / EVIDENCE</span><h1>Research archive</h1><p>Read historical checkpoints, source discoveries and handoffs directly. These are original markdown records, not rewritten summaries.</p></div>
    <div className="mw-toolbar">
      <label className="mw-search"><Search size={17}/><input value={query} onChange={e => { setQuery(e.target.value); setLimit(50); }} placeholder="Search offsets, checkpoints, tools…" aria-label="Search historical research"/></label>
      <select className="mw-select" aria-label="Filter research category" value={group} onChange={e => { setGroup(e.target.value); setLimit(50); }}>
        <option value="all">All records</option><option value="mk1">MK1 references</option><option value="mk2">MK2 references</option><option value="mk3">MK3 references</option><option value="shared">Shared / other</option>
      </select>
    </div>
    {loading && <p role="status" className="mw-muted">Loading indexed historical documents…</p>}
    {error && <p role="alert" className="mw-error">{error} — regenerate with <code>npm run refresh:research-library</code>.</p>}
    {!loading && !error && <p className="mw-muted mw-xs">{filtered.length.toLocaleString()} of {library.length.toLocaleString()} documents · Categorization is for navigation, not research confidence. Source markdown remains unmodified.</p>}
    <div className="mw-archive-layout">
      <div className="mw-archive-list" aria-label="Historical research documents">
        {filtered.slice(0, limit).map(doc => <button type="button" key={doc.id} className={`mw-document ${selectedId === doc.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(doc.id)}>
          <FileText size={18}/><span><strong>{doc.title}</strong><small>{doc.path}</small><em>{doc.summary.slice(0, 130)}</em></span>
        </button>)}
        {filtered.length > limit && <button className="mw-more" onClick={() => setLimit(n => n + 50)}>Show next 50 documents</button>}
        {!loading && !filtered.length && <div className="mw-empty"><BookOpen size={24}/><strong>No matching research records.</strong><p>Try another name, pass number or filename.</p></div>}
      </div>
      <article className="mw-document-detail">
        {selected ? <>
          <div className="mw-document-top"><span className="mw-eyebrow">SOURCE RECORD</span><h2>{selected.title}</h2><p>{selected.path}</p>
            <a href={selected.url} download={selected.path.split('/').pop()} className="mw-download"><Download size={15}/> Download original .md</a>
          </div>
          {fileLoading ? <p role="status">Loading document…</p> : fileError ? <p role="alert" className="mw-error">{fileError}</p> : <pre className="mw-markdown-raw">{text}</pre>}
        </> : <div className="mw-document-placeholder"><BookOpen size={34}/><h3>Every finding has a source.</h3><p>Select a research record to read the original document here, or download it unchanged.</p></div>}
      </article>
    </div>
  </div>;
}
