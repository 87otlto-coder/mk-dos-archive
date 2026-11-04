import React, { useEffect, useRef, useState } from 'react';
import { Download, Film, Play, Pause, ShieldAlert } from 'lucide-react';
import type { DirectorySource } from '../core/filesystem/DirectorySource';
import { readMK2OriginalEffectFramesO136, type O136EffectTrack } from '../games/mk2/research/stageOriginalEffectFramesO136';

type SupportedStage = 'portal' | 'tomb' | 'tower';

export function MK2StageEffectsPreview({ source, stage }: { source: DirectorySource; stage: SupportedStage }) {
  const [tracks, setTracks] = useState<O136EffectTrack[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(100);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setTracks([]); setPlaying(false); setTrackIndex(0); setFrameIndex(0);
    (async () => {
      if (source.isSynthetic) throw new Error('Original MK2 source files are required for verified frame extraction.');
      const files = await source.listRecursive();
      async function load(name: string): Promise<Uint8Array> {
        const matches = files.filter(file => file.name.toUpperCase() === name);
        if (matches.length !== 1) throw new Error(`Expected exactly one ${name} in the selected installation; found ${matches.length}. Try an untouched original game directory or ZIP.`);
        return source.readSlice(matches[0].path, 0, matches[0].size);
      }
      const exe = await load('MK2.EXE');
      const gra = await load(`${stage.toUpperCase()}.GRA`);
      return readMK2OriginalEffectFramesO136(exe, gra, stage);
    })().then(value => { if (!cancelled) setTracks(value); })
      .catch(reason => { if (!cancelled) { const message = reason instanceof Error ? reason.message : String(reason); setError(message + (/not canonical|not the original|hash|incorrect original|source pointer|writer instruction/i.test(message) ? ' This specialized original-frame decoder requires the verified unmodified MK2 source; other assets remain available in the Asset Library.' : '')); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [source, stage]);

  const activeTrack = tracks[trackIndex];
  const frame = activeTrack?.frames[frameIndex];
  useEffect(() => { setFrameIndex(0); setPlaying(false); }, [trackIndex]);
  useEffect(() => {
    if (!playing || !activeTrack?.frames.length) return;
    const timer = setInterval(() => setFrameIndex(index => (index + 1) % activeTrack.frames.length), Math.max(20, duration));
    return () => clearInterval(timer);
  }, [playing, duration, activeTrack]);
  useEffect(() => {
    if (!frame || !canvas.current) return;
    const target = canvas.current;
    target.width = frame.width; target.height = frame.height;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(frame.rgba), frame.width, frame.height), 0, 0);
  }, [frame]);

  const exportFrame = () => {
    if (!frame || !canvas.current) return;
    const link = document.createElement('a');
    link.href = canvas.current.toDataURL('image/png');
    link.download = `mk2_${stage}_${activeTrack.name}_frame_${frameIndex.toString().padStart(2, '0')}.png`;
    link.click();
  };

  return <section className="mw-effects-preview" aria-label={`${stage} original effect frames`}>
    <div className="mw-effects-heading"><div><span className="mw-eyebrow mw-accent">SOURCE FRAME GALLERY</span><h2>{stage === 'portal' ? 'The Portal' : stage === 'tomb' ? 'Kombat Tomb' : 'The Tower'}</h2><p>Original EXE-linked sprites, decoded on demand from the installation you selected.</p></div><Film size={25}/></div>
    {loading && <p role="status" className="mw-muted">Verifying original source descriptors and decoding effect frames…</p>}
    {error && <div role="alert" className="mw-error">Source validation stopped: {error}. The general asset browser is unaffected.</div>}
    {!!tracks.length && <>
      <div className="mw-effects-controls">
        <label>Sequence <select value={trackIndex} onChange={e => setTrackIndex(Number(e.target.value))}>{tracks.map((track, i) => <option key={`${track.name}-${i}`} value={i}>{track.name} ({track.frames.length} frames)</option>)}</select></label>
        <label>Preview ms/frame <input type="number" min={20} max={2000} value={duration} onChange={e => setDuration(Math.max(20, Math.min(2000, Math.trunc(Number(e.target.value) || 100))))}/></label>
        <button onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={15}/> : <Play size={15}/>} {playing ? 'Pause' : 'Play'}</button>
        <button onClick={exportFrame}><Download size={15}/> PNG</button>
      </div>
      <div className="mw-effects-canvas"><canvas aria-label="Recovered original effect sprite" ref={canvas} style={{ width: frame ? Math.min(frame.width * 5, 400) : 180, maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }}/></div>
      <div className="mw-effects-step"><button onClick={() => setFrameIndex(i => (i + activeTrack.frames.length - 1) % activeTrack.frames.length)}>← Previous</button><span>Frame {frameIndex + 1} / {activeTrack.frames.length} · {frame?.width} × {frame?.height}</span><button onClick={() => setFrameIndex(i => (i + 1) % activeTrack.frames.length)}>Next →</button></div>
      <p className="mw-muted mw-xs"><ShieldAlert size={14}/> The duration control is an adjustable *preview setting*, not proven native gameplay timing. Object positioning and final full-scene composition remain unresolved.{stage === 'tower' ? ' Tower palette is source-linked but not runtime-confirmed.' : ''}</p>
    </>}
  </section>;
}
