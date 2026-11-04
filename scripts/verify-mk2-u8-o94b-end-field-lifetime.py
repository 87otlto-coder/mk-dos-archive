#!/usr/bin/env python3
import hashlib,json,struct,sys
from pathlib import Path
EXPECTED_GMI='7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633'
EXCEPT={'GONG.U8','LIU-KANG.U8','THUNDER.U8','THUNDSHT.U8'}
SIGS={0x0f2f:bytes.fromhex('ad464603c3ab8cd8aba54646ad0bc0740203c3ab58'),0x0cf8:bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb741d891c'),0x0e9c:bytes.fromhex('8b1c3b5c049072128b5c06900bdb750ac74404000090c704ffffc3')}
def sha(b):return hashlib.sha256(b).hexdigest()
def locate(root,name):
 h=[p for p in root.rglob('*') if p.is_file() and p.name.lower()==name.lower()]
 if len(h)!=1:raise SystemExit(f'Expected exactly one {name}, found {len(h)}')
 return h[0]
def main():
 if len(sys.argv)<2:raise SystemExit('Usage: verify-mk2-u8-o94b-end-field-lifetime.py <mk2-install-dir> [output-json]')
 root=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else None
 gmi=locate(root,'GMI.BIN').read_bytes();u8=sorted([p for p in root.rglob('*') if p.is_file() and p.suffix.lower()=='.u8'])
 checks=[]
 def check(i,ok,d):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
 check('gmi_hash',sha(gmi)==EXPECTED_GMI,sha(gmi))
 for off,sig in SIGS.items():check(f'gmi_{off:x}_signature',gmi[off:off+len(sig)]==sig,hex(off))
 rows=[]
 for p in u8:
  b=p.read_bytes();start,end=struct.unpack_from('<II',b,0);high=(end>>16)&0xffff;after=len(b)-(end+1) if end<len(b) else -1
  rel='FILE_BYTES_MINUS_33' if end==len(b)-33 else 'FILE_BYTES_MINUS_1' if end==len(b)-1 else 'OTHER'
  tail=b[end+1:] if after>=0 else b''
  rows.append({'name':p.name,'size':len(b),'start':start,'end':end,'high':high,'after':after,'relation':rel,'tail_sha256':sha(tail) if tail else None,'tail_zero':bool(tail) and not any(tail)})
 from collections import Counter
 rel=Counter(r['relation'] for r in rows);aft=Counter(r['after'] for r in rows);tails=[r for r in rows if r['after']==32];exc=[r for r in rows if r['relation']=='FILE_BYTES_MINUS_1']
 check('u8_count',len(rows)==312,len(rows));check('data_start_32',all(r['start']==32 for r in rows),'all +0 == 32');check('end_high_word_zero',all(r['high']==0 for r in rows),max(r['end'] for r in rows));
 check('relation_partition',rel['FILE_BYTES_MINUS_33']==308 and rel['FILE_BYTES_MINUS_1']==4 and rel['OTHER']==0,dict(rel));check('tail_partition',aft[32]==308 and aft[0]==4 and len(aft)==2,dict(aft));check('exception_identity',{r['name'].upper() for r in exc}==EXCEPT,sorted(r['name'] for r in exc));
 check('tail32_not_uniform',len({r['tail_sha256'] for r in tails})==295,len({r['tail_sha256'] for r in tails}));check('tail32_all_zero_count',sum(r['tail_zero'] for r in tails)==12,sum(r['tail_zero'] for r in tails));
 failed=[c for c in checks if not c['passed']]
 report={'format':'mk2_u8_o94b_independent_end_field_lifetime_audit_v1','fixture':str(root),'status':'SUCCESS' if not failed else 'FAIL','checks':checks,'observed':{'relations':dict(rel),'bytesAfterEnd':dict(aft),'uniqueTail32Sha256':len({r['tail_sha256'] for r in tails}),'allZeroTail32':sum(r['tail_zero'] for r in tails),'exceptions':[r['name'] for r in exc]},'decision':{'low16IdentityCopySupported':not failed,'splitEncodedOnDisk':not failed,'splitPurposeEstablished':False,'exactActivePcmRangeEstablished':False,'wavAdapterAuthorized':False,'nextPass':'O94C four-exception and 32-byte-tail role audit'}}
 if out:out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'checks':len(checks),'failed':[c['id'] for c in failed],'relations':dict(rel),'bytesAfterEnd':dict(aft),'uniqueTail32Sha256':report['observed']['uniqueTail32Sha256']},indent=2));return 1 if failed else 0
if __name__=='__main__':raise SystemExit(main())
