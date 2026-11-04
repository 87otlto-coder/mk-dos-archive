#!/usr/bin/env python3
"""Independently verify encoded PNG diagnostic pixels against approved raw index payloads."""
import sys,json,zipfile,io,hashlib
from PIL import Image
p=sys.argv[1]; checks=0
with zipfile.ZipFile(p) as z:
    m=json.loads(z.read('MANIFEST.json'))
    for resource in m['rows']:
        for c in resource['cases']:
            raw=z.read(c['outputFile']);png=c['outputFile'].replace('.idx8','_diagnostic_gray.png')
            im=Image.open(io.BytesIO(z.read(png)));im.load();plane=im.convert('L').tobytes()
            assert im.size==(320,c['height']) and im.mode=='L';checks+=2
            assert len(raw)==len(plane);checks+=1
            for a,b in zip(raw,plane):assert a==b;checks+=1
            assert hashlib.sha256(z.read(png)).hexdigest()==c['diagnosticPNGSHA256'];checks+=1
print(json.dumps({'verdict':'PASS','checks':checks,'pngs':28}))
