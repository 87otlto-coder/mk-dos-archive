const fs = require('node:fs'), path = require('node:path');
require('./local-runtime.cjs');
const { parseMfil } = require('../src/games/mk3/container.ts');
const { decodeIff } = require('../src/core/assets/iff.ts');
const { parseWave } = require('../src/core/assets/wave.ts');
const root = process.argv[2]; if (!root) throw new Error('Usage: node scripts/probe-mk3.cjs <mk3-dir>');
const result = { containers: [], images: [], wave: [], errors: [] };
for (const name of fs.readdirSync(root)) {
  if (name.endsWith('.FTR')) { try {
    const b = new Uint8Array(fs.readFileSync(path.join(root,name))), chunks = parseMfil(b);
    result.containers.push({name, chunks:chunks.length, tags:[...new Set(chunks.map(x=>x.tag))], checksumAndDirectoryValid:true});
    for (const c of chunks.filter(x=>['SPEC','CLAS'].includes(x.tag))) { let p=0,count=0; while(p<c.bytes.length) {
      const n=new DataView(c.bytes.buffer,c.bytes.byteOffset+p+4,4).getUint32(0,true)+8;
      parseWave(c.bytes.subarray(p,p+n));p+=n+(n&1);count++;
    }result.wave.push({name,chunk:c.name,count,exactTiling:p===c.bytes.length}); }
  } catch(e) {result.errors.push({name,error:e.message});} }
}
const b=new Uint8Array(fs.readFileSync(path.join(root,'DATA.MK3'))),v=new DataView(b.buffer);let p=0;
while(p<b.length-12){if(Buffer.from(b.subarray(p,p+4)).toString()!=='FORM'){p++;continue;}const n=v.getUint32(p+4)+8;
 try{const image=decodeIff(b.subarray(p,p+n));result.images.push({offset:p,size:n,width:image.width,height:image.height,type:image.type,masking:image.masking,compression:image.compression});p+=n;}
 catch(e){result.errors.push({name:'DATA.MK3',offset:p,error:e.message});p+=4;}
}
fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/mk3-probe.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({containers:result.containers.length,images:result.images.length,wave:result.wave.reduce((a,b)=>a+b.count,0),errors:result.errors.slice(0,15),errorCount:result.errors.length},null,2));
