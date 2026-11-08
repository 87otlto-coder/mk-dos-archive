#!/usr/bin/env python3
"""Independent original MK3 GOG CUE/OGG audio track 02–47 ZIP readback.

Exact original CUE bytes and file names are preserved, even though the CUE
declares MP3 for OggS files. Track 01 is a separate binary data track not
included in the audio-only ZIP. No native DOS playback assignment inferred.
"""
import hashlib
import json
from pathlib import Path
import sys
import re
import zipfile

def require(test,why):
    if not test: raise ValueError('P70 original CUE/OGG source: '+why)

def sha(data):return hashlib.sha256(data).hexdigest()

def original(root,relative):
    p=root.resolve()
    for part in relative.split('/'):
        require(part not in ('','.','..'),'invalid source path')
        matches=[q for q in p.iterdir() if q.name.casefold()==part.casefold()]
        require(len(matches)==1,'missing or duplicate original source '+relative)
        p=matches[0]
    require(p.is_file() and p.resolve().is_relative_to(root.resolve()),'file outside original DOS folder')
    return p.read_bytes()

def main(root,archive,report):
    exe=original(root,'MK3.EXE')
    require(sha(exe)=='8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0',
            'original MK3.EXE identity')
    cue=original(root,'IMAGE/MK3.cue')
    # The first referenced binary data file exists in the original installation
    # but should NOT appear in the audio-only archive.
    data_track=original(root,'IMAGE/MK3.GOG')
    require(len(data_track)>0,'missing original separate CUE data track')
    lines=[x.strip() for x in cue.decode('utf-8').splitlines() if x.strip()]
    require(len(lines)==47*3,'original CUE triple count')
    with zipfile.ZipFile(archive) as z:
        require(z.testzip() is None,'download ZIP CRC')
        filenames=z.namelist()
        require(len(filenames)==49 and len(set(filenames))==49,'archive members/duplicates')
        m=json.loads(z.read('manifest.json'))
        require(m['format']=='mk3_p70_gog_original_cue_audio_tracks_v1','manifest schema')
        require(m['originalCuePath']=='IMAGE/MK3.cue' and
                m['originalCueSha256']==sha(cue) and
                m['originalCueBytes']==len(cue),'original cue provenance mismatch')
        require(z.read('MK3.cue')==cue,'original CUE bytes were rewritten')
        require(m['originalOggTracks']==46,'cue audio track count')
        require(m['cueDeclaredAudioFileType']=='MP3' and
                m['actualAudioContainerSignature']=='OggS','CUE literal/Ogg signature mismatch was lost')
        require(m['cueIndexStatementsAreLiteralNotRuntimeTimings'] is True and
                m['completeReconstructedCdImageClaimed'] is False and
                m['nativeDosRuntimeSongAssociationsClaimed'] is False and
                m['nativeMusicLoopDurationsClaimed'] is False,'unsupported native gameplay or CD claims')
        require(m['dataTrack01NotIncluded'] is True and
                m['originalBinaryDataTrack01']['includedInAudioOnlyArchive'] is False,
                'data-track omission not explicit')
        require(lines[:3]==['FILE "MK3.GOG" BINARY','TRACK 01 MODE1/2048','INDEX 0 00:00:00'],
                'source binary data track 01')
        require('MK3.GOG' not in filenames,'binary data track must not be bundled as audio')
        total=0
        records=m['trackRecords']
        require(len(records)==46,'original track manifest count')
        seen=set()
        for i in range(2,48):
            q=(i-1)*3
            name='Track%02d.ogg'%i
            require(lines[q:q+3]==[f'FILE "{name}" MP3',
                f'TRACK {i:02d} AUDIO','INDEX 0 00:00:00'],
                'original source CUE FILE/TRACK/INDEX record %d'%i)
            require(name not in seen,'duplicate original CUE filename')
            seen.add(name)
            source=original(root,'IMAGE/'+name)
            require(source[:4]==b'OggS','original referenced stream is not Ogg')
            require(z.read(name)==source,'original source Ogg bytes differ in archive '+name)
            r=records[i-2]
            require(r['cueTrackNumber']==i and r['cueReferencedFilename']==name and
                    r['cueFileDeclaredType']=='MP3' and
                    r['cueIndexStatement']=='INDEX 0 00:00:00' and
                    r['originalSourcePath']=='IMAGE/'+name and
                    r['originalSourceOffset']==0 and
                    r['originalSourceByteLength']==len(source) and
                    r['originalSourceSha256']==sha(source) and
                    r['archiveMember']==name and
                    r['originalAudioSignature']=='OggS' and
                    r['cueDeclaresFileTypeMP3'] is True and
                    r['nativeSoundHardwareDecodingVerified'] is False and
                    r['gameplayStageCueVerified'] is False and
                    r['originalLoopAndTimingVerified'] is False,
                    'original CUE audio manifest record mismatch '+name)
            total+=len(source)
        require(set(filenames)==seen|{'MK3.cue','manifest.json','README.txt'},
                'incorrect archive member set')
        require(m['originalAudioSourceBytes']==total,
                'original Ogg byte total')
    result={'pass':'P70','status':'PASS','originalMk3ExecutableSha256':sha(exe),
      'originalCueSha256':sha(cue),'originalCueByteLength':len(cue),
      'originalOggTracks':46,'originalOggByteTotal':total,
      'originalGogBinaryDataTrackPresentButExcluded':True,
      'cueLiterallyDeclaresMp3ButFilesAreOgg':True,
      'allOriginalCueAndOggBytesMatched':True,
      'nativeRuntimeSongOrLoopClaimsMade':False,
      'browserDownloadVerified':False}
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__=='__main__':
    require(__debug__,'Python assertions required')
    require(len(sys.argv)==4,'Usage: original Mk3 folder audioZip privateReport')
    main(Path(sys.argv[1]),Path(sys.argv[2]),Path(sys.argv[3]))
