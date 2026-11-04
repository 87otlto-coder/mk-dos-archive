#!/usr/bin/env python3
"""O118 independent audit: derives packed VGA word -> RGB matches without importing producer."""
import csv,hashlib,json,struct,sys
from pathlib import Path
from collections import Counter
EXPECTED_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SPEC={'tomb':('Kombat Tomb',0x893c6,80,2,51,0x8cdbe,79,2),
      'portal':('The Portal',0x891e0,80,3,80,0x8cd1e,79,2)}
H=lambda x:hashlib.sha256(x).hexdigest()
def rgb_for_word(w):
 R=(((w>>9)&0x3f)|1);G=(((w>>4)&0x3f)|1);B=(((w<<1)&0x3f)|1)
 # independently expressed bit replication via multiplication plus high-bits
 return ((R*4)+(R//16), (G*4)+(G//16), (B*4)+(B//16))
def derive_object1_relocations(data):
 # Independent LE fixup traversal, bounded by the page index table (not producer call).
 head=0x28f0c;pages=int.from_bytes(data[head+0x14:head+0x18],'little')
 if pages!=113:raise ValueError('LE page count drift')
 offsets=head+int.from_bytes(data[head+0x68:head+0x6c],'little')
 block=head+int.from_bytes(data[head+0x6c:head+0x70],'little')
 wanted={0x2758c:'portal',0x27772:'tomb',0x2b0ca:'portal_alt',0x2b16a:'tomb_alt'}
 hits={k:[] for k in wanted.values()};parsed=0
 for page in range(pages):
  at=block+int.from_bytes(data[offsets+page*4:offsets+page*4+4],'little')
  end=block+int.from_bytes(data[offsets+(page+1)*4:offsets+(page+1)*4+4],'little')
  while at<end:
   code,flags=data[at],data[at+1]
   delta=int.from_bytes(data[at+2:at+4],'little',signed=True)
   at+=4
   objn=int.from_bytes(data[at:at+(2 if flags&64 else 1)],'little');at+=2 if flags&64 else 1
   target=None
   if (code&15)!=2:
    size=4 if flags&16 else 2
    target=int.from_bytes(data[at:at+size],'little');at+=size
   if flags&4:at+=4 if flags&32 else 2
   if code&15==7 and objn==1 and target in wanted:hits[wanted[target]].append(0x61c54+page*4096+delta)
   parsed+=1
  if at!=end:raise ValueError('LE relocation boundary mismatch')
 if parsed!=27004:raise ValueError('LE relocation count drift')
 return {k:sorted(v) for k,v in hits.items()}

def verify(exe:bytes,csv_bytes:bytes,report_bytes:bytes):
 if H(exe)!=EXPECTED_EXE:raise ValueError('EXE identity mismatch')
 data=json.loads(report_bytes);obs=list(csv.DictReader(csv_bytes.decode().splitlines()));
 if data['format']!='mk2_o118_exe_native_stage_palette_witness_bridge_v1' or data['exeSHA256']!=H(exe) or data['witnessCSV_SHA256']!=H(csv_bytes):raise ValueError('invalid report identity')
 if len(obs)!=128:raise ValueError('wrong witness count')
 refs=derive_object1_relocations(exe)
 count=0;alternative={}
 for stage,(label,start,n,lo,hi,alt,altn,shift) in SPEC.items():
  rec=data['records'][stage]; selected={int(r['original_source_index_byte']):tuple(int(r['observed_RGB_'+c]) for c in 'RGB') for r in obs if r['stage']==label}
  if set(selected)!=set(range(lo,hi+1)):raise ValueError('invalid expected witness domain')
  if struct.unpack_from('<H',exe,start)[0]!=n or struct.unpack_from('<H',exe,alt)[0]!=altn:raise ValueError('counted palette record header changed')
  failures=[];dacs=[]
  for i in range(lo,hi+1):
   address=start+2+(i-1)*2
   w=struct.unpack_from('<H',exe,address)[0]
   expected=selected[i];decoded=rgb_for_word(w)
   if decoded!=expected:raise ValueError(f'{stage} palette source differs at {i}')
   row=rec['witnesses'][i-lo]
   if row['wordOffset']!=address or row['sourceIndex']!=i or row['sourceRGB8']!=list(decoded) or row['o115ObservedRGB8']!=list(expected) or row['originalWordHex']!=f'{w:04x}':raise ValueError('forged palette row')
   alt_word=struct.unpack_from('<H',exe,alt+2+2*(i-shift))[0]
   if rgb_for_word(alt_word)!=expected:failures.append(i)
   dacs.append(bytes(decoded))
   count+=1
  if rec['leTypedRelocationSitesFor80ColorRecord']!=refs[stage] or rec['leTypedRelocationSitesFor79ColorAlternative']!=refs[stage+'_alt']:raise ValueError('forged LE source reference provenance')
  if rec['countedPaletteRecordPhysical']!=start or rec['recordCount']!=n or rec['matchingScreenshotIndices']!=hi-lo+1 or rec['consecutiveWitnessRGBSHA256']!=H(b''.join(dacs)) or rec['originalFull80ColorWordsSHA256']!=H(exe[start+2:start+2+2*n]) or rec['alternate79MismatchedIndices']!=failures:raise ValueError(f'{stage} forged summary')
  alternative[stage]={'matches':hi-lo+1-len(failures),'mismatched':failures}
 if data['typedObject1FixupSitesTotal']!=39 or sorted(len(v) for v in refs.values())!=[9,9,9,12]:raise ValueError('forged typed fixup counts')
 if data['witnessedMatches']!=count or count!=128:raise ValueError('forged global count')
 return {'status':'PASS','independentlyVerifiedMatches':count,'recordOrigins':{k:hex(v[1]) for k,v in SPEC.items()},'relocationReferences':{k:len(v) for k,v in refs.items()},'alternative79Records':alternative,'reportSha256':H(report_bytes)}
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage verify_o118_independent.py MK2.EXE O115_CSV O118_JSON')
 print(json.dumps(verify(*(Path(p).read_bytes() for p in sys.argv[1:])),indent=2))
