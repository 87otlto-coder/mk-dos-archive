#!/usr/bin/env python3
"""O130 independent LE-fixup and stage-command verification; no producer imports."""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1,O2=0x61C54,0xA0C54
TABLES={'mode_equals_2':0x15BEC,'mode_equals_1':0x15C68,'mode_other':0x15CE4}
DRAW={1,2,3,4,5,7,8}

def sha(x):return hashlib.sha256(x).hexdigest()
def dw(b,p):return struct.unpack_from('<I',b,p)[0]
def si(b,p):return struct.unpack_from('<i',b,p)[0]
def verify(exe,raw):
    n=0
    def check(t,msg):
        nonlocal n
        if not t:raise AssertionError('O130 independent: '+msg)
        n+=1
    report=json.loads(raw)
    check(len(exe)==861133 and sha(exe)==HASH,'canonical identity')
    check(set(report)=={'schema','status','sourceExeSHA256','leRelocationUniqueEntries','trace','rootTables','rootRecords','streams','firstTenConfigurationSummary','limits'},'exact schema')
    check(report['schema']=='mk2_o130_stage_root_control_stream_bridge_static_v1' and report['status']=='PASS_STATIC_STAGE_ROOT_TO_MINUS_ONE_COMMAND','schema/version')
    check(report['sourceExeSHA256']==HASH,'source hash')
    fx,total=parse_fixups(exe)
    check(total==27004 and len(fx)==report['leRelocationUniqueEntries'],'independent LE parser')
    def linked(obj,off,to):
        check(fx.get((obj,off))==(7,16,2,to),'typed pointer '+hex(off))
        check(dw(exe,(O1 if obj==1 else O2)+off)==to,'inline pointer '+hex(off))
    for at,hx in [(0x82353,'8b00a3805a0700e853fbffff'),
                  (0x98bcf,'8b00e8dc92feff'),(0x81eb2,'575051568b00e89b07feff'),
                  (0x81ede,'5e595883c004'),(0x81f41,'8b1883c00450ffd358'),
                  (0x81f4a,'8b1883c004891d225d0700'),
                  (0x81f55,'8b1883c004891df65c0700'),
                  (0x93500,'8b15f65c07008915985a0700'),
                  (0x93557,'74517931407410'),(0x93585,'e88eab0000'),
                  (0x9e118,'f705d4620500010000007473')]:
        check(exe[at:at+len(hx)//2].hex()==hx,'instruction '+hex(at))
    linked(1,0x81f5c-O1,0x75cf6)
    linked(1,0x93502-O1,0x75cf6)
    tr=report['trace']
    check(tr['dispatchRootLoaderCalls']==[0x8235a,0x98bd1], 'dispatcher call edges')
    check(tr['sceneLoaderPhysical']==0x81eb2 and tr['savedEAXRestorePhysical']==0x81ee0 and tr['rootStreamFieldRelativeOffset']==24,'root record layout')
    check(tr['streamPointerLoadPhysical']==0x81f55 and tr['streamPointerGlobalObject2']==0x75cf6,'pointer store')
    check(tr['streamCursorInitPhysical']==0x93500 and tr['minusOneDispatchPhysical']==0x9356e and tr['guardedDrawCallPhysical']==0x93585,'consumer chain')
    check(tr['guardedRendererPhysical']==0x9e118 and tr['gateGlobalObject2']==0x562d4 and tr['allPointersLoadedAtRuntimeObserved'] is False,'guard and runtime caution')
    pool=[x.decode('ascii') for x in exe[0xa0ef1:0xa13a7].split(b'\x00') if x]
    check((pool[25],pool[28])==('PORTAL.GRA','TOMB.GRA'),'source resource pool')
    checks=[];rootset={}; streamset=set()
    check(set(report['rootTables'])==set(TABLES),'three root modes')
    for mode,base in TABLES.items():
        rows=report['rootTables'][mode]
        check(len(rows)==31,'table entries')
        for index,row in enumerate(rows):
            check(row['index']==index,'index order')
            root=dw(exe,O2+base+4*index)
            check(row['rootObject2']==(root or None),'root pointer')
            if root==0:
                check(set(row)=={'index','rootObject2'} and (2,base+4*index) not in fx,'null root')
                continue
            linked(2,base+4*index,root)
            check(O2+root+28<=len(exe),'root bounds')
            resource=dw(exe,O2+root)>>24
            check(0<resource<len(pool),'root resource ID')
            st=dw(exe,O2+root+24)
            linked(2,root+24,st)
            check(row['streamObject2']==st,'stage stream field')
            if root in rootset:check(rootset[root]==(st,resource),'mode variants consistent')
            rootset[root]=(st,resource)
            streamset.add(st)
    rootrows=report['rootRecords']
    check([x['rootObject2'] for x in rootrows]==sorted(rootset),'root records exact')
    for x in rootrows:
        r=x['rootObject2'];stream,resource=rootset[r]
        check(x=={'rootObject2':r,'packedResourceID':resource,'resourceName':pool[resource],
                  'streamFieldObject2':r+24,'streamObject2':stream},'root identity/object')
    check([s['object2Offset'] for s in report['streams']]==sorted(streamset),'unique streams')
    streamlookup={}
    for s in report['streams']:
        p=s['object2Offset'];start=p;ops=[]
        for _ in range(128):
            check(O2<=O2+p<len(exe)-3,'stream pointer bound')
            token=si(exe,O2+p)
            if token==0:
                end=p+4;break
            if token==-1:
                check(O2+p+16<=len(exe),'draw bounded')
                a,b,c=(dw(exe,O2+p+k) for k in (4,8,12))
                linked(2,p+4,a)
                check((2,p+8) not in fx and (2,p+12) not in fx,'draw scalar isolation')
                ops.append({'opcode':'minus_one_draw','object2Offset':p,'sourcePointerObject2':a,'rawParameter2':b,'rawParameter3':c});p+=16
            elif token>0:
                a=token;d=dw(exe,O2+p+4);linked(2,p,a);linked(2,p+4,d)
                ops.append({'opcode':'positive_pair','object2Offset':p,'tokenPointerObject2':a,'payloadPointerObject2':d});p+=8
            else:
                check(token==-2 and (2,p) not in fx,'unknown negative token')
                ops.append({'opcode':'other_negative','object2Offset':p,'signedToken':token});p+=4
        else:raise AssertionError('unbounded command stream')
        expected={'object2Offset':start,'physical':O2+start,'endExclusiveObject2':end,
                  'lengthBytes':end-start,'sourceSHA256':sha(exe[O2+start:O2+end]),
                  'operations':ops,'drawCount':sum(o['opcode']=='minus_one_draw' for o in ops),
                  'pairCount':sum(o['opcode']=='positive_pair' for o in ops),
                  'otherNegativeCount':sum(o['opcode']=='other_negative' for o in ops),
                  'terminatorObject2':end-4}
        check(s==expected,'stream parsed contents '+hex(start))
        streamlookup[start]=expected
    summary=report['firstTenConfigurationSummary']
    check(len(summary)==10,'ten source stage slots')
    for index,x in enumerate(summary):
        refs=[report['rootTables'][mode][index]['rootObject2'] for mode in TABLES]
        check(all(isinstance(root,int) for root in refs),'non-null early slots')
        streams={rootset[r][0] for r in refs}
        check(len(streams)==1,'same stream through modes')
        stream=next(iter(streams));resource=rootset[refs[0]][1]
        draws=[o for o in streamlookup[stream]['operations'] if o['opcode']=='minus_one_draw']
        expected={'configurationIndex':index,'resourceID':resource,'resourceName':pool[resource],
                  'streamObject2':stream,'drawCount':len(draws),'drawCommands':draws,'distinctRootsAcrossModes':len(set(refs))}
        check(x==expected,'first-ten summary '+str(index))
        check((len(draws)==1)==(index in DRAW),'seven linked packed draw indices')
    check(summary[1]['streamObject2']==0x17300 and summary[7]['streamObject2']==0x16440,'known stage addresses')
    check(len(report['limits'])==6 and 'not observed' in report['limits'][0] and
          'may still suppress' in report['limits'][2] and 'No live' in report['limits'][-1], 'uncertainty preserved')
    return {'status':'PASS_O130_INDEPENDENT','assertions':n,'leFixups':total,
            'distinctRoots':len(rootset),'distinctStreams':len(streamset),
            'linkedMinusOneStageIndices':sorted(DRAW),'reportSHA256':sha(raw)}
if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('usage: independent_verifier MK2.EXE O130_REPORT.json')
    print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))
