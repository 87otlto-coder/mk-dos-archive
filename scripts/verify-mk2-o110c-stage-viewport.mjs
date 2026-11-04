#!/usr/bin/env node
/* Independent verifier: does not import Python producer; independently models x86 DWORD ADD and 16.16 recurrence. */
import fs from 'node:fs';import crypto from 'node:crypto';import cp from 'node:child_process';import path from 'node:path';
const [exePath,gamePath,archivePath]=process.argv.slice(2);
function fail(s){throw Error('FAILED '+s)};let checks=0;
function yes(condition,msg){checks++;if(!condition)fail(msg)}
function sha(b){return crypto.createHash('sha256').update(b).digest('hex')}
const exe=fs.readFileSync(exePath),rows=[['TOMB',0,63776,28],['BATTLE',1,59436,34],['TOWER',2,56268,30],['FOREST',3,198116,27],['ARMORY',4,126336,26],['PORTAL',6,56916,25],['ARENA',7,90488,31]];
const listing=cp.execFileSync('unzip',['-Z1',archivePath],{encoding:'utf8'}).trim().split('\n');const zipset=new Set(listing);function get(n){yes(zipset.has(n),'missing '+n);return cp.execFileSync('unzip',['-p',archivePath,n],{maxBuffer:2000000})}
const manifest=JSON.parse(get('MANIFEST.json').toString());yes(manifest.format==='mk2_o110c_packed_floor_normalized_viewports_v1','schema');yes(manifest.exeSHA256===sha(exe),'exe sha');yes(rows.length===manifest.rows.length,'row records');
function bytesAt(off,expected){yes(exe.subarray(off,off+expected.length/2).toString('hex')===expected,'opcode '+off.toString(16))}
bytesAt(0x9e138,'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fba373740700');
bytesAt(0x9e16a,'03348554ef0200');bytesAt(0x9e18b,'b80100000055e83078fcff5d');
bytesAt(0x659e7,'0fb7e88a04c5065b07004825ff0000008b1485841000008b3cbde4570300');
bytesAt(0x65a0f,'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5');
// Three-stage provenance: control walker -> row guard -> packed-resource pixel loop.
function callTo(src,dst){yes(exe[src]===0xe8&&src+5+exe.readInt32LE(src+1)===dst,'call provenance '+src.toString(16))}
callTo(0x93585,0x9e118);callTo(0x9e191,0x659c6);
bytesAt(0x9e118,'f705d4620500010000007473');bytesAt(0x9e173,'81ffc8000000731c');
// Palette allocations/relocations use the same per-handle 8-byte record (+6 = base byte).
bytesAt(0x7b453,'ba01000000');bytesAt(0x7b464,'8a14dd065b0700');bytesAt(0x7b4b1,'8814dd065b0700');
bytesAt(0x659c9,'8bdec1eb188d2cdd00000000c1e3048b9c2b34f40200');
for(let i=0;i<256;i++)yes(exe.readUInt32LE(0xa0c54+0x1084+i*4)===(i*0x01010101)>>>0,'LUT '+i);
let bytesCount=0, outputChecks=0, carryDiffer=[];
for(let k=0;k<rows.length;k++){
 const [name,slot,start,resid]=rows[k],source=fs.readFileSync(path.join(gamePath,name.toLowerCase()+'.gra')),r=manifest.rows[k];
 yes(r.resource===name+'.GRA'&&r.slot===slot&&r.packedOffset===start,'identity '+name);
 yes(exe.readUInt32LE(0xcfbac+4*slot)===(((resid<<24)>>>0)|start),'packed ref '+name);
 const raw=source.subarray(start);yes(r.sourceBytes===raw.length&&raw.length%896===0&&r.rows===raw.length/896,'row length '+name);yes(sha(raw)===r.sourceSHA256,'source hash '+name);
 const min=Math.min(...new Set(raw)),max=Math.max(...new Set(raw));yes(r.rawMinimum===min&&r.rawMaximum===max&&r.uniqueSourceValues===new Set(raw).size,'sample range '+name);
 const copied=get(name+'_source_index_896x'+r.rows+'.idx8');yes(copied.equals(raw),'raw byte identity '+name);
 yes(r.cases.length===4,'case count '+name);
 for(const c of r.cases){
   const camera=c.x,bank=c.hypotheticalBankStart,w=320,H=c.height;
   yes([176,288,400].includes(camera)&&[1,193].includes(bank),'scenario '+name);
   yes(H===(camera===288?r.rows:Math.min(16,r.rows)),'rendered height '+name);
   // independent signed integer math. These controlled x values divide 112 exactly.
   const increment=BigInt((288-camera)*65536/112);let accum=0n,shiftRows=0n;let cursor=BigInt(camera);const expected=Buffer.alloc(320*H);
   const perByte=Buffer.alloc(320*H);
   for(let row=0;row<H;row++){
     const base=Number(cursor);yes(base>=row*896&&base+320<=(row+1)*896,'source coordinate within row '+name+'/'+camera+'/'+row);
     for(let k=0;k<80;k++){
       const w0=raw.readUInt32LE(base+k*4);
       const shift=(bank-1)*0x01010101;
       const word=(w0+shift)>>>0;
       expected.writeUInt32LE(word,row*320+k*4);
       for(let q=0;q<4;q++){
         const b=raw[base+k*4+q];
         perByte[row*320+k*4+q]=(b+bank-1)&255;
       }
     }
     accum=BigInt.asIntN(32,accum+increment);
     cursor+=896n-(accum>>16n);
   }
   yes(Number(increment)===c.slope16_16,'slope '+name+'/'+camera);
   const stored=get(c.outputFile);
   yes(stored.equals(expected),'pixel vector '+name+'/'+camera+'/'+bank);
   yes(sha(stored)===c.indexSHA256,'pixel hash '+name+'/'+camera+'/'+bank);
   yes(c.indexRange[0]===Math.min(...new Set(stored))&&c.indexRange[1]===Math.max(...new Set(stored)),'index ranges '+name+'/'+camera+'/'+bank);
   // Differential trap: a naïve per-pixel modulo addition is NOT x86 DWORD ADD at high palette bases.
   const actualDiff=!perByte.equals(expected);carryDiffer.push({name,camera,bank,actualDiff,bytesDifferent:expected.reduce((n,b,i)=>n+(b!==perByte[i]),0)});
   yes(actualDiff===c.uniformByteShiftWouldDiffer,'DWORD carry contrast '+name+'/'+camera+'/'+bank);
   yes(sha(get(c.outputFile.replace('.idx8','_diagnostic_gray.png')))===c.diagnosticPNGSHA256,'PNG digest '+name+'/'+camera+'/'+bank);
   bytesCount+=expected.length;outputChecks+=H*320;
   for(let i=0;i<expected.length;i++)yes(stored[i]===expected[i],'byte '+name+'/'+camera+'/'+bank+'/'+i);
 }
}
const native=cp.execFileSync('unzip',['-t',archivePath],{encoding:'utf8'});yes(native.includes('No errors detected'),'archive integrity');
console.log(JSON.stringify({verdict:'PASS',checks,bytesCount,sourceRows:320,totalScenarios:28,carryDiffer:carryDiffer.filter(x=>x.actualDiff),zipSHA256:sha(fs.readFileSync(archivePath))},null,2));
