import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {decodeMK2NativeIndexedRows} from '../../src/core/assets/mk2NativeIndexedRows.ts';

const [original, output] = process.argv.slice(2);
if (!original || !output) throw new Error('Usage: extract-forest-cameos.mts ORIGINAL_DIR OUTPUT_DIR');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const exe = readFileSync(join(original, 'mk2.exe'));
const gra = readFileSync(join(original, 'forest.gra'));
if (sha256(exe) !== 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    || sha256(gra) !== '8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9') {
    throw new Error('Unqualified original MK2 DOS files');
}
mkdirSync(output, {recursive: true});
for (const [name, offset, expectedEnd] of [['jade', 0x16f6c, 195696], ['smoke', 0x16f7c, 198116]]) {
    const at = 0xa0c54 + offset;
    const packed = exe.readUInt32LE(at + 8);
    if ((packed >>> 24) !== 27 || exe.readUInt32LE(at + 12) !== 0x276d0) {
        throw new Error('Unexpected Forest cameo resource or palette');
    }
    const decoded = decodeMK2NativeIndexedRows(gra, packed & 0xffffff,
        exe.readUInt16LE(at), exe.readUInt16LE(at + 2));
    if (decoded.end !== expectedEnd) throw new Error('Unexpected Forest cameo stream extent');
    writeFileSync(join(output, name + '-indices.bin'), decoded.indices);
    writeFileSync(join(output, name + '-opacity.bin'), decoded.mask);
}
