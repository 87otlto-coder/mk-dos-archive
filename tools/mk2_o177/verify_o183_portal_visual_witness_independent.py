#!/usr/bin/env python3
"""O183 independent verification of the controlled O182 Portal source remap.
Reads original binaries and manifests but DOES NOT import the O182 producer.
"""
import argparse, copy, hashlib, json, struct
from collections import Counter
from pathlib import Path
H=lambda x:hashlib.sha256(x).hexdigest()
SOURCE_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SOURCE_GRA='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'
PATCHED_GRA='02afc72ba2a2bbab5da3c9eee2863d561fcb5c569ddb63eae631a7baac771ce7'
REMAP={54:63,55:64}
NAMES=['portal_swaying','portal_hanging']

def independent_scan(source,start,w,h):
    index=bytearray(w*h); mask=bytearray(w*h); changes={};command_shapes=[]
    ptr=start
    for y in range(h):
        x=0
        while x<w:
            assert ptr+4<=len(source),'short instruction'
            op=struct.unpack_from('<I',source,ptr)[0];at=ptr;ptr+=4
            if op%2:
                count=op//2;kind='skip';pix=0
            elif op%4==2:
                count=op//1024;kind='run';pix=(op//4)%256
                if pix in REMAP:
                    newop=(op & 0xfffffc03)|(REMAP[pix]*4)
                    for k in range(4):
                        old=(op>>(k*8))&255;new=(newop>>(k*8))&255
                        if old!=new:changes[at+k]=(old,new)
            else:
                count=op//4;kind='literal'
                assert count<=64 and ptr+((count+3)//4)*4<=len(source)
            assert 0<count<=w-x
            command_shapes.append((kind,count))
            if kind=='run':
                for j in range(count):index[y*w+x+j]=pix;mask[y*w+x+j]=1
            elif kind=='literal':
                for j in range(count):
                    v=source[ptr+j];index[y*w+x+j]=v;mask[y*w+x+j]=1
                    if v in REMAP:changes[ptr+j]=(v,REMAP[v])
                ptr+=((count+3)//4)*4
            x+=count
    return bytes(index),bytes(mask),ptr,changes,command_shapes

def verify(exe_bytes,source_bytes,source_manifest,report):
    assertions=0
    def check(cond,msg):
        nonlocal assertions
        assert cond,msg;assertions+=1
    check(H(exe_bytes)==SOURCE_EXE,'bad original executable')
    check(H(source_bytes)==SOURCE_GRA,'bad original portal source')
    check(report['schema']=='mk2_o182_original_portal_visual_witness_v1','schema')
    check(report['status']=='STATIC_EQUAL_LENGTH_INDEX_REMAP_RUNTIME_UNVERIFIED','status')
    for key in ['runtimePaletteVerified','gameplayActivationVerified','gameplayBehaviorVerified']:
        check(report[key] is False,f'false runtime claim: {key}')
    check(report['sourcePaletteRemap']=={'54':63,'55':64},'remap identity')
    check(report['resourceName']=='PORTAL.GRA' and report['fileId']==25,'resource')
    check(report['originalResourceSHA256']==SOURCE_GRA and report['originalExecutableSHA256']==SOURCE_EXE,'source IDs')
    check(report['originalResourceLength']==report['editedResourceLength']==len(source_bytes),'resource lengths')
    check(report['wholeResourceReverseSHA256']==SOURCE_GRA,'roundtrip hash')
    tracks=[t for t in source_manifest['tracks'] if t['stage']=='portal' and t['name'] in NAMES]
    check([t['name'] for t in tracks]==NAMES,'source list order')
    check(len(report['frames'])==14 and report['frameCount']==14,'frame count')
    patches={};color_counts=Counter();frame_index=0
    for track in tracks:
        check(len(track['frames'])==7,'track cardinality')
        for frame in track['frames']:
            start=frame['streamStart'];end=frame['streamEndExclusive'];w=frame['sourceWidth'];h=frame['sourceHeight']
            desc=0xa0c54+frame['descriptorObject2']
            sw,sh,sx,sy,packed=struct.unpack_from('<HHhhI',exe_bytes,desc)
            check((sw,sh,sx,sy,packed>>24,packed&0xffffff)==(w,h,frame['signedSourceX'],frame['signedSourceY'],25,start),'descriptor')
            idx,mask,stop,bytechanges,shape=independent_scan(source_bytes,start,w,h)
            check(stop==end and H(idx)==frame['paletteIndexSHA256'] and H(mask)==frame['opacityMaskSHA256'],'original decode identity')
            check(H(source_bytes[start:end])==frame['sourceStreamSHA256'],'stream source hash')
            for offset,pair in bytechanges.items():
                check(offset not in patches,'duplicate patch')
                patches[offset]=pair
            counts=Counter(v for v,m in zip(idx,mask) if m and v in REMAP)
            color_counts.update(counts)
            info=report['frames'][frame_index];frame_index+=1
            check((info['track'],info['ordinal'],info['descriptorObject2'],info['start'],info['endExclusive'],info['width'],info['height'])==(track['name'],frame['ordinal'],frame['descriptorObject2'],start,end,w,h),'frame identity')
            check(info['originalIndicesSHA256']==H(idx) and info['opacityMaskSHA256']==H(mask),'frame original proof')
            check(info['changedOpaquePixels']==sum(counts.values())>0,'changed pixels count')
            check({int(k):v for k,v in info['sourceColorCounts'].items()}==dict(counts),'source color histogram')
    check(dict(color_counts)=={55:2622,54:2011},'census counts')
    expected=[{'offset':k,'before':v[0],'after':v[1]} for k,v in sorted(patches.items())]
    check(report['modifiedBytes']==expected,'exact byte patch list')
    check(report['modifiedByteCount']==len(expected)==4110,'exact byte changes')
    check({int(k):v for k,v in report['sourceColorPixelsChanged'].items()}==dict(color_counts),'changed color pixels')
    clone=bytearray(source_bytes)
    for patch in expected:
        off=patch['offset'];old=patch['before'];new=patch['after']
        check(clone[off]==old,'patch old byte')
        clone[off]=new
    check(H(clone)==report['editedResourceSHA256']==PATCHED_GRA,'whole-resource patched identity')
    # Re-decode changed tracks, independently ensuring masks / row shapes, unchanged source frame boundaries
    for info in report['frames']:
        start,end,w,h=info['start'],info['endExclusive'],info['width'],info['height']
        old,mask,_,_,structure=independent_scan(source_bytes,start,w,h)
        new,newmask,stop,_,new_structure=independent_scan(clone,start,w,h)
        check(stop==end and newmask==mask and structure==new_structure,'opacity and command count unchanged')
        check(H(new)==info['editedIndicesSHA256'],'edited indexed pixel hash')
        check(all(b==REMAP.get(a,a) for a,b in zip(old,new)),'specific remap only')
    # The 6 independent Portal electric-effect frames MUST remain pristine.
    electric=next(t for t in source_manifest['tracks'] if t['name']=='portal_electric')
    for f in electric['frames']:
        start,end=f['streamStart'],f['streamEndExclusive']
        check(clone[start:end]==source_bytes[start:end],'electric track must remain untouched')
    for patch in expected:clone[patch['offset']]=patch['before']
    check(H(clone)==SOURCE_GRA,'byte-for-byte roundtrip')
    check(not report['commandKindsChanged'] and not report['encodedFrameLengthsChanged'] and not report['opacityMasksChanged'],'unverified structural change')
    return {'status':'PASS_INDEPENDENT_O183_VISIBLE_TEST_WITNESS','assertions':assertions,
            'modifiedBytes':len(expected),'sourcePixelsChanged':sum(color_counts.values()),'frameCount':14}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--portal',required=True);p.add_argument('--manifest',required=True);p.add_argument('--report',required=True)
    a=p.parse_args()
    print(json.dumps(verify(Path(a.exe).read_bytes(),Path(a.portal).read_bytes(),json.loads(Path(a.manifest).read_text()),json.loads(Path(a.report).read_text())),indent=2))
