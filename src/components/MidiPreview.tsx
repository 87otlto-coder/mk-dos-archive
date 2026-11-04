import React, { useEffect, useRef, useState } from 'react';
import { Asset } from '../core/assets/model';

interface Synth {
  connect(destination: AudioNode): void;
  destroy(): void;
  soundBankManager: { addSoundBank(buffer: ArrayBuffer, id: string): Promise<void> };
}
interface SequencerEventHandler {
  addEvent(type: 'songEnded' | 'midiError', id: string, callback: (data: unknown) => void): void;
  removeEvent(type: 'songEnded' | 'midiError', id: string): void;
}
interface Sequencer {
  loopCount: number;
  currentTime: number;
  eventHandler?: SequencerEventHandler;
  loadNewSongList(songs: { binary: ArrayBuffer }[]): void;
  play(): void;
  pause(): void;
}
interface Library {
  WorkletSynthesizer: new (context: AudioContext) => Synth;
  Sequencer: new (synth: Synth) => Sequencer;
}
interface Engine {
  context: AudioContext;
  synth: Synth;
  seq: Sequencer;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function disposeEngine(engine: Engine | null) {
  if (!engine) return;
  try { engine.seq.pause(); } catch { /* already stopped */ }
  try { engine.synth.destroy(); } catch { /* already destroyed */ }
  void engine.context.close().catch(() => undefined);
}

export function MidiPreview({ asset }: { asset: Asset | null }) {
  const engine = useRef<Engine | null>(null);
  const mounted = useRef(true);
  const [bank, setBank] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const old = engine.current;
      engine.current = null;
      disposeEngine(old);
    };
  }, []);

  useEffect(() => {
    engine.current?.seq.pause();
    setPlaying(false);
  }, [asset?.id]);

  function attachEvents(seq: Sequencer) {
    seq.eventHandler?.addEvent('songEnded', 'mkdos-ui-ended', () => {
      if (mounted.current) setPlaying(false);
    });
    seq.eventHandler?.addEvent('midiError', 'mkdos-ui-error', data => {
      if (mounted.current) {
        setPlaying(false);
        setError(`MIDI playback error: ${message(data)}`);
      }
    });
  }

  async function createEngine(soundbank: ArrayBuffer): Promise<Engine> {
    const path = '/vendor/midi.js';
    const lib = await import(/* @vite-ignore */ path) as Library;
    const context = new AudioContext();
    let synth: Synth | null = null;
    try {
      await context.audioWorklet.addModule('/vendor/spessasynth_processor.min.js');
      synth = new lib.WorkletSynthesizer(context);
      synth.connect(context.destination);
      const seq = new lib.Sequencer(synth);
      seq.loopCount = 0;
      attachEvents(seq);
      await synth.soundBankManager.addSoundBank(soundbank, 'user');
      return { context, synth, seq };
    } catch (e) {
      if (synth) {
        try { synth.destroy(); } catch { /* initialization already failed */ }
      }
      await context.close().catch(() => undefined);
      throw e;
    }
  }

  async function load(file: File) {
    setBusy(true);
    setError('');
    try {
      if (!file.size) throw new Error('Soundbank is empty');
      if (file.size > 256 * 1024 * 1024) throw new Error('Soundbank exceeds 256 MiB');
      const bytes = await file.arrayBuffer();
      if (!mounted.current) return;

      // Build and validate a fresh engine first. Only replace the working engine after
      // the new bank has loaded successfully, so a failed replacement is non-destructive.
      const candidate = await createEngine(bytes);
      if (!mounted.current) {
        disposeEngine(candidate);
        return;
      }
      const previous = engine.current;
      engine.current = candidate;
      disposeEngine(previous);
      setBank(file.name);
      setPlaying(false);
    } catch (e) {
      if (mounted.current) setError(message(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function play() {
    try {
      setError('');
      const current = engine.current;
      if (!current || !asset?.bytes || asset.kind !== 'sequence') {
        throw new Error('Select a MIDI asset and load a soundbank first');
      }
      await current.context.resume();
      current.seq.pause();
      current.seq.loadNewSongList([{ binary: asset.bytes.slice().buffer }]);
      current.seq.play();
      setPlaying(true);
    } catch (e) {
      setPlaying(false);
      setError(message(e));
    }
  }

  function stop() {
    engine.current?.seq.pause();
    setPlaying(false);
  }

  return <section className="asset-export">
    <h3>MIDI preview</h3>
    <p>Select a MIDI asset, then choose a local SF2, SF3 or DLS soundbank. Files stay on this computer. The bank controls instrument sound; this is a modern synthesis preview.</p>
    <div className="asset-toolbar">
      <label>Soundbank <input
        type="file"
        accept=".sf2,.sf3,.dls"
        disabled={busy}
        onChange={e => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          input.value = '';
          if (file) void load(file);
        }}
      /></label>
      <span>{busy ? 'Loading soundbank…' : bank || 'No bank loaded'}</span>
      <button disabled={!bank || busy || asset?.kind !== 'sequence'} onClick={play}>Play selected MIDI</button>
      <button disabled={!playing} onClick={stop}>Stop</button>
    </div>
    <p>{asset?.kind === 'sequence' ? asset.name : 'Select a sequence asset in the browser.'}</p>
    {error && <p role="alert" className="asset-error">{error}</p>}
  </section>;
}
