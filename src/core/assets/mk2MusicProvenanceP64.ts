/**
 * P64: display/export provenance for original MK2 Sound Images Gen2 scores.
 * This is a metadata-only adapter around the existing driver-derived decoder.
 * 0x98 marks a native repeat boundary, NOT a measured runtime loop duration.
 */
import { Asset, hash } from './model';
import { decodeMK2Music, writeMidi } from './mk2Music';

export interface MK2MusicP64Result {
  assets: Asset[];
  report: Record<string, unknown>;
}

export async function buildMK2MusicAssetsP64(
  sourcePath: string, name: string, original: Uint8Array,
): Promise<MK2MusicP64Result> {
  if (!sourcePath || !name || !/\.mid$/i.test(name) ||
      sourcePath.split(/[\\/]/).at(-1)?.toLowerCase() !== name.toLowerCase())
    throw new Error('P64 music source path and filename must identify the same original MID file');
  if (!(original instanceof Uint8Array) || original.length === 0)
    throw new Error('P64 original score must contain source bytes');

  const sourceSha256 = await hash(original);
  const source = {path:sourcePath,offset:0,length:original.length,sha256:sourceSha256};
  const raw: Asset = {
    id:`raw:${sourcePath}`,name:name+' (original)',group:'Original music sequences',
    kind:'raw',format:'Sound Images Gen2',confidence:'Original bytes',source,
    metadata:{originalSourceSHA256:sourceSha256,originalSourceByteRange:[0,original.length],
      originalFormat:'Sound Images Gen2',p64Role:'Original input bytes; not MIDI',
      originalScoreDecodeStatus:'PENDING'},
    bytes:original,filename:name+'.soundimages.bin',
  };

  try {
    const sequence = decodeMK2Music(original);
    const midiBytes = writeMidi(sequence);
    const midiSha256 = await hash(midiBytes);
    const tracks = sequence.tracks.map(t => {
      if (!Number.isSafeInteger(t.start) || !Number.isSafeInteger(t.end) ||
          t.start < 0 || t.end <= t.start || t.end > original.length)
        throw new Error('P64 original track byte interval invalid');
      const terminalOpcode = original[t.end-1];
      if (terminalOpcode !== (t.looped ? 0x98 : 0x91))
        throw new Error('P64 original track terminal opcode does not match the decoded sequence');
      if (t.looped && (t.loopOffset === null || t.loopOffset < t.start ||
          t.loopOffset >= t.end))
        throw new Error('P64 native 0x98 loop cursor outside original track');
      if (!t.looped && t.loopOffset !== null)
        throw new Error('P64 nonlooping track must not have an active loop cursor');
      return {
        track:t.track,sourceStart:t.start,sourceEnd:t.end,
        terminalOpcode:`0x${terminalOpcode.toString(16)}`,
        terminalSourceOffset:t.end-1,nativeRepeatBoundary:t.looped,
        savedRepeatCursorOffset:t.looped?t.loopOffset:null,
        oneTraversalEndTick:t.ticks,
        nativeRepeatPeriodTicksVerified:false,
        runtimeRepeatCountVerified:false,
      };
    });
    const repeatBoundaries = tracks.filter(t=>t.nativeRepeatBoundary).length;
    const stopBoundaries = tracks.length-repeatBoundaries;
    const provenance = {
      format:'mk2_p64_source_score_provenance_v1',
      sourcePath,sourceSha256,sourceByteRange:[0,original.length],
      originalTrackCount:tracks.length,initialTicksPerQuarterNote:sequence.ppqn,
      initialBpm:sequence.bpm,nativeRepeatBoundaries:repeatBoundaries,
      nativeStopBoundaries:stopBoundaries,sourceTrackBoundaries:tracks,
      exportedMidiSha256:midiSha256,exportedMidiBytes:midiBytes.length,
      exportTraversal:'ONE_PASS',runtimeLoopDurationVerified:false,
      runtimeTempoSchedulingVerified:false,nativeInstrumentTimbreVerified:false,
      sourceSemantics:'Driver-derived 0x91 stop and 0x98 repeat cursor; source offsets preserved',
    };
    raw.metadata.originalScoreDecodeStatus='VERIFIED';
    raw.metadata.p64ScoreProvenance=provenance;
    const midi: Asset = {
      id:`midi:${sourcePath}`,name,group:'MK2 MIDI music',kind:'sequence',
      format:'MIDI',confidence:'Driver-derived MIDI events; one traversal, loops in metadata',
      source,metadata:{...sequence,p64ScoreProvenance:provenance},
      bytes:midiBytes,filename:name,mime:'audio/midi',
    };
    return {assets:[raw,midi],report:{path:sourcePath,status:'VERIFIED',...sequence,
      p64ScoreProvenance:provenance}};
  } catch (error) {
    const reason=error instanceof Error?error.message:String(error);
    raw.metadata.originalScoreDecodeStatus='UNAVAILABLE';
    raw.metadata.originalScoreDecodeError=reason;
    return {assets:[raw],report:{path:sourcePath,status:'UNAVAILABLE',
      sourceSha256,sourceByteRange:[0,original.length],error:reason}};
  }
}
