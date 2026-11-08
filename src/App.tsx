import React, { useRef, useState } from 'react';
import { AlertCircle, Archive, ArrowRight, BookOpen, FileText, FlaskConical, FolderOpen, Landmark, Menu, Microscope, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { DirectorySource } from './core/filesystem/DirectorySource';
import { buildDirectoryInventory, enrichInventoryWithGameContext, createInventoryExport } from './core/discovery/inventory';
import { detectGameFromInventory } from './core/discovery/gameDetection';
import { DirectorySwitchGateP68 } from './core/discovery/directorySwitchGateP68';
import type { InventoryEntry } from './core/models/InventoryEntry';
import type { GameDetectionResult } from './core/models/GameDetection';
import type { MK1PaletteScanResult } from './games/mk1/research/paletteTypes';
import { downloadDiagnosticLog } from './core/diagnostics/diagnosticLogger';
import { APP_VERSION, APP_MILESTONE } from './appMetadata';
import { DirectoryPicker } from './components/DirectoryPicker';
import { DetectionSummary } from './components/DetectionSummary';
import { InventoryView } from './components/InventoryView';
import { MK1ResearchProbe } from './components/MK1ResearchProbe';
import { MK1HandleTableView } from './components/MK1HandleTableView';
import { MK1SpriteDescriptorView } from './components/MK1SpriteDescriptorView';
import { MK1PaletteCatalogueView } from './components/MK1PaletteCatalogueView';
import { MK1ExecutableLayoutView } from './components/MK1ExecutableLayoutView';
import { ResearchQuickActions } from './components/ResearchQuickActions';
import { MK2FoundationPanel } from './components/MK2FoundationPanel';
import { MK2ObservedStageFloorPanel } from './components/MK2ObservedStageFloorPanel';
import { MK2IndexedStageMosaicsO122 } from './components/MK2IndexedStageMosaicsO122';
import { AssetBrowser } from './components/AssetBrowser';
import { ResearchErrorBoundary } from './components/ResearchErrorBoundary';
import { MuseumOverview, MuseumStages, MUSEUM_NAV, LAB_NAV, gameTitle, type WorkspacePage, type WorkspaceZone } from './components/MuseumWorkspace';
import { ResearchArchive } from './components/ResearchArchive';
import { O194Workbench } from './components/O194Workbench';
import type { KnownCompilation, HypothesisReport } from './core/experiments/o194';
import type { Asset, Game } from './core/assets/model';
import './components/MuseumWorkspace.css';

const names: Record<WorkspacePage, string> = {
  overview: 'Overview', assets: 'Asset library', stages: 'Stage gallery',
  laboratory: 'Research workbench', compiler: 'Compile & hypotheses', archive: 'Research archive', inventory: 'File inventory',
};
const isMuseum = (page: WorkspacePage): boolean => ['overview', 'assets', 'stages'].includes(page);

function LabGroup({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <section className="mw-lab-section">
    <button type="button" className="mw-lab-heading" aria-expanded={open} onClick={() => setOpen(x => !x)}>
      <span><strong>{title}</strong><small>{subtitle}</small></span><span className="mw-plus">{open ? '−' : '+'}</span>
    </button>
    {open && <div className="mw-lab-content"><ResearchErrorBoundary subsystem={title} title={`${title} error`}>{children}</ResearchErrorBoundary></div>}
  </section>;
}

function Laboratory({ source, detection, inventory }: {
  source: DirectorySource; detection: GameDetectionResult; inventory: InventoryEntry[];
}) {
  const [sharedPaletteScanResult, setSharedPaletteScanResult] = useState<MK1PaletteScanResult | null>(null);
  return <div className="mw-page mw-lab-page">
    <div className="mw-intro"><span className="mw-eyebrow mw-lab-accent">LABORATORY / TOOLS</span><h1>Research workbench</h1>
      <p>Original source analyzers and specialized editing research, preserved behind deliberate, independent entry points. Open only the investigation you need.</p></div>
    <div className="mw-evidence-callout mw-lab-callout"><ShieldCheck size={22}/><div><strong>Strict verification remains intact</strong><p>Read-only exploration does not require running specialized editors. Canonical-fixture checks still guard operations that require exact executable identities.</p></div></div>
    {detection.game === 'mk2' && <>
      <LabGroup title="Stage source layers & original animations" subtitle="O122–O177 · Tomb, Portal, Tower effects · source-width floors"><MK2IndexedStageMosaicsO122 source={source}/></LabGroup>
      <LabGroup title="Observed stage floors" subtitle="Runtime source/row preview evidence"><MK2ObservedStageFloorPanel source={source}/></LabGroup>
      <LabGroup title="MK2 executable & graphics foundation" subtitle="O67–O89 · source topology, graphics and palette research"><MK2FoundationPanel source={source}/></LabGroup>
    </>}
    {detection.game === 'mk1' && <>
      <LabGroup title="MK1 validated research workflow" subtitle="The original research quick actions, pipeline and specialized editors"><ResearchQuickActions source={source} detection={detection}/></LabGroup>
      <LabGroup title="Executable topology & palette catalogue" subtitle="LE layout, source addresses and recorded palette candidates">
        <MK1ExecutableLayoutView source={source} sharedPaletteResult={sharedPaletteScanResult}/>
        <MK1PaletteCatalogueView source={source} onScanResult={setSharedPaletteScanResult}/>
      </LabGroup>
      <LabGroup title="Sprite descriptors & handle tables" subtitle="Original file references, per-resource descriptors and scan evidence">
        <MK1SpriteDescriptorView source={source} inventory={inventory}/>
        <MK1HandleTableView source={source} inventory={inventory}/>
      </LabGroup>
      <LabGroup title="Historical fixture probes" subtitle="Experimental and canonical-specific verification"><MK1ResearchProbe source={source} inventory={inventory}/></LabGroup>
    </>}
    {detection.game === 'mk3' && <div className="mw-empty"><Microscope size={28}/><strong>MK3 research is preserved.</strong><p>This game currently has inventory and asset-browsing foundations. Further specialized lab panels will appear only once qualified rather than borrowing MK1/MK2 assumptions.</p></div>}
    {detection.game === 'unknown' && <p className="mw-muted">Specialized analyzers require an identified game; the research archive remains accessible.</p>}
  </div>;
}

export default function App() {
  const [source, setSource] = useState<DirectorySource | null>(null);
  const [inventory, setInventory] = useState<InventoryEntry[] | null>(null);
  const [detection, setDetection] = useState<GameDetectionResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<WorkspacePage>('overview');
  const [resourceSearch, setResourceSearch] = useState('');
  const [stageBindings, setStageBindings] = useState<unknown>(null);
  const [galleryAssets, setGalleryAssets] = useState<Asset[]>([]);
  const [assetNavRevision, setAssetNavRevision] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [known, setKnown] = useState<KnownCompilation | null>(null);
  const [experiment, setExperiment] = useState<HypothesisReport | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherIsOpen = useRef(false);
  const switchGate = useRef(new DirectorySwitchGateP68()).current;
  const activeSessionSerial = useRef(0);
  const [activeSessionId, setActiveSessionId] = useState(0);

  const navigate = (next: WorkspacePage) => {
    if (next === 'assets') { setResourceSearch(''); setAssetNavRevision(revision => revision + 1); }
    setPage(next); setMobileNav(false);
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  };

  const requestSwitch = () => {
    setError(null);
    switcherIsOpen.current = true;
    setSwitcherOpen(true);
  };
  const cancelSwitch = () => {
    // Retain the active game, selected assets and inspector. An in-flight
    // candidate scan may finish, but its result is now ineligible to commit.
    switchGate.cancel();
    switcherIsOpen.current = false;
    setSwitcherOpen(false);
    setIsScanning(false);
    setScanProgress(null);
    setError(null);
  };

  const handleSelectDirectory = async (selectedSource: DirectorySource) => {
    // A late ZIP read or stale file input event from a closed replacement
    // dialog must never silently become the active game.
    if (source && !switcherIsOpen.current) return;
    const revision = switchGate.begin();
    setError(null);
    setIsScanning(true);
    setScanProgress({ scanned: 0, total: 0 });
    try {
      const results = await buildDirectoryInventory(selectedSource, {
        headerSliceSize: 64, concurrency: 6,
        onProgress: (scanned, total) => {
          if (switchGate.isCurrent(revision)) setScanProgress({ scanned, total });
        },
      });
      if (!switchGate.isCurrent(revision)) return;
      if (results.length === 0) throw new Error(`Directory "${selectedSource.directoryName}" is empty or contains no readable files.`);
      const raw = detectGameFromInventory(results);
      const enriched = enrichInventoryWithGameContext(results, raw.game);
      const nextDetection = detectGameFromInventory(enriched);
      // During a replacement, do not destroy a valid source/queue for a
      // parent folder, mixed-game archive or inaccessible candidate.
      if (source && nextDetection.game === 'unknown')
        throw new Error(`"${selectedSource.directoryName}" is not a recognized single MK1, MK2 or MK3 installation (${nextDetection.gameName}).`);
      if (!switchGate.isCurrent(revision)) return;

      // Commit the entire new source session together. Keying the library
      // by session ID, not by folder name, prevents reusing an old queue if
      // two different installations share the same directoryName.
      const sessionId = ++activeSessionSerial.current;
      setActiveSessionId(sessionId);
      setSource(selectedSource);
      setInventory(enriched);
      setDetection(nextDetection);
      setKnown(null); setExperiment(null); setStageBindings(null); setGalleryAssets([]);
      setPage('overview'); setResourceSearch('');
      switcherIsOpen.current = false;
      setSwitcherOpen(false);
    } catch (err: unknown) {
      if (!switchGate.isCurrent(revision)) return;
      setError(`Failed to scan directory: ${err instanceof Error ? err.message : String(err)}`);
      // The previously accepted source stays active, including its
      // background previews and export selection.
    } finally {
      if (switchGate.isCurrent(revision)) {
        setIsScanning(false); setScanProgress(null);
      }
    }
  };

  const exportInventory = () => {
    if (!source || !inventory || !detection) return;
    const data = createInventoryExport(source.directoryName, inventory, detection);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url;
    a.download = `inventory_${source.directoryName.replace(/[^\w-]/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const ready = !!(source && detection && inventory?.length);
  const zone: WorkspaceZone = isMuseum(page) ? 'museum' : 'laboratory';

  return <ResearchErrorBoundary subsystem="app-root" title="Application Error"><div className="mw-app">
    <header className="mw-header">
      <div className="mw-brand"><span className="mw-brand-mark">MK<span>·</span></span><div><strong>MK DOS ARCHIVE</strong><small>MUSEUM & RESEARCH LABORATORY</small></div></div>
      <div className="mw-header-actions">
        {ready && <span className="mw-game-pill"><span className="mw-online-dot"/>{gameTitle(detection!.game)}</span>}
        <span className="mw-version">v{APP_VERSION}</span>
        <button className="mw-icon-button" title="Export diagnostic log" aria-label="Export diagnostic log" onClick={() => downloadDiagnosticLog(detection?.game || 'mk1')}><FileText size={17}/></button>
        <button className="mw-icon-button mw-mobile-toggle" title="Open navigation" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(v => !v)}>{mobileNav ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
    </header>
    <div className="mw-shell">
      <aside className={`mw-sidebar ${mobileNav ? 'mw-mobile-open' : ''}`} aria-label="Workspace navigation">
        <div className="mw-sidebar-top"><span className="mw-eyebrow">WORKSPACES</span><p>Explore what we know.<br/>Investigate how we know it.</p></div>
        <div className="mw-nav-label"><Landmark size={14}/> MUSEUM</div>
        <nav aria-label="Museum navigation">
          {MUSEUM_NAV.map(({ page: id, label, icon: Icon }) => <button key={id} className={`mw-nav-link ${page === id ? 'is-active' : ''}`} onClick={() => navigate(id)}><Icon size={18}/><span>{label}</span></button>)}
        </nav>
        <div className="mw-nav-divider"/>
        <div className="mw-nav-label mw-lab-color"><FlaskConical size={14}/> LABORATORY</div>
        <nav aria-label="Laboratory navigation">
          {LAB_NAV.map(({ page: id, label, icon: Icon }) => <button key={id} className={`mw-nav-link ${page === id ? 'is-active' : ''}`} onClick={() => navigate(id)}><Icon size={18}/><span>{label}</span></button>)}
        </nav>
        <div className="mw-sidebar-bottom"><div className="mw-source-state"><span className={`mw-online-dot ${ready ? '' : 'mw-offline-dot'}`}/>{ready ? 'GAME SOURCE LINKED' : 'NO SOURCE LINKED'}</div>
          {ready ? <><strong title={source!.directoryName}>{source!.directoryName}</strong><button onClick={requestSwitch}><FolderOpen size={14}/> Change directory</button></> : <p>Select an original game folder or ZIP to begin.</p>}
        </div>
      </aside>
      <main className="mw-main" id="main-content">
        <div className="mw-breadcrumb"><span>{zone === 'museum' ? 'Museum' : 'Laboratory'}</span><span>/</span><strong>{names[page]}</strong></div>
        {error && !switcherOpen && <div role="alert" className="mw-error-bar"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
        {isScanning && <div className="mw-loading"><RefreshCw size={29} className="mw-spin"/><h2>Indexing your game installation</h2><p>Reading file signatures locally. Original resources are not uploaded.</p>{scanProgress && <small>{scanProgress.scanned} / {scanProgress.total} files</small>}</div>}
        {!isScanning && !ready && page !== 'archive' && <div className="mw-onboarding">
          <div className="mw-intro"><span className="mw-eyebrow mw-accent">WELCOME TO THE COLLECTION</span><h1>A museum above.<br/><em>A research lab below.</em></h1><p>Open an original MK1, MK2 or MK3 directory to explore assets and the recovered structure behind them.</p></div>
          <DirectoryPicker onSelectDirectory={handleSelectDirectory} isLoading={isScanning}/>
          <button className="mw-text-button mw-browse-offline" onClick={() => navigate('archive')}><BookOpen size={16}/> Browse research history without a game directory <ArrowRight size={15}/></button>
        </div>}
        {ready && <>
          {page === 'overview' && <MuseumOverview source={source!} inventory={inventory!} detection={detection!} goTo={navigate}/>}
          {page === 'stages' && <MuseumStages inventory={inventory!} detection={detection!} source={source!} goTo={navigate} onSelectResource={file => {navigate('assets');setResourceSearch(file);}} stageBindings={stageBindings} galleryAssets={galleryAssets}/>}
          <div hidden={page !== 'assets'}><div className="mw-page mw-assets-page"><div className="mw-intro"><span className="mw-eyebrow mw-accent">MUSEUM / COLLECTIONS</span><h1>Asset library</h1><p>Decode, inspect, compare and export. Original source files are always read locally.</p></div>{detection!.game !== 'unknown' ? <AssetBrowser key={activeSessionId} source={source!} game={detection!.game} initialSearch={resourceSearch} navigationRevision={assetNavRevision} initialCollection={known?.collection ?? (known?.assets.length ? {game:known.game, assets:known.assets, packages:[],reports:{mode:'O194_PARTIAL_COMPILED'},limitations:['Partial trusted source frames; deep catalogue did not complete.']} : null)} onCollectionLoaded={collection => { if (activeSessionSerial.current !== activeSessionId) return; setStageBindings(collection.game === 'mk1' ? (collection.reports.stageHeaderBindings ?? null) : null); setGalleryAssets(collection.assets); }}/> : <div className="mw-empty"><strong>Unrecognized game source</strong><p>Inventory inspection is available, but the MK1/MK2/MK3 asset decoder cannot be applied to an unknown game.</p></div>}</div></div>
          {page === 'compiler' && detection!.game !== 'unknown' && <O194Workbench source={source!} game={detection!.game as Game} known={known} onKnown={setKnown} experiment={experiment} onExperiment={setExperiment}/>}
          {page === 'laboratory' && <Laboratory key={`${source!.directoryName}:${detection!.game}`} source={source!} detection={detection!} inventory={inventory!}/>}
          {page === 'inventory' && <div className="mw-page"><div className="mw-intro"><span className="mw-eyebrow mw-lab-accent">LABORATORY / INVENTORY</span><h1>File inventory</h1><p>Original directory evidence, detection confidence and complete discovered file listing.</p></div><DetectionSummary directoryName={source!.directoryName} totalFiles={inventory!.length} totalSize={inventory!.reduce((sum, f) => sum + f.size, 0)} detection={detection!} onExportJson={exportInventory} onSelectDifferentDirectory={requestSwitch}/><InventoryView inventory={inventory!}/></div>}
        </>}
        {!isScanning && page === 'archive' && <ResearchArchive/>}
        {switcherOpen && ready && <div className="mw-switcher-backdrop">
          <section role="dialog" aria-modal="true" aria-label="Change game installation" className="mw-switcher-panel">
            <h2>Change game installation</h2>
            <p>Current source: <strong>{source!.directoryName}</strong>. Your existing preview, export queue and evidence remain available if you cancel or the replacement cannot be read. A successful replacement starts a clean game session.</p>
            {error && <p role="alert" className="mw-error-bar">{error}</p>}
            {isScanning && <p role="status">Validating replacement installation… {scanProgress ? `${scanProgress.scanned} / ${scanProgress.total} files` : ''}</p>}
            {!isScanning && <DirectoryPicker onSelectDirectory={handleSelectDirectory} />}
            <button type="button" className="mw-switcher-cancel" onClick={cancelSwitch}>Cancel change</button>
          </section>
        </div>}
        <footer className="mw-footer"><span>MK DOS Archive · {APP_MILESTONE}</span><span>Original files remain on your machine · Research confidence preserved</span></footer>
      </main>
    </div>
  </div></ResearchErrorBoundary>;
}
