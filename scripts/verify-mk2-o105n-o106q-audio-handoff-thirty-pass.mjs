#!/usr/bin/env node
/** Independently validate O105N..O106Q using native files, not Python producer. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [exePath,fixture,dir]=process.argv.slice(2);if(!dir)throw Error('usage: node verifier exe fixture evidence-dir');
const exe=fs.readFileSync(exePath);const hash=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function requireEvidence(v,m){checks++;if(!v)throw Error('O106Q_REJECT '+m)}
function bytes(offset,hex){requireEvidence(exe.subarray(offset,offset+hex.length/2).toString('hex')===hex,`code ${offset.toString(16)}`)}
requireEvidence(hash(exe)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','exe sha');
for(const [o,h] of [[0x814d8,'e84b000000'],[0x814dd,'ba58370100'],[0x814e4,'b43dcd21'],[0x814ec,'b9ffff0000'],[0x814f1,'a17c1703000fb7501a'],[0x814fa,'c1e2040fb7401803d0'],[0x81505,'b43fcd21'],[0x8150d,'b43ecd21'],[0x81513,'b404b001cd80']])bytes(o,h);
const fmts=[['mid',1,'scc.bin',0x8153c,0x81541],['lap',2,'lap.bin',0x8154a,0x8154f],['gvs',4,'grv.bin',0x81558,0x8155d],['sbl',8,'sbl.bin',0x81566,0x8156b],['awe',16,'awe.bin',0x81574,0x81579]];
const stems=fs.readdirSync(path.join(fixture,'sound')).filter(n=>n.endsWith('.mid')).map(n=>n.slice(0,-4)).sort();requireEvidence(stems.length===33,'song stems');
const info=new Map();for(const s of stems)for(const [ext] of fmts){const v=fs.readFileSync(path.join(fixture,'sound',`${s}.${ext}`));const L=v.readUInt16LE(1);const offs=[];for(let p=L+7;p<v.length;p+=2)offs.push(v.readUInt16LE(p));info.set(`${s}.${ext}`,{v,L,offs});requireEvidence(v[0]===1 && L+7+offs.length*2===v.length,`structure ${s}.${ext}`);}
const passes=[...'NOPQRSTUVWXYZ'].map(c=>'O105'+c).concat([...'ABCDEFGHIJKLMNOPQ'].map(c=>'O106'+c));requireEvidence(passes.length===30,'pass number');
const kinds=['DOS_LOADER_HANDOFF','INDEXED_MARKER_BOUNDARIES','SEGMENT_INTERVAL_INTEGRITY','RAW_COMMAND_CONTEXT_HYPOTHESES','CROSS_HARDWARE_STRUCTURE','NATIVE_DRIVER_SCOPE'];
const ledger=JSON.parse(fs.readFileSync(path.join(dir,'mk2_o106q_audio_handoff_thirty_pass_ledger_2026-10-09.json')));
requireEvidence(ledger.format==='mk2_o105n_o106q_handoff_thirty_pass_v1' && ledger.countOfPasses===30 && ledger.numberOfSourceFiles===165 && ledger.reports.length===30,'ledger identity');
for(const k of ['noMusicEventGrammar','noDriverMusicBinding','noTempoTimingClaims'])requireEvidence(ledger[k]===true,k);
for(let j=0;j<30;j++){
 const [ext,sel,driver,mov,cmp]=fmts[j%5],kind=kinds[Math.floor(j/5)],pid=passes[j];const rec=ledger.reports[j];
 requireEvidence(rec.pass===pid && rec.kind===kind && rec.ext===ext,'ledger pass order '+pid);
 const reportPath=path.join(dir,path.basename(rec.path));const raw=fs.readFileSync(reportPath);const r=JSON.parse(raw);
 requireEvidence(hash(raw)===rec.sha256,'report hash '+pid);
 requireEvidence(r.pass===pid && r.kind===kind && r.extension===ext && r.selector===sel && r.driverCandidate===driver,'pass metadata '+pid);
 requireEvidence(r.exeSha256===hash(exe) && r.fileCount===33 && r.rows.length===33 && r.format==='mk2_o105n_o106q_bounded_audio_pass_v1','report format '+pid);
 for(const key of ['noEventGrammar','noDriverMusicBinding','noTiming'])requireEvidence(r[key]===true,'no overclaim '+pid+'/'+key);
 if(kind==='DOS_LOADER_HANDOFF'){
  const d=r.handoff;
  requireEvidence(d.filenameSelectorImmediateAt===mov && d.filenameSelectorCompareAt===cmp && d.filenameConstructorCallAt===0x814d8 && d.filenameConstructorEntry===0x81528,'entry path '+pid);
  requireEvidence(d.filenameGlobal==='0x30138' && d.dosOpenAt===0x814e4 && d.dosReadAt===0x81505 && d.dosCloseAt===0x8150d,'DOS path '+pid);
  requireEvidence(d.readMax===0xffff && d.int80RequestAt===0x81513 && d.int80RequestAh===4 && d.int80RequestAl===1 && d.bufferStructureGlobal==='0x3177c' && d.bufferSegmentWordOffset===0x1a && d.bufferOffsetWordOffset===0x18 && d.claimedServiceSemantics==='UNPROVEN','request scope '+pid);
  requireEvidence(exe[mov]===0xb8 && exe.subarray(mov+1,mov+5).toString('ascii')==='.'+ext.toUpperCase() && exe.subarray(cmp,cmp+7).toString('hex')==='833d38010300'+sel.toString(16).padStart(2,'0'),'selector bytes '+pid);
 }
 if(kind==='NATIVE_DRIVER_SCOPE'){
  const db=fs.readFileSync(path.join(fixture,driver)),d=r.driverEvidence;
  requireEvidence(d.driverSha256===hash(db) && d.length===db.length && d.first32Hex===db.subarray(0,32).toString('hex'),'driver bytes '+pid);
  requireEvidence(d.sccIsGmiDuplicate===fs.readFileSync(path.join(fixture,'scc.bin')).equals(fs.readFileSync(path.join(fixture,'gmi.bin'))) && d.knownPcmDriverIsNotProofOfMusicBinding===true,'driver limitation '+pid);
 }
 for(let n=0;n<33;n++){
  const s=stems[n],row=r.rows[n],{v,L,offs}=info.get(`${s}.${ext}`);
  requireEvidence(row.stem===s,'stem order '+pid+'/'+s);
  if(kind==='DOS_LOADER_HANDOFF'){
   requireEvidence(row.length===v.length && row.lengthFitsDOSRead===(v.length<=65535) && row.sha256===hash(v),'loader file '+pid+'/'+s);
  }else if(kind==='INDEXED_MARKER_BOUNDARIES'){
   requireEvidence(row.storedLength===L && JSON.stringify(row.offsets)===JSON.stringify(offs) && row.indexAnchors.length===offs.length,'marker indices '+pid+'/'+s);
   for(let i=0;i<offs.length;i++){
    const pos=offs[i],a=row.indexAnchors[i];requireEvidence(a.at===pos && a.precedingOpcodeAt===pos-1 && a.precedingOpcode===v[pos-1] && a.valueAtOffset===v[pos] && a.identifier===v[pos+1],'marker anchor '+pid+'/'+s+'/'+i);
    requireEvidence([0x91,0x98].includes(v[pos-1]) && v[pos]===0 && v[pos+1]>=0x80 && v[pos+1]<=0x89,'indexed marker syntax '+pid+'/'+s+'/'+i);
   }
   const extra=[];for(let p=3;p<L-1;p++)if((v[p]===0x91||v[p]===0x98)&&!offs.includes(p+1))extra.push({at:p,opcode:v[p],nextByte:v[p+1]});
   requireEvidence(JSON.stringify(extra)===JSON.stringify(row.unindexedInteriorMarkers),'unindexed extras '+pid+'/'+s);
   requireEvidence(row.terminalMarkerAt===L-1 && row.terminalMarker===v[L-1] && (v[L-1]===0x91 || v[L-1]===0x98),'terminator '+pid+'/'+s);
  }else if(kind==='SEGMENT_INTERVAL_INTEGRITY'){
   const cuts=[3,...offs.map(x=>x-1),L];requireEvidence(JSON.stringify(row.cuts)===JSON.stringify(cuts) && row.spans.length===cuts.length-1,'cuts '+pid+'/'+s);
   for(let i=0;i<cuts.length-1;i++){const [a,z]=cuts.slice(i,i+2),p=row.spans[i],chunk=v.subarray(a,z);
    requireEvidence(a===p.start && z===p.end && p.size===z-a && p.sha256===hash(chunk) && p.first12===chunk.subarray(0,12).toString('hex'),'segment '+pid+'/'+s+'/'+i);
   }
   requireEvidence(row.storedLength===L && row.totalLength===v.length && row.trailerSha256===hash(v.subarray(L)) && row.completeSha256===hash(v),'partition trailer '+pid+'/'+s);
  }else if(kind==='RAW_COMMAND_CONTEXT_HYPOTHESES'){
   requireEvidence(row.storedLength===L && row.hypothesis==='Raw opcode occurrences are not event-token boundaries','raw scope '+pid+'/'+s);
   for(let i=0;i<4;i++){
    const opcode=[0x90,0x99,0x91,0x98][i];let found=[];for(let p=3;p<L;p++)if(v[p]===opcode)found.push(p);
    const low2=found.filter(p=>p+2<L && v[p+1]<128 && v[p+2]<128).length;
    const t=row.rawByteContext[i];const countHigh=found.filter(p=>p+1<L && v[p+1]>=128).length;
    const countZero=found.filter(p=>p+1<L && v[p+1]===0).length;
    const posbytes=Buffer.concat(found.map(p=>{const z=Buffer.alloc(4);z.writeUInt32LE(p);return z}));
    requireEvidence(t.opcode===opcode && t.rawCount===found.length && t.nextTwoLow7Count===low2 && t.nextTwoLow7FractionNumerator===low2 && t.highFollowingCount===countHigh && t.nextZeroCount===countZero && t.positionSetSha256===hash(posbytes),'raw opcode '+pid+'/'+s+'/'+i);
   }
  }else if(kind==='CROSS_HARDWARE_STRUCTURE'){
   requireEvidence(row.metadataByte===v[L+3] && row.trailerMarker===v[L-1] && row.offsetCount===offs.length && row.peerComparisons.length===4,'variants '+pid+'/'+s);
   let k=0;for(const [other] of fmts)if(other!==ext){const {v:u,L:T,offs:ind}=info.get(`${s}.${other}`),q=row.peerComparisons[k++];
    requireEvidence(q.extension===other && q.sameFullBytes===v.equals(u) && q.sameStoredLength===(L===T) && q.sameIndexCount===(offs.length===ind.length) && q.sameTrailerMetadata===(v[L+3]===u[T+3]),'variant eq '+pid+'/'+s+'/'+other);
    requireEvidence(q.sameIndexedIds===(JSON.stringify(offs.map(x=>v[x+1]))===JSON.stringify(ind.map(x=>u[x+1]))),'variant ids '+pid+'/'+s+'/'+other);
    requireEvidence(q.sameFirst32Body===v.subarray(3,Math.min(L,35)).equals(u.subarray(3,Math.min(T,35))),'variant body '+pid+'/'+s+'/'+other);
   }
  }else if(kind==='NATIVE_DRIVER_SCOPE'){
   requireEvidence(row.resourceSha256===hash(v) && row.resourceLength===v.length && row.driverAssociation==='FILENAME_HYPOTHESIS_NOT_RUNTIME_PROOF','driver scope '+pid+'/'+s);
  }
 }
}
console.log(JSON.stringify({status:'PASS',checks,failures:0,passes:30,sourceFiles:165,'machineCodeValidated':true,'musicDriverSemanticsQualified':false}));
