#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mkdos-source-roots-'));
const out = path.join(tmp, 'out');
const types = path.join(tmp, 'types');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(types, { recursive: true });
const shim = path.join(tmp, 'shim.d.ts');
fs.writeFileSync(shim, 'declare const process: any;\n');
execFileSync('tsc', [
  '--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck',
  '--lib','ES2022,DOM','--typeRoots',types,'--outDir',out,shim,
  'src/core/filesystem/DirectorySource.ts',
  'src/core/diagnostics/diagnosticLogger.ts',
  'src/core/filesystem/BrowserDirectorySource.ts',
  'src/core/filesystem/ZipDirectorySource.ts',
], { cwd: root, stdio: 'inherit' });

const { FileListDirectorySource } = require(path.join(out, 'core', 'filesystem', 'BrowserDirectorySource.js'));
const { ZipDirectorySource } = require(path.join(out, 'core', 'filesystem', 'ZipDirectorySource.js'));

function crc32(bytes) {
  let c = 0xffffffff;
  for (const x of bytes) {
    c ^= x;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function u16(n) { const b=Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32(n) { const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0); return b; }
function buildStoredZip(files) {
  const locals=[]; const centrals=[]; let offset=0;
  for (const [name,dataInput] of files) {
    const nameBytes=Buffer.from(name,'utf8'); const data=Buffer.from(dataInput); const crc=crc32(data);
    const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data]);
    locals.push(local);
    const central=Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes]);
    centrals.push(central); offset += local.length;
  }
  const cd=Buffer.concat(centrals); const body=Buffer.concat(locals);
  const eocd=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cd.length),u32(body.length),u16(0)]);
  return new Uint8Array(Buffer.concat([body,cd,eocd]));
}
function paths(entries) { return entries.map(e=>e.path).sort(); }
function expectEqual(actual, expected, label) {
  if (JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error(`${label}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
(async()=>{
  const expected=['GRAPHICS/KANO.GRA','MK1.EXE'];
  const exe=Uint8Array.from([0x4d,0x5a,0x90,0]); const gra=Uint8Array.from([1,2,3,4]);
  const rootZip=new ZipDirectorySource('root.zip',buildStoredZip([['MK1.EXE',exe],['GRAPHICS/KANO.GRA',gra]]));
  const wrapperZip=new ZipDirectorySource('wrapper.zip',buildStoredZip([['MK1/MK1.EXE',exe],['MK1/GRAPHICS/KANO.GRA',gra]]));
  expectEqual(paths(await rootZip.listRecursive()),expected,'root ZIP');
  expectEqual(paths(await wrapperZip.listRecursive()),expected,'wrapper ZIP');
  expectEqual(Array.from(await wrapperZip.readSlice('MK1.EXE',0,2)),[0x4d,0x5a],'wrapper ZIP read');

  const fileA=new File([exe],'MK1.EXE'); Object.defineProperty(fileA,'webkitRelativePath',{value:'MK1/MK1.EXE'});
  const fileB=new File([gra],'KANO.GRA'); Object.defineProperty(fileB,'webkitRelativePath',{value:'MK1/GRAPHICS/KANO.GRA'});
  const folder=new FileListDirectorySource([fileA,fileB]);
  if(folder.directoryName!=='MK1') throw new Error(`folder root detection: ${folder.directoryName}`);
  expectEqual(paths(await folder.listRecursive()),expected,'webkitdirectory');
  expectEqual(Array.from(await folder.readSlice('MK1.EXE',0,2)),[0x4d,0x5a],'webkitdirectory read');
  console.log(JSON.stringify({status:'PASS',normalizedPaths:expected,cases:['root ZIP','wrapper-folder ZIP','webkitdirectory'],directoryName:folder.directoryName},null,2));
})().catch(error=>{console.error(error);process.exit(1);});
