import type { MK1AudioAssetManifestV1 } from '../../games/mk1/research/browserAudioExportBundle';
import { Asset, safeName } from './model';

type WavEvidence = MK1AudioAssetManifestV1['assets'][number];

// Called only after O64 has validated the package against the installation and O63.
export function mk1AudioAsset(path: string, bytes: Uint8Array, row?: WavEvidence): Asset {
  if (!row || row.packagePath !== path || path !== 'audio/wav/' + row.sourcePath || bytes.length !== row.byteLength) {
    throw new Error('MK1 WAV does not match its O64 evidence entry: ' + path);
  }
  return {
    id: path, name: row.fileName, group: 'MK1 audio', kind: 'audio', format: 'WAV',
    confidence: 'Validated PCM export',
    source: { path: row.sourcePath, offset: 0, length: row.byteLength, sha256: row.sha256 },
    metadata: {
      provenance: 'O63 executable sound table and O64 byte-exact installation WAV',
      packagePath: path, soundCode: row.soundCode, soundCodeHex: row.soundCodeHex,
      tableBinding: row.tableBinding, playbackPolicy: row.playbackPolicy, semanticNameStatus: row.semanticNameStatus,
      sampleRate: row.sampleRate, channels: row.channels, bitsPerSample: row.bitsPerSample,
      dataByteLength: row.dataByteLength,
    },
    bytes, mime: 'audio/wav', filename: safeName(path),
  };
}
