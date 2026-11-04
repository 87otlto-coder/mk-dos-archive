#!/usr/bin/env python3
"""Preserve original MK2 music + drivers in documented Hoot layout, excluding external CODE.COM."""
from pathlib import Path
import hashlib,zipfile,html,json,sys
src=Path(sys.argv[1]);target=Path(sys.argv[2]);target.parent.mkdir(parents=True,exist_ok=True)
formats={'mid':('SCC1','SCC.BIN'),'lap':('LAPC','LAP.BIN'),'sbl':('SBL','SBL.BIN'),'gvs':('GRAV','GRV.BIN'),'awe':('AWE32','AWE.BIN')}
titles=sorted(p.stem.upper() for p in (src/'sound').glob('*.mid'))
assert len(titles)==33 and len(set(titles))==33
for ext in formats:assert sorted(p.stem.upper() for p in (src/'sound').glob('*.'+ext))==titles
options={
 'SC-55':('beep',{'clockmul':'0x04','midiout':'1','midiout_type':'4'},'SCC.BIN','SCC1','MID'),
 'MT-32':('beep',{'clockmul':'0x04','midiout':'1','midiout_type':'2'},'LAP.BIN','LAPC','LAP'),
 'SoundBlaster':('soundblaster16',{'clockmul':'0x04','opl3_mix':'0x200'},'SBL.BIN','SBL','SBL'),
}
fragment=[]
for label,(driver,opts,filename,folder,extension) in options.items():
 v=[f'  <game>',f'    <name>[PC/AT] Mortal Kombat 2 ({html.escape(label)})</name>',f'    <driver type="{driver}">pcatdos</driver>',f'    <driveralias type="IBM PC/AT">Acclaim</driveralias>',f'    <options>']
 for k,value in opts.items():v.append(f'      <option name="{k}" value="{value}"/>')
 v+=['    </options>','    <romlist archive="mortalkombat2_at">','      <rom type="file" offset="-1">CODE.COM</rom>',f'      <rom type="file" offset="9">DRIVERS/{filename}</rom>']
 for i,t in enumerate(titles):v.append(f'      <rom type="file" offset="0x{16+i:02X}">{folder}/{t}.{extension}</rom>')
 v+=['      <rom type="shell" offset="0">CODE.COM</rom>','    </romlist>','    <titlelist>']
 for i,t in enumerate(titles):v.append(f'      <title code="0x{(16+i)<<8:04X}">{t}</title>')
 v+=['    </titlelist>','  </game>'];fragment+=v
xml='<!-- Add <game> entries below to the games collection within Hoot acclaim.xml. External Pyrotechnica CODE.COM is required. -->\n'+'\n'.join(fragment)+'\n'
readme='''# MK2 DOS native-music assets — Hoot staging layout

This ZIP contains the original 165 MK2 music files and native BIN drivers from the supplied MK2 fixture, reorganized into the directory layout documented by the HCS Hoot community.

**NOT STANDALONE / NOT VERIFIED PLAYBACK.** The crucial `CODE.COM` comes from the separate Pyrotechnica Hoot pack and is **NOT INCLUDED**. You must use your own legitimate copy of that file and the Hoot desktop player. Nothing here converts or synthesizes notes. All source bytes are unchanged.

Community configuration reference: https://www.hcs64.com/mboard/forum.php?showpage=351&showthread=

Steps: (1) Obtain the Pyrotechnica Hoot setup and its `CODE.COM`; (2) merge the directory contents of this ZIP and that external file into one archive named `mortalkombat2_at.zip`, with `CODE.COM` at archive root; (3) insert the `<game>` nodes in `HOOT_MK2_game_fragments.xml` into the Hoot `acclaim.xml` game collection, avoiding duplicate definitions; (4) select SC-55, MT-32, or SoundBlaster in Hoot. Actual audio depends on Hoot version and MIDI synthesizer/device configuration. The SC-55 and MT-32 modes require compatible external MIDI emulation or hardware.

The `.MID` files in this archive are **not Standard MIDI Files**. Do not rename them to `.mid` as an attempted conversion; they are kept unchanged for the native driver.

The `.GVS` and `.AWE` variants are preserved as original assets, but no Hoot playback configuration for them is claimed here.
'''
records=[];payloads={}
for ext,(folder,driver) in formats.items():
 for p in sorted((src/'sound').glob('*.'+ext)):
  rel=f'{folder}/{p.name.upper()}';data=p.read_bytes();payloads[rel]=data
  records.append({'path':rel,'originalPath':f'sound/{p.name}','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
for name in sorted(set(d for _,d in formats.values())|{'GMI.BIN'}):
 b=(src/name.lower()).read_bytes();rel=f'DRIVERS/{name}';payloads[rel]=b;records.append({'path':rel,'originalPath':name.lower(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
payloads['HOOT_MK2_game_fragments.xml']=xml.encode();payloads['README_HOOT.md']=readme.encode()
payloads['ORIGINAL_ASSETS_SHA256.json']=(json.dumps(records,indent=2)+'\n').encode()
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for k,b in payloads.items():z.writestr(k,b)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for r in records: assert hashlib.sha256(z.read(r['path'])).hexdigest()==r['sha256']
print(json.dumps({'status':'PASS','original_music':165,'driver_binaries':6,'zip_entries':len(payloads),'code_com_included':False,'zip':str(target)}))
