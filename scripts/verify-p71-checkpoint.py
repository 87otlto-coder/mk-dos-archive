#!/usr/bin/env python3
"""P71 original DOS three-game + browser fifth-pass consolidated checkpoint.

This is a fail-closed orchestration of already independently accepted tests:
P66 (P61 + P62..P65), P69/P70 original source ZIPs, P67..P70 live Chrome
original-file downloads, and P67..P70 source-only refusal controls.

Usage:
  python scripts/verify-p71-checkpoint.py
    --mk1 <ORIGINAL DOS MK1> --mk2 <ORIGINAL DOS MK2> --mk3 <ORIGINAL DOS MK3>
    --work <NEW PRIVATE DIRECTORY OUTSIDE SOURCE AND GAME FOLDERS>

Prerequisites: clean develop checkout, original games, npm dependencies, native
Google Chrome, Playwright Core resolvable via NODE_PATH, and Python Pillow.
No game binary/media or generated ZIP is written to this source checkout.
Never call this checkpoint PASS solely from GitHub source-only CI.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
P66 = runpy.run_path(str(ROOT / "scripts/verify-p66-checkpoint.py"))
CENSUS = {"mk1": 2656, "mk2": 5369, "mk3": 9186}
EXPECTED_EXE_SHA = dict(zip(CENSUS, P66["EXE_HASHES"]))
EXPECTED_STEPS = (
    "source_build",
    "p66_original_three_game",
    "p69_original_mk3_ftr",
    "p70_original_mk3_cue",
    "p67_original_browser",
    "p68_original_browser_switch",
    "p69_original_browser_ftr",
    "p70_original_browser_cue",
    "p67_p68_refusal_controls",
    "p69_p70_refusal_controls",
)

def require(ok, why):
    if not ok:
        raise ValueError("P71: " + why)

def exact(actual, expected, label):
    """Fail closed: distinguish False/0 and preserve exact verified values."""
    for key, value in expected.items():
        require(key in actual and type(actual[key]) is type(value) and actual[key] == value,
                f"{label} invalid {key}: {actual.get(key)!r} (expected {value!r})")

def canonical(path):
    """Resolve symlinked existing ancestors even for not-yet-created outputs."""
    p = Path(path).expanduser().absolute()
    tail = []
    while not p.exists():
        parent = p.parent
        require(parent != p, "private work path has no existing ancestor")
        tail.insert(0, p.name)
        p = parent
    return p.resolve(strict=True).joinpath(*tail)

def preflight(game_paths, private_work):
    require(__debug__ and not os.environ.get("PYTHONOPTIMIZE"),
            "Python assertions cannot be disabled")
    require(len(game_paths) == 3, "three original DOS game directories required")
    games = {name: Path(game_paths[name]).resolve(strict=True) for name in CENSUS}
    require(all(folder.is_dir() for folder in games.values()), "invalid original game directory")
    work = canonical(private_work)
    P66["separate"]([ROOT.resolve(), work, *games.values()])
    require(not work.exists(), "use a fresh private work path, not an existing directory")
    identities = {}
    for name, folder in games.items():
        matches = [f for f in folder.iterdir() if f.is_file() and f.name.casefold() == name + ".exe"]
        require(len(matches) == 1, "original executable absent/duplicated: " + name)
        digest = hashlib.sha256(matches[0].read_bytes()).hexdigest()
        require(digest == EXPECTED_EXE_SHA[name], "original DOS binary identity mismatch: " + name)
        identities[name] = digest
    source = P66["audit_source"]()
    require(source["status"] == "PASS", "source audit")
    return games, work, identities, source

def read_json_stdout(stdout, label):
    try:
        obj = json.loads(stdout)
    except (json.JSONDecodeError, TypeError) as error:
        raise ValueError(f"P71: {label} did not output standalone JSON: {error}") from error
    require(isinstance(obj, dict), label + " non-object JSON")
    return obj

def p66_summary(report, source):
    exact(report, {"status":"PASS"}, "P66 checkpoint")
    require(report.get("source") == source, "P66 source audit mismatches P71 opening audit")
    steps = report.get("steps")
    require(isinstance(steps, dict) and len(steps) == 9,
            "P66 all nine regression step groups required")
    p61 = steps.get("P61")
    require(isinstance(p61, dict), "P66 nested P61 verification missing")
    exact(p61, {
        "pass":"P61", "status":"PASS", "stepsPassed":9,
        "census":CENSUS,
        "originalThreeGameRegressionVerified":True,
        "sourceCommit":source["commit"], "sourceTree":source["treeSha"],
    }, "P66/P61 original three-game")
    require(set(steps) == {
        "P61", "P62", "P63", "P64", "P65",
        "P62 controls", "P63 controls", "P64 controls", "P65 controls",
    }, "P66 regression suites incomplete")
    return {"p66OriginalGroups":9,"p61NestedGroups":9,
            "mk1Assets":2656,"mk2Assets":5369,"mk3Assets":9186,
            "originalAssetRepresentations":17211,
            "sourceCommit":source["commit"],"sourceTree":source["treeSha"]}

def check_p69(summary):
    exact(summary, {
        "pass":"P69", "status":"PASS", "mk3Assets":9186,
        "originalFtrContainers":17,"originalIndexedSprites":6654,
        "independentlyDecodedPlanes":6654,
        "originalSourceIntervalsVerified":6654,
        "indexedPixelBytesVerified":32675690,
        "opaqueMaskPixelsVerified":11689513,
        "outputPackages":17,"allOriginalSourceHashesMatched":True,
        "noNativePaletteOrRuntimeSequenceClaimed":True,
        "browserPackageDownloadVerified":False,
    }, "P69 original FTR indexed export")
    return {"originalFtrContainers":17,"originalIndexedSprites":6654,
            "indexedPixels":32675690,"opaqueMaskPixels":11689513,
            "originalExportVerified":True}

def check_p70(summary):
    exact(summary, {
        "pass":"P70","status":"PASS","mk3Assets":9186,
        "originalCueBytes":3014,"originalOggTracks":46,
        "originalOggByteTotal":43367491,
        "allOriginalSourceBytesAndHashesMatched":True,
        "literalMp3CueVsActualOggPreserved":True,
        "nativeGameplayAssociationsClaimed":False,
        "completeCdImageClaimed":False,"browserDownloadVerified":False,
    }, "P70 original CUE/OGG export")
    return {"originalCueBytes":3014,"originalOggTracks":46,
            "originalOggBytes":43367491,"originalExportVerified":True}

def check_p67(text):
    require(re.search(r"(?m)^Chrome \S+", text), "P67 did not open real Chrome")
    for game in ("mk1", "mk2", "mk3"):
        require(re.search(r"(?m)^" + game + r" verified Chrome downloads for ", text),
                "P67 original browser download readback missing: " + game)
    return {"threeSeparateOriginalChromeGamesVerified":True,
            "sourceQualifiedOriginalDownloads":True}

def check_p68(summary):
    exact(summary,{
        "pass":"P68_BROWSER","status":"PASS","oneBrowserTab":True,
        "originalGamesSwitchedInOrder":["mk1","mk2","mk3","mk1"],
        "nativePickerCancelPreservedQueue":True,
        "nativePermissionDeniedPreservedQueue":True,
        "mixedCandidateRejectedWithoutLosingQueue":True,
        "staleInspectorAudioAndEvidenceResetOnAcceptedSwitch":True,
        "privateDownloadsVerifiedAgainstOriginals":3,
        "gameCensus":[2656,5369,9186],
        "audiblePlaybackVerified":False,
    },"P68 original same-tab browser")
    return {"oneBrowserTab":True,"switchSequence":["mk1","mk2","mk3","mk1"],
            "originalSourceDownloadsChecked":3,
            "osNativePermissionDialogVerified":False}

def check_p69_browser(summary):
    exact(summary,{
        "pass":"P69_BROWSER","status":"PASS","game":"mk3",
        "mk3Assets":9186,"originalFtr":"BLADE.FTR",
        "independentlyCheckedFrames":363,
        "originalCompressedIntervalsChecked":True,
        "downloadIndexedPixelsAndMasksVerified":True,
        "nativePaletteOrAnimationOrderClaimed":False,
    },"P69 original Chrome FTR export")
    return {"originalBLADEFtrDownloadedFrames":363,
            "independentOriginalIndexAndMaskParity":True}

def check_p70_browser(summary):
    exact(summary,{
        "pass":"P70_BROWSER","status":"PASS","game":"mk3",
        "mk3Assets":9186,"oneClickOriginalCueMusicDownload":True,
        "independentOriginalOggTracks":46,
        "originalCueBytesPreserved":True,
        "originalOggSourceBytesVerified":43367491,
        "cueMp3VsActualOggMismatchPreserved":True,
        "completeOriginalDiscImageClaimed":False,
        "nativeRuntimeMusicAssociationsClaimed":False,
        "audiblePlaybackVerified":False,
    },"P70 original Chrome CUE download")
    return {"originalDownloadedOggTracks":46,
            "originalDownloadedOggBytes":43367491,
            "cueAndOriginalSourceBytesUnmodified":True}

def check_control_stdout(output, label, expected):
    data = read_json_stdout(output, label)
    exact(data, expected, label)
    return data

def checkpoint(args):
    games, work, identities, opening = preflight({
        name:getattr(args, name) for name in CENSUS}, args.work)
    work.mkdir(parents=True,exist_ok=False)
    report = {
        "pass":"P71","status":"RUNNING",
        "source":opening,"originalExecutableSha256":identities,
        "originalCensusExpected":CENSUS,
        "startTimeUtc":datetime.now(timezone.utc).isoformat(),
        "browserFixtureMode":"ACTUAL_ORIGINAL_DOS_DIRECTORY_UPLOAD_AND_CHROME_DOWNLOAD",
        "nativeOsPickerPermissionDialogVerified":False,
        "audiblePlaybackVerified":False,
        "gameplayRuntimeMusicOrAnimationClaimed":False,
        "mainBranchPromoted":False,
        "commercialGameDataWrittenIntoGit":False,
        "steps": {},
    }
    def save():
        tmp=work/"report.tmp"
        tmp.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
        tmp.replace(work/"report.json")

    def run(label, argv, checker, json_output=True):
        require(label in EXPECTED_STEPS, "unknown acceptance step " + label)
        require(label not in report["steps"], "duplicate acceptance step " + label)
        print("P71:",label,flush=True)
        result=subprocess.run([str(a) for a in argv],cwd=ROOT,
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,
            env={**os.environ,"PYTHON":sys.executable,"PYTHONDONTWRITEBYTECODE":"1"},
            timeout=3600,check=False)
        stdout=result.stdout.decode("utf-8",errors="replace")
        stderr=result.stderr.decode("utf-8",errors="replace")
        (work/(label+".stdout.txt")).write_text(stdout,encoding="utf-8")
        (work/(label+".stderr.txt")).write_text(stderr,encoding="utf-8")
        require(result.returncode==0,
            f"{label} exited {result.returncode}; see private stderr/stdout log")
        value=read_json_stdout(stdout,label) if json_output else stdout
        checked=checker(value)
        report["steps"][label]={
            "status":"PASS",
            "checked":checked if checked is not None else True,
            "stdoutSha256":hashlib.sha256(result.stdout).hexdigest(),
            "stderrSha256":hashlib.sha256(result.stderr).hexdigest(),
        }
        save()

    save()
    try:
        # A current-source browser acceptance is not reproducible unless its
        # actual build and TypeScript checks succeed on the same source tree.
        npm="npm.cmd" if os.name=="nt" else "npm"
        def source_build(_):
            return {"typescript":True,"productionBuild":True,
                    "sameSourceAsOriginalFixture":True}
        def run_build():
            print("P71: source_build",flush=True)
            all_outputs=[]
            for cmd in ([npm,"run","lint"],[npm,"run","build"],
                        ["node","-e","require.resolve('playwright-core')"],
                        [sys.executable,"-c","import PIL"]):
                result=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,timeout=600,check=False,
                    env={**os.environ,"PYTHON":sys.executable})
                all_outputs.extend([result.stdout,result.stderr])
                if result.returncode:
                    logs=b"\n".join(all_outputs)
                    (work/"source_build.log").write_bytes(logs)
                    raise RuntimeError("P71 source build prerequisite failed: "+repr(cmd)+
                                       " (see private source_build.log)")
            out=b"\n".join(all_outputs)
            (work/"source_build.log").write_bytes(out)
            report["steps"]["source_build"]={
                "status":"PASS","checked":source_build(None),
                "combinedLogSha256":hashlib.sha256(out).hexdigest(),
            }
            save()
        run_build()

        mk1,mk2,mk3=(games[n] for n in CENSUS)
        p66work=work/"p66-original"
        print("P71: p66_original_three_game",flush=True)
        p66_cmd=[sys.executable,"scripts/verify-p66-checkpoint.py",
            "--mk1",mk1,"--mk2",mk2,"--mk3",mk3,"--work",p66work]
        p66_result=subprocess.run([str(a) for a in p66_cmd],cwd=ROOT,
            stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False,timeout=3600,
            env={**os.environ,"PYTHON":sys.executable,"PYTHONDONTWRITEBYTECODE":"1"})
        (work/"p66_original_three_game.stdout.txt").write_bytes(p66_result.stdout)
        (work/"p66_original_three_game.stderr.txt").write_bytes(p66_result.stderr)
        require(p66_result.returncode==0,"P66 cumulative original-fixture FAILED; see private log")
        p66_report=json.loads((p66work/"report.json").read_text(encoding="utf-8"))
        checked=p66_summary(p66_report,opening)
        report["steps"]["p66_original_three_game"]={"status":"PASS","checked":checked,
            "reportSha256":hashlib.sha256((p66work/"report.json").read_bytes()).hexdigest()}
        save()

        def json_checked(checker):
            return checker
        run("p69_original_mk3_ftr",
            ["node","scripts/verify-mk3-p69-ftr-indexed.cjs",mk3,work/"p69-original"],
            check_p69)
        run("p70_original_mk3_cue",
            ["node","scripts/verify-mk3-p70-cue.cjs",mk3,work/"p70-original"],
            check_p70)
        run("p67_original_browser",
            ["node","scripts/verify-p67-browser.cjs",mk1,mk2,mk3],
            check_p67,json_output=False)
        run("p68_original_browser_switch",
            ["node","scripts/verify-p68-browser-switch.cjs",mk1,mk2,mk3],
            check_p68)
        run("p69_original_browser_ftr",
            ["node","scripts/verify-p69-browser-ftr.cjs",mk3],
            check_p69_browser)
        run("p70_original_browser_cue",
            ["node","scripts/verify-p70-browser-cue.cjs",mk3],
            check_p70_browser)

        # Separate refusal/source-only controls protect the original-fixture
        # oracle from stale game identity, fabricated order and metadata joins.
        def run_controls(label,commands,expected_json):
            print("P71:",label,flush=True)
            log=[]
            for cmd,expected in zip(commands,expected_json):
                p=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,timeout=600,check=False,
                    env={**os.environ,"PYTHON":sys.executable,
                         "PYTHONDONTWRITEBYTECODE":"1"})
                log.extend([p.stdout,p.stderr])
                require(p.returncode==0,label+" refused-control runner failed: "+repr(cmd))
                if expected is not None:
                    data=read_json_stdout(p.stdout.decode("utf-8",errors="replace"),
                                          label+" "+str(cmd[1]))
                    exact(data,expected,label+" "+str(cmd[1]))
                else:
                    require(b"OK" in p.stderr and b"FAILED" not in p.stderr,
                            label+" Python unittest controls were not fully accepted")
            combined=b"\n".join(log)
            (work/(label+".log")).write_bytes(combined)
            report["steps"][label]={"status":"PASS","checked":{
                "refusalCommandsPassed":len(commands)},
                "logSha256":hashlib.sha256(combined).hexdigest()}
            save()
        run_controls("p67_p68_refusal_controls",[
            [sys.executable,"scripts/test-p67-download.py"],
            [sys.executable,"scripts/test-p68-switch-readback.py"],
            ["node","scripts/test-p68-directory-switch.cjs"],
        ],[
            None,None,
            {"pass":"P68_SOURCE","status":"PASS",
             "cancelledPickerRetainsActiveAssets":True,
             "lateScanCannotOverwriteLaterAcceptedGame":True,
             "staleAssetPreviewAndEvidenceNotPromoted":True,
             "reacceptedSameNamedGameClearsQueue":True},
        ])
        run_controls("p69_p70_refusal_controls",[
            ["node","scripts/test-p69-mk3-ftr-indexed.cjs"],
            ["node","scripts/test-p70-mk3-cue-music.cjs"],
        ],[
            {"pass":"P69_SOURCE","status":"PASS","negativeCasesRejected":15,
             "originalIndicesAndMasksByteIdentical":True,
             "exportedNativePaletteOrRuntimeOrderClaimed":False},
            {"pass":"P70_SOURCE","status":"PASS","invalidEvidenceRefused":15,
             "originalCueBytesPreserved":True,
             "originalOggBytesPreserved":True,
             "declaredMP3ActualOggMismatchRetained":True},
        ])

        closing=P66["audit_source"]()
        require(closing==opening,"source changed during P71 original fixture/browser regression")
        require(tuple(report["steps"])==EXPECTED_STEPS,
            "P71 missing or reordered regression groups")
        require(all(entry["status"]=="PASS" for entry in report["steps"].values()),
            "P71 incomplete regression groups")
        report["closingSource"]=closing
        report["status"]="PASS"
    except BaseException as exc:
        report["status"]="FAIL"
        report["failure"]={"type":type(exc).__name__,"message":str(exc),
                           "lastCompletedGroup":list(report["steps"])[-1] if report["steps"] else None}
        raise
    finally:
        report["finishTimeUtc"]=datetime.now(timezone.utc).isoformat()
        save()
    summary={
        "pass":"P71","status":"PASS","sourceCommit":opening["commit"],
        "sourceTree":opening["treeSha"],
        "sourceFilesAudited":opening["fileBlobs"],
        "stepsPassed":len(report["steps"]),
        "census":CENSUS,"totalOriginalAssetRepresentations":17211,
        "originalP66BaselineReproduced":True,
        "originalP69AndP70ExportAndIndependentDecodersPassed":True,
        "actualP67ThroughP70OriginalChromeWorkflowsPassed":True,
        "nativePaletteTimingOrStageMembershipAsserted":False,
        "audiblePlaybackVerified":False,"mainPromoted":False,
        "privateReport":str(work/"report.json"),
    }
    (work/"summary.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,indent=2),flush=True)


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    for name in (*CENSUS,"work"):
        parser.add_argument("--"+name,required=True)
    checkpoint(parser.parse_args())
