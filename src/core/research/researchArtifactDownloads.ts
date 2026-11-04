export interface ResearchArtifact {
  filename: string;
  pass: string;
  status: string;
  timestamp: string;
  data: unknown;
}

export function downloadResearchArtifact(artifact: ResearchArtifact): void {
  const blob = new Blob([JSON.stringify(artifact.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = artifact.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
}
function u32(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
}
function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let cursor = 0;
  for (const part of parts) { out.set(part, cursor); cursor += part.length; }
  return out;
}

/** Minimal STORE-only ZIP writer; no compression dependency required. */
export function buildStoredZip(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), name, file.bytes,
    ]);
    localParts.push(local);
    centralParts.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(localOffset), name,
    ]));
    localOffset += local.length;
  }

  const localBlob = concat(localParts);
  const centralBlob = concat(centralParts);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralBlob.length), u32(localBlob.length), u16(0),
  ]);
  return concat([localBlob, centralBlob, end]);
}

export function downloadResearchArtifactsZip(artifacts: ResearchArtifact[], baseName: string): void {
  if (artifacts.length === 0) return;
  const encoder = new TextEncoder();
  const manifest = {
    format: 'mk_dos_archive_research_export_bundle_v1',
    exportedAt: new Date().toISOString(),
    artifacts: artifacts.map((a) => ({ filename: a.filename, pass: a.pass, status: a.status, timestamp: a.timestamp })),
  };
  const files = [
    { name: 'manifest.json', bytes: encoder.encode(JSON.stringify(manifest, null, 2)) },
    ...artifacts.map((a) => ({ name: a.filename, bytes: encoder.encode(JSON.stringify(a.data, null, 2)) })),
  ];
  const zip = buildStoredZip(files);
  const blob = new Blob([zip], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
