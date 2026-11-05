import React, { useMemo, useState } from 'react';
import { ArrowRight, Archive, BookOpen, CheckCircle2, ChevronRight, FileArchive, FileCode2, FlaskConical, FolderOpen, Image as ImageIcon, Layers3, Library, Microscope, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { MK2StageEffectsPreview } from './MK2StageEffectsPreview';
import { discoverStageGallery } from './stageGalleryModel';
import type { InventoryEntry } from '../core/models/InventoryEntry';
import type { GameDetectionResult } from '../core/models/GameDetection';
import type { DirectorySource } from '../core/filesystem/DirectorySource';

export type WorkspacePage = 'overview' | 'assets' | 'stages' | 'laboratory' | 'archive' | 'inventory' | 'compiler';
export type WorkspaceZone = 'museum' | 'laboratory';

export const MUSEUM_NAV = [
  { page: 'overview', label: 'Overview', icon: Library },
  { page: 'assets', label: 'Asset library', icon: ImageIcon },
  { page: 'stages', label: 'Stage gallery', icon: Layers3 },
] as const;
export const LAB_NAV = [
  { page: 'laboratory', label: 'Research workbench', icon: Microscope },
  { page: 'compiler', label: 'Compile & hypotheses', icon: FlaskConical },
  { page: 'archive', label: 'Research archive', icon: BookOpen },
  { page: 'inventory', label: 'File inventory', icon: FileCode2 },
] as const;

export function gameTitle(game: GameDetectionResult['game']): string {
  return game === 'mk1' ? 'Mortal Kombat' : game === 'mk2' ? 'Mortal Kombat II' : game === 'mk3' ? 'Mortal Kombat 3' : 'Unrecognized DOS game';
}

function InfoCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: React.ComponentType<{ size?: number }> }) {
  return <article className="mw-metric">
    <span className="mw-metric-icon"><Icon size={18} /></span>
    <span className="mw-eyebrow">{title}</span>
    <strong>{value}</strong>
    <span className="mw-muted mw-xs">{description}</span>
  </article>;
}

export function MuseumOverview({ inventory, detection, source, goTo }: {
  inventory: InventoryEntry[]; detection: GameDetectionResult; source: DirectorySource;
  goTo: (page: WorkspacePage) => void;
}) {
  const graphics = inventory.filter(e => e.extension.toLowerCase() === 'gra').length;
  const audio = inventory.filter(e => ['u8', 'mid', 'wav', 'ogg', 'awe'].includes(e.extension.toLowerCase())).length;
  const game = detection.game;
  return <div className="mw-page">
    <div className="mw-intro">
      <span className="mw-eyebrow mw-accent">THE COLLECTION · {game.toUpperCase()}</span>
      <h1>{gameTitle(game)}</h1>
      <p>Explore the recovered assets and original game structures. Every object remains connected to the source evidence that supports it.</p>
    </div>
    <div className="mw-metric-row">
      <InfoCard title="Indexed files" value={inventory.length.toLocaleString()} description="Current directory" icon={FolderOpen} />
      <InfoCard title="Graphics resources" value={graphics.toLocaleString()} description=".GRA files discovered" icon={ImageIcon} />
      <InfoCard title="Audio candidates" value={audio.toLocaleString()} description="Recognized extensions" icon={Archive} />
    </div>
    <div className="mw-section-heading"><div><span className="mw-eyebrow">START EXPLORING</span><h2>Inside the archive</h2></div></div>
    <div className="mw-feature-grid">
      <button className="mw-feature" onClick={() => goTo('assets')}>
        <span className="mw-feature-symbol"><ImageIcon size={32}/></span>
        <span><strong>Explore assets</strong><small>Browse original resources, indexed sprite previews, sequences and exports where verified.</small></span>
        <ArrowRight size={19}/>
      </button>
      <button className="mw-feature" onClick={() => goTo('stages')}>
        <span className="mw-feature-symbol"><Layers3 size={32}/></span>
        <span><strong>Discover stages</strong><small>Review stage resource coverage and original source-layer research. No fabricated scene composites.</small></span>
        <ArrowRight size={19}/>
      </button>
      <button className="mw-feature" onClick={() => goTo('archive')}>
        <span className="mw-feature-symbol"><BookOpen size={32}/></span>
        <span><strong>Read the findings</strong><small>Search hundreds of original checkpoints, handoffs and research records.</small></span>
        <ArrowRight size={19}/>
      </button>
      <button className="mw-feature" onClick={() => goTo('laboratory')}>
        <span className="mw-feature-symbol"><FlaskConical size={32}/></span>
        <span><strong>Enter the laboratory</strong><small>Launch advanced source decoders, binary inspections and evidence validation on demand.</small></span>
        <ArrowRight size={19}/>
      </button>
    </div>
    <div className="mw-evidence-callout">
      <ShieldCheck size={22}/>
      <div><strong>Source-first research</strong><p>The museum shows recovered evidence and available capabilities, not promises of complete reconstruction. Unverified runtime behavior is identified explicitly.</p></div>
    </div>
    <div className="mw-source-line"><CheckCircle2 size={15}/> Source selected: <strong>{source.directoryName}</strong> · Detection confidence: {detection.confidence}</div>
  </div>;
}

export function MuseumStages({ inventory, detection, source, goTo, onSelectResource }: {
  inventory: InventoryEntry[]; detection: GameDetectionResult; source: DirectorySource; goTo: (page: WorkspacePage) => void;
  onSelectResource: (file: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [stagePreview, setStagePreview] = useState<'portal' | 'tomb' | 'tower' | null>(null);
  const mk2 = detection.game === 'mk2';
  const cards = useMemo(() => discoverStageGallery(inventory, detection.game, search), [inventory, detection.game, search]);
  return <div className="mw-page">
    <div className="mw-intro"><span className="mw-eyebrow mw-accent">MUSEUM / STAGES</span><h1>Stage gallery</h1><p>Browse discovered background resources. Full scene composition is not implied by the presence of a resource file.</p><p className="mw-muted mw-xs">Color panels below are navigation markers, not source-image reconstructions.</p></div>
    <div className="mw-toolbar"><label className="mw-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stage names or resources" aria-label="Search stages"/></label><span className="mw-muted">{cards.length} matching resources</span></div>
    {detection.game === 'mk1' && <div className="mw-research-banner">
      <Layers3 size={21}/><div><strong>Decoded MK1 backgrounds</strong><p>The full MK1 scan groups normalized previews by module. The cards below identify source headers.</p></div>
      <button onClick={() => onSelectResource('normalized_combined_background')}>Browse normalized previews <ChevronRight size={15}/></button>
    </div>}
    {cards.length ? <div className="mw-stage-grid">
      {cards.map((stage, index) => <article className="mw-stage-card" key={stage.file}>
        <div className={`mw-stage-visual mw-stage-color-${index % 5}`} aria-hidden="true"><Layers3 size={38}/><span>{stage.file}</span></div>
        <div className="mw-stage-body">
          <div className="mw-stage-identity"><strong>{stage.name}</strong><span className="mw-subtle-chip">Source present</span></div>
          <p>{stage.note}</p>
          {stage.effectFrames !== null ? <div className="mw-stage-detail"><span>{stage.effectFrames} original effect frames</span><span>{stage.tracks} sequences</span></div> : <div className="mw-stage-detail mw-muted">Independent scene assembly not verified</div>}
          <div className="mw-stage-actions"><button className="mw-text-button" onClick={() => onSelectResource(stage.file)}>Browse resource <ChevronRight size={15}/></button>
            {mk2 && (stage.file === 'PORTAL.GRA' || stage.file === 'TOMB.GRA' || stage.file === 'TOWER.GRA') && <button className="mw-text-button" onClick={() => setStagePreview(stage.file.replace('.GRA', '').toLowerCase() as 'portal' | 'tomb' | 'tower')}>Original frames <ChevronRight size={15}/></button>}</div>
        </div>
      </article>)}
    </div> : <div className="mw-empty"><FileArchive size={25}/><strong>No matching supported stage resources in this installation.</strong><p>Try clearing the filter. MK1 background candidates are listed by their source HDRS.GRA identities; names are not yet mapped to arcade-stage names.</p><button onClick={() => goTo('assets')}>Open asset library</button></div>}
    {stagePreview && <MK2StageEffectsPreview key={stagePreview} source={source} stage={stagePreview}/>}
    {mk2 && <div className="mw-research-banner">
      <Sparkles size={21}/><div><strong>Original source-layer viewer</strong><p>For Portal and Tomb, the existing laboratory can decode original setup-local layers, 896-pixel-wide floor data and original effect sequences. Tower effects are available with a qualified source-linked palette.</p></div>
      <button onClick={() => goTo('laboratory')}>Open workbench <ArrowRight size={15}/></button>
    </div>}
  </div>;
}
