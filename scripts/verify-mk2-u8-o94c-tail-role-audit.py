#!/usr/bin/env python3
import hashlib,json,math,statistics,struct,sys
from pathlib import Path
EXPECTED_GMI='7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633'
EXCEPT={'GONG.U8','LIU-KANG.U8','THUNDER.U8','THUNDSHT.U8'}
SIGS={
 0x0cf8:bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07'),
 0x0de2:bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07'),
 0x0e68:bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb7423891c8e440290268a07'),
}
def sha(b):return hashlib.sha256(b).hexdigest()
def locate(root,name):
 h=[p for p in root.rglob('*') if p.is_file() and p.name.lower()==name.lower()]
 if len(h)!=1:raise SystemExit(f'Expected exactly one {name}, found {len(h)}')
 return h[0]
def s8(v):return v if v<128 else v-256
def rms(b):return math.sqrt(sum(s8(x)**2 for x in b)/len(b)) if b else 0.0
def madj(b):return sum(abs(s8(b[i])-s8(b[i-1])) for i in range(1,len(b)))/(len(b)-1) if len(b)>1 else 0.0
def main():
 if len(sys.argv)<2:raise SystemExit('Usage: verify-mk2-u8-o94c-tail-role-audit.py <mk2-install-dir> [output-json]')
 root=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else None
 gmi=locate(root,'GMI.BIN').read_bytes();u8=sorted([p for p in root.rglob('*') if p.is_file() and p.suffix.lower()=='.u8'])
 checks=[]
 def check(i,ok,d):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
 check('gmi_hash',sha(gmi)==EXPECTED_GMI,sha(gmi))
 for off,sig in SIGS.items():check(f'mixer_{off:x}_signature',gmi[off:off+len(sig)]==sig,hex(off))
 rows=[]
 for p in u8:
  b=p.read_bytes();start,end,loop=struct.unpack_from('<III',b,0);payload=len(b)-32
  enc='NORMAL' if end==payload-1 else 'EXCEPTION' if end==len(b)-1 else 'OTHER';unread=len(b)-end
  excluded=b[end:] if 0<=end<len(b) else b'';preceding=b[max(start,end-len(excluded)):end] if excluded else b''
  rows.append({'name':p.name,'size':len(b),'payload':payload,'start':start,'end':end,'loop':loop,'enc':enc,'unread':unread,
   'excluded_sha':sha(excluded),'excluded_zero':bool(excluded) and not any(excluded),'excluded_rms':rms(excluded),'preceding_rms':rms(preceding),
   'boundary':abs(s8(b[end])-s8(b[end-1])) if start<end<len(b) else None,'excluded_adj':madj(excluded),'preceding_adj':madj(preceding),'excluded_eq_preceding':excluded==preceding,
   'final33_rms':rms(b[max(start,len(b)-33):]),'final33_adj':madj(b[max(start,len(b)-33):])})
 normal=[r for r in rows if r['enc']=='NORMAL'];exc=[r for r in rows if r['enc']=='EXCEPTION'];other=[r for r in rows if r['enc']=='OTHER']
 check('u8_count',len(rows)==312,len(rows));check('start_all_32',all(r['start']==32 for r in rows),'all start=32');check('loop_all_zero',all(r['loop']==0 for r in rows),'all loop=0')
 check('encoding_partition',len(normal)==308 and len(exc)==4 and not other,f'{len(normal)}/{len(exc)}/{len(other)}')
 check('unread_partition',all(r['unread']==33 for r in normal) and all(r['unread']==1 for r in exc),'normal=33 exception=1')
 check('exception_identity',{r['name'].upper() for r in exc}==EXCEPT,sorted(r['name'] for r in exc))
 distinct=len({r['excluded_sha'] for r in normal});allzero=sum(r['excluded_zero'] for r in normal);dup=sum(r['excluded_eq_preceding'] for r in normal)
 bmed=statistics.median(r['boundary'] for r in normal);br5=sum(r['boundary']<=5 for r in normal);br10=sum(r['boundary']<=10 for r in normal)
 rr=statistics.median(r['excluded_rms'] for r in normal);pr=statistics.median(r['preceding_rms'] for r in normal);r5=sum(r['excluded_rms']<=5 for r in normal);r10=sum(r['excluded_rms']<=10 for r in normal);r20=sum(r['excluded_rms']>20 for r in normal)
 ea=statistics.median(r['excluded_adj'] for r in normal);pa=statistics.median(r['preceding_adj'] for r in normal)
 check('normal_excluded_distinct',distinct==295,distinct);check('normal_excluded_all_zero',allzero==12,allzero);check('normal_excluded_eq_preceding',dup==4,dup)
 check('boundary_metrics',bmed==1 and br5==279 and br10==293,f'median={bmed} <=5={br5} <=10={br10}')
 check('rms_count_metrics',r5==239 and r10==278 and r20==15,f'<=5={r5} <=10={r10} >20={r20}')
 # Numeric medians are evidence, not acceptance gates beyond stable tolerance.
 check('rms_medians',abs(rr-2.1742180581131416)<1e-12 and abs(pr-2.7024061256991443)<1e-12,f'excluded={rr} preceding={pr}')
 check('adjacent_delta_medians',abs(ea-0.90625)<1e-12 and abs(pa-0.984375)<1e-12,f'excluded={ea} preceding={pa}')
 failed=[c for c in checks if not c['passed']]
 exc_details=[{k:r[k] for k in ['name','size','payload','start','end','loop','unread','boundary','excluded_rms','preceding_rms','excluded_adj','preceding_adj','final33_rms','final33_adj']} for r in exc]
 report={'format':'mk2_u8_o94c_independent_tail_role_audit_v1','fixture':str(root),'status':'SUCCESS' if not failed else 'FAIL','checks':checks,
  'observed':{'normalCount':len(normal),'exceptionCount':len(exc),'normalUnreadBytes':33,'exceptionUnreadBytes':1,'normalExcludedDistinctSha256':distinct,'normalExcludedAllZeroCount':allzero,'normalExcludedEqualsPrecedingCount':dup,
   'normalBoundaryDeltaMedian':bmed,'normalBoundaryDeltaLe5Count':br5,'normalBoundaryDeltaLe10Count':br10,'normalExcludedRmsMedian':rr,'normalPrecedingRmsMedian':pr,'normalExcludedRmsLe5Count':r5,'normalExcludedRmsLe10Count':r10,'normalExcludedRmsGt20Count':r20,'normalExcludedAdjacentDeltaMedian':ea,'normalPrecedingAdjacentDeltaMedian':pa,'exceptions':exc_details},
  'decision':{'twoEndEncodingsConfirmed':not failed,'authenticatedMixerThresholdBeforeRead':not failed,'loopFieldAllZero':not failed,'requiredMixerOverreadGuardRejected':not failed,'tailPurposeEstablished':False,'exactPcmExportContractEstablished':False,'wavAdapterAuthorized':False,'nextPass':'O94D PCM export contract qualification'}}
 if out:out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'checks':len(checks),'failed':[c['id'] for c in failed],'normal':len(normal),'exceptions':len(exc),'unread':[33,1],'distinctExcluded':distinct,'boundaryMedian':bmed,'excludedRmsMedian':rr},indent=2));return 1 if failed else 0
if __name__=='__main__':raise SystemExit(main())
