import { verified, identify } from './engine.mts';

const GRA_SHA = '0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6';
const OBJ2_IMAGE = 0xa0c54, FIRST_DESCRIPTOR = 0x1c4cc, DESCRIPTOR_STRIDE = 16;
const POINTER_TABLE = 0x1c264, NATIVE_SUFFIX_START = 0x29314, RESOURCE_ID = 37;
const WIDTH = 35, HEIGHT = 41, IMAGE_PIXELS = WIDTH * HEIGHT;

interface IndexedImage {
  ordinal: number; selectedBySourceTable: boolean; width: number; height: number;
  descriptorPhysical: number; graOffset: number; graEnd: number;
  indices: Uint8Array; mask: Uint8Array;
  minIndex: number; maxIndex: number; commandCounts: { skip: number; rle: number; literal: number };
}
function ensure(ok: unknown, reason: string): asserts ok {
  if (!ok) throw Error('P13 original MOUNTAIN.GRA: ' + reason);
}
export function decodeMountain(exe: Uint8Array, gra: Uint8Array): IndexedImage[] {
  const ev = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  const gv = new DataView(gra.buffer, gra.byteOffset, gra.byteLength);
  const u16 = (p: number) => ev.getUint16(p, true);
  const u32 = (p: number) => ev.getUint32(p, true);
  ensure(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1, 0xa13a7)).split('\0')[37] === 'MOUNTAIN.GRA',
    'resource filename pool slot 37');
  for (let slot = 0; slot < 15; slot++) {
    ensure(u32(OBJ2_IMAGE + POINTER_TABLE + slot*4) === FIRST_DESCRIPTOR + DESCRIPTOR_STRIDE*Math.min(slot,13),
      `O96S consumer descriptor slot ${slot}`);
  }
  const images: IndexedImage[] = [];
  let previousEnd = NATIVE_SUFFIX_START;
  for (let i=0;i<15;i++) {
    const descriptorPhysical=OBJ2_IMAGE + FIRST_DESCRIPTOR + DESCRIPTOR_STRIDE*i;
    ensure(descriptorPhysical+16<=exe.length,`descriptor ${i} within EXE`);
    const width=u16(descriptorPhysical),height=u16(descriptorPhysical+2),state=u32(descriptorPhysical+4),
      packed=u32(descriptorPhysical+8),aux=u32(descriptorPhysical+12);
    const graOffset=packed & 0xffffff;
    ensure(width===WIDTH && height===HEIGHT && state===0 && (packed>>>24)===RESOURCE_ID && aux===0x2b52a,
      `original 16-byte descriptor ${i}`);
    ensure(graOffset===previousEnd,`contiguous bounded original stream ${i}`);
    const indices=new Uint8Array(IMAGE_PIXELS), mask=new Uint8Array(IMAGE_PIXELS);
    const counts={skip:0,rle:0,literal:0};let p=graOffset;
    for (let y=0;y<height;y++) {
      let x=0;
      while (x<width) {
        ensure(p+4<=gra.length,`truncated original stream ${i} row ${y}`);
        const cmd=gv.getUint32(p,true);p+=4;
        let count:number;
        if (cmd&1) {count=cmd>>>1;counts.skip++;}
        else if (cmd&2) {
          count=cmd>>>10;
          ensure(count>0&&count<=width-x,`RLE row length ${i}:${y}`);
          indices.fill((cmd>>>2)&255,y*width+x,y*width+x+count);
          mask.fill(1,y*width+x,y*width+x+count);counts.rle++;
        } else {
          count=cmd>>>2;
          ensure(count>0&&count<=64&&count<=width-x&&p+((count+3)&~3)<=gra.length,
            `native literal length ${i}:${y}`);
          indices.set(gra.subarray(p,p+count),y*width+x);
          mask.fill(1,y*width+x,y*width+x+count);
          p+=(count+3)&~3;counts.literal++;
        }
        ensure(count>0&&count<=width-x,`original row extent ${i}:${y}`);
        x+=count;
      }
    }
    ensure(counts.skip===0 && mask.every(x=>x===1),`all 1435 source pixels opaque ${i}`);
    const minIndex=Math.min(...indices),maxIndex=Math.max(...indices);
    images.push({ordinal:i,selectedBySourceTable:i<14,width,height,descriptorPhysical,graOffset,graEnd:p,
      indices,mask,minIndex,maxIndex,commandCounts:counts});
    previousEnd=p;
  }
  ensure(previousEnd===gra.length && gra.length===191748 && previousEnd-NATIVE_SUFFIX_START===23024,
    '15 original streams exactly tile source suffix');
  ensure(Math.max(...images.map(i=>i.maxIndex))===96,'original source index maximum is 96, not 63');
  return images;
}

export async function mountain(root: string) {
  const executable = await identify(root);
  const exe = await verified(root, executable.file, executable.bytes, executable.sha256);
  const name = 'mountain.gra';
  const gra = await verified(root, name, 191748, GRA_SHA);
  return decodeMountain(exe, gra).map(image => ({
    indices: image.indices,
    opacity: image.mask,
    metadata: {
      schema: 1, id: `mk2:mountain:${image.ordinal}`, ordinal: image.ordinal,
      width: image.width, height: image.height, selectedBySourceTable: image.selectedBySourceTable,
      source: { name, sha256: GRA_SHA, bytes: gra.length, executable,
        offset: image.graOffset, endExclusive: image.graEnd,
        descriptorPhysical: image.descriptorPhysical, descriptorBytes: 16, resourceId: RESOURCE_ID },
      compression: 'P13 native little-endian DWORD row commands',
      commandCounts: image.commandCounts, minIndex: image.minIndex, maxIndex: image.maxIndex,
      evidence: 'VERIFIED', decoder: 'P13/O96T', palette: { evidence: 'UNKNOWN' },
      runtimePalette: 'UNKNOWN', runtimeTiming: 'UNKNOWN', sourcePrefix: 'UNKNOWN'
    }
  }));
}
