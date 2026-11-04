#!/usr/bin/env python3
"""Independent, source-grounded tamper rejection: one token export and one playable MIDI."""
import sys,json,gzip,shutil,subprocess,tempfile
from pathlib import Path
fixture=Path(sys.argv[1]);root=Path(sys.argv[2]);scripts=Path(__file__).resolve().parent
node='node'

def test(args,work):
 p=subprocess.run([node,str(args[0]),str(fixture),str(work)],capture_output=True,text=True)
 return p.returncode,p.stdout+p.stderr
with tempfile.TemporaryDirectory(prefix='mk2-audio-negative-') as temp:
 tmp=Path(temp)
 event=tmp/'event';shutil.copytree(root/'evidence/mk2_o109c_corrected_scores',event)
 verifier=scripts/'verify-mk2-o109c-corrected-driver-stream-decode.mjs'
 code,log=test([verifier],event);assert code==0,log
 f=event/'mk2_driver_score_stream_manifest_o109c_2026-10-09.json'
 data=json.loads(f.read_text());data['totals']['events']+=1;f.write_text(json.dumps(data))
 code,log=test([verifier],event);assert code!=0,'bad count accepted';print('PASS reject tampered source event count')
 f.write_bytes((root/'evidence/mk2_o109c_corrected_scores'/f.name).read_bytes())
 code,log=test([verifier],event);assert code==0,log
 midi=tmp/'midi';shutil.copytree(root/'evidence/mk2_o109d_scc_midi',midi)
 smf=midi/'title.mid';b=bytearray(smf.read_bytes());needle=b'\x90\x30\x7f';idx=b.find(needle)
 if idx<0:
  idx=next(i for i in range(len(b)-3) if b[i]>=0x90 and b[i]<=0x9f and b[i+1]<128 and b[i+2]<128)
  b[idx+2]^=1
 else:b[idx+2]^=1
 smf.write_bytes(b)
 v2=scripts/'verify-mk2-o109d-scc-standard-midi.mjs'
 code,log=test([v2],midi);assert code!=0,'altered MIDI accepted';print('PASS reject tampered MIDI source events')
 smf.write_bytes((root/'evidence/mk2_o109d_scc_midi'/'title.mid').read_bytes())
 code,log=test([v2],midi);assert code==0,log;print('PASS pristine 33 MIDI output reverified')
 lap=tmp/'lap';shutil.copytree(root/'evidence/mk2_o109e_lap_midi',lap)
 original=lap/'title.mid';data=bytearray(original.read_bytes());data[11]^=1;original.write_bytes(data)
 code,log=test([scripts/'verify-mk2-o109e-lap-standard-midi.mjs'],lap);assert code!=0,'altered MT32 MIDI accepted';print('PASS reject tampered MT32 metadata')
 original.write_bytes((root/'evidence/mk2_o109e_lap_midi'/'title.mid').read_bytes())
 code,log=test([scripts/'verify-mk2-o109e-lap-standard-midi.mjs'],lap);assert code==0,log;print('PASS pristine 33 MT32 MIDI outputs reverified')

print('ALL NEGATIVE CONTROLS PASS')
