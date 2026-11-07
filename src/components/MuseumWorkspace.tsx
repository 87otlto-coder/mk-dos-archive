import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Archive, BookOpen, CheckCircle2, ChevronRight, FileArchive, FileCode2, FlaskConical, FolderOpen, Image as ImageIcon, Layers3, Library, Microscope, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { MK2StageEffectsPreview } from './MK2StageEffectsPreview';
import { discoverStageGallery, type GalleryStage } from './stageGalleryModel';
import { buildGalleryVisualsP57 } from './stageGalleryVisualsP57';
import { StageThumbnailP57 } from './StageThumbnailP57';
import type { Asset } from '../core/assets/model';
import { exactAssetSearchP55 } from '../core/assets/assetSearchP55';
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


export function MuseumStages({ inventory, detection, source, goTo, onSelectResource, stageBindings, galleryAssets }: {
  inventory: InventoryEntry[]; detection: GameDetectionResult; source: DirectorySource; goTo: (page: WorkspacePage) => void;
  onSelectResource: (file: string) => void; stageBindings: unknown; galleryAssets: Asset[];
}) {
  const [search, setSearch] = useState('');
  const [mk3Page, setMk3Page] = useState(0);
  const [stagePreview, setStagePreview] = useState<'portal' | 'tomb' | 'tower' | null>(null);
  const mk2 = detection.game === 'mk2';
  const visuals = useMemo(() => detection.game === 'unknown'
    ? null : buildGalleryVisualsP57(detection.game, galleryAssets, stageBindings),
    [detection.game, galleryAssets, stageBindings]);
  const originalCards = useMemo(() => discoverStageGallery(inventory, detection.game, search), [inventory, detection.game, search]);
  const mk3Rows = detection.game === 'mk3' ? (visuals?.mk3UnassignedPictures ?? []).filter(v =>
    (`${v.title} ${v.asset.id} DATA.MK3 original IFF`).toLowerCase().includes(search.trim().toLowerCase())) : [];
  useEffect(() => setMk3Page(0), [search, detection.game]);
  const pageSize = 24;
  const visibleMK3 = mk3Rows.slice(mk3Page * pageSize, (mk3Page + 1) * pageSize);
  const cards: GalleryStage[] = detection.game === 'mk3'
    ? visibleMK3.map(v => ({name:v.title,file:v.asset.id,
        note:'Original IFF source image with embedded palette; arcade-stage assignment UNKNOWN',
        effectFrames:null,tracks:null}))
    : originalCards;
  const mk3Visuals = new Map(visibleMK3.map(v => [v.asset.id, v]));
  const count = detection.game === 'mk3' ? mk3Rows.length : cards.length;
  return <div className="mw-page">
    <div className="mw-intro">
      <span className="mw-eyebrow mw-accent">MUSEUM / STAGES</span>
      <h1>Stage gallery</h1>
      <p>Original game artwork and source resources. A decoded layer or picture is not necessarily a reconstructed gameplay scene.</p>
      <p className="mw-muted mw-xs">Images shown here are decoded locally from the selected installation, never stock artwork. Missing source-qualified previews remain visibly unassigned.</p>
    </div>
    <div className="mw-toolbar">
      <label className="mw-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search original resources or source images" aria-label="Search stages"/></label>
      <span className="mw-muted">{count} matching {detection.game === 'mk3' ? 'unassigned source images' : 'resources'}</span>
    </div>
    {detection.game === 'mk1' && <div className="mw-research-banner">
      <Layers3 size={21}/><div><strong>Decoded MK1 background modules</strong>
        <p>Authenticated O27/O54 headers link to normalized source-module previews, not finished gameplay scenes.</p>
        {(visuals?.mk1ByHeader.size ?? 0) === 0 && <p>Open Asset Library and choose Decode &amp; browse to populate source-backed thumbnails.</p>}
      </div>
      <button onClick={() => onSelectResource('normalized_combined_background')}>Browse normalized previews <ChevronRight size={15}/></button>
    </div>}
    {mk2 && galleryAssets.length === 0 && <div className="mw-research-banner">
      <Layers3 size={21}/><div><strong>Original MK2 source layers</strong><p>Decode &amp; browse in the Asset Library to populate source-qualified layer thumbnails. Their palettes and compositing may remain unresolved.</p></div>
      <button onClick={() => goTo('assets')}>Open Asset Library <ChevronRight size={15}/></button>
    </div>}
    {detection.game === 'mk3' && <div className="mw-research-banner">
      <Layers3 size={21}/><div><strong>MK3 original IFF picture archive</strong>
        <p>DATA.MK3 contains embedded-palette images. Their original arcade-stage membership is not established, so this is an unassigned-picture browser, not a reconstructed stage list.</p>
        {galleryAssets.length === 0 && <p>Decode &amp; browse in the Asset Library to load original pictures.</p>}
      </div>
      <button onClick={() => onSelectResource('DATA.MK3')}>Browse all original pictures <ChevronRight size={15}/></button>
    </div>}
    {!!visuals?.errors.length && <div className="mw-source-errors" role="alert">
      <strong>{visuals.errors.length} source thumbnail validation error(s)</strong>
      {visuals.errors.slice(0,6).map((error,i)=><p key={i}>{error}</p>)}
      {visuals.errors.length>6 && <p>Additional invalid image records are withheld from the gallery.</p>}
    </div>}
    {cards.length ? <div className="mw-stage-grid">
      {cards.map((stage, index) => {
        const mk1Links = visuals?.mk1ByHeader.get(stage.file) ?? [];
        const visual = detection.game === 'mk1' ? mk1Links[0]
          : detection.game === 'mk2' ? visuals?.mk2ByResource.get(stage.file)
          : mk3Visuals.get(stage.file);
        return <article className="mw-stage-card" key={stage.file}>
          {visual ? <div className="mw-stage-visual mw-stage-visual-source">
            <StageThumbnailP57 visual={visual}/>
          </div> : <div className={'mw-stage-visual mw-stage-color-' + (index % 5)}>
            <Layers3 size={38}/><span>{stage.file}</span>
            <small>No qualified thumbnail</small>
          </div>}
          <div className="mw-stage-body">
            <div className="mw-stage-identity"><strong>{stage.name}</strong>
              <span className="mw-subtle-chip">{detection.game === 'mk3' ? 'Original IFF' : 'Source present'}</span>
            </div>
            <p>{stage.note}</p>
            {visual && <p className="mw-source-evidence">Preview: {visual.title}. {visual.evidence}</p>}
            {stage.effectFrames !== null
              ? <div className="mw-stage-detail"><span>{stage.effectFrames} original effect frames</span><span>{stage.tracks} sequences</span></div>
              : <div className="mw-stage-detail mw-muted">Full native scene composition not established</div>}
            <div className="mw-stage-actions">
              {mk2 ? <>
                <button className="mw-text-button" onClick={() => onSelectResource(stage.file)}>Browse resource <ChevronRight size={15}/></button>
                {visual && <button className="mw-text-button"
                  onClick={() => onSelectResource(exactAssetSearchP55(visual.asset.id))}>Open source layer <ChevronRight size={15}/></button>}
              </> : detection.game === 'mk1' ? (mk1Links.length
                  ? <div className="mw-stage-preview-links">
                    <span className="mw-muted mw-xs">Verified source-module previews (not gameplay scenes)</span>
                    {mk1Links.map(link => <button key={link.asset.id} className="mw-text-button"
                      onClick={() => onSelectResource(exactAssetSearchP55(link.asset.id))}>
                      Browse {link.title} preview <ChevronRight size={15}/></button>)}
                  </div>
                  : <span className="mw-muted mw-xs">Header identified; qualified decoded preview not available</span>)
                : visual ? <button className="mw-text-button"
                  onClick={() => onSelectResource(exactAssetSearchP55(visual.asset.id))}>Open original IFF picture <ChevronRight size={15}/></button>
                : <span className="mw-muted mw-xs">No qualified decoded picture link</span>}
              {mk2 && (stage.file === 'PORTAL.GRA' || stage.file === 'TOMB.GRA' || stage.file === 'TOWER.GRA') &&
                <button className="mw-text-button" onClick={() => setStagePreview(stage.file.replace('.GRA', '').toLowerCase() as 'portal' | 'tomb' | 'tower')}>Original frames <ChevronRight size={15}/></button>}
            </div>
          </div>
        </article>;
      })}
    </div> : <div className="mw-empty"><FileArchive size={25}/>
      <strong>{detection.game==='mk3' ? 'No qualified unassigned IFF pictures loaded.' : 'No matching supported stage resources in this installation.'}</strong>
      <p>Check the source scan and search filter. Original arcade-stage names and complete compositions are not inferred from unidentified resources.</p>
      <button onClick={() => goTo('assets')}>Open asset library</button>
    </div>}
    {detection.game === 'mk3' && mk3Rows.length > pageSize && <div className="mw-gallery-pagination">
      <button disabled={mk3Page===0} onClick={()=>setMk3Page(p=>Math.max(0,p-1))}>Previous pictures</button>
      <span>{mk3Page*pageSize+1}–{Math.min((mk3Page+1)*pageSize,mk3Rows.length)} of {mk3Rows.length}</span>
      <button disabled={(mk3Page+1)*pageSize>=mk3Rows.length} onClick={()=>setMk3Page(p=>p+1)}>Next pictures</button>
    </div>}
    {stagePreview && <MK2StageEffectsPreview key={stagePreview} source={source} stage={stagePreview}/>}
    {mk2 && <div className="mw-research-banner">
      <Sparkles size={21}/><div><strong>Original source-layer viewer</strong>
        <p>For Portal and Tomb, the laboratory decodes source setup layers, wide floor data and effect sequences. Tower effects have a qualified source-linked palette; final runtime palette selection remains unproven.</p>
      </div>
      <button onClick={() => goTo('laboratory')}>Open workbench <ArrowRight size={15}/></button>
    </div>}
  </div>;
}
