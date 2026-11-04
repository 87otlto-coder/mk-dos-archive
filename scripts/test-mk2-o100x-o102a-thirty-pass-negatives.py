#!/usr/bin/env python3
"""Independently falsify 30 *substantive evidence* fields, leaving prior reports intact."""
import sys,json,tempfile,os,subprocess,pathlib
exe,fixture,source,reports,verifier=sys.argv[1:6];reports=pathlib.Path(reports)
files=sorted(reports.glob('mk2_*.json'))
assert len(files)==30,len(files)
def mutate(item):
 tag=item['passId'];r=item['evidence']
 if tag=='O100X':r['dimension'][0]+=1
 elif tag=='O100Y':r['rows'][0]['width']+=1
 elif tag=='O100Z':r['directWords']['116720']+=4
 elif tag=='O101A':r['pixelDiff']+=1
 elif tag=='O101B':r['tableIncoming'][0]['targetOffset']+=1
 elif tag=='O101C':r['firstEightRefs'][0]+=1
 elif tag=='O101D':r['prefixCandidate']['opaque']+=1
 elif tag=='O101E':r['matchingRecordHashes'][0]=False
 elif tag=='O101F':r['rows'][0]['packedRef']+=1
 elif tag=='O101G':r['streamCount']+=1
 elif tag=='O101H':r['sha']='0'*64
 elif tag=='O101I':r['overlapBytes']=0
 elif tag=='O101J':r['allAdjacent']=not r['allAdjacent']
 elif tag=='O101K':r['dwordCount']+=1
 elif tag=='O101L':r['boundedEightByteCandidates']=[1]
 elif tag=='O101M':r['boundedTwelveByteCandidates']=[1]
 elif tag in ('O101N','O101O','O101P','O101Q','O101R','O101S','O101T'):r['transferredZero']+=1
 elif tag=='O101U':r['sourceStride']+=4
 elif tag=='O101V':r['tableRaw'][0]+=1
 elif tag=='O101W':r['codeWindow']='bad'
 elif tag=='O101X':r['uniqueHashes']+=1
 elif tag=='O101Y':r['uniqueSha']+=1
 elif tag=='O101Z':r['exactFull']+=1
 elif tag=='O102A':r['fixups']+=1
 else:raise ValueError(tag)
 return item
with tempfile.TemporaryDirectory(prefix='o102a-falsified-') as folder:
 dst=pathlib.Path(folder)
 for f in files:os.symlink(f,dst/f.name)
 for f in files:
  entry=json.loads(f.read_text());tag=entry['passId'];mutate(entry)
  (dst/f.name).unlink();(dst/f.name).write_text(json.dumps(entry,indent=2)+'\n')
  p=subprocess.run(['node',verifier,exe,fixture,source,folder,tag],capture_output=True,text=True)
  assert p.returncode!=0,(tag,'falsification accepted',p.stdout[-200:])
  (dst/f.name).unlink();os.symlink(f,dst/f.name)
  q=subprocess.run(['node',verifier,exe,fixture,source,folder,tag],capture_output=True,text=True)
  assert q.returncode==0,(tag,'original rejected',q.stderr[-600:])
  print(json.dumps({'pass':tag,'tamperedReport':'REJECTED','originalReport':'PASS'}))
print(json.dumps({'status':'PASS','negativeControls':len(files),'allRejected':True,'pristineRestorations':len(files)}))
