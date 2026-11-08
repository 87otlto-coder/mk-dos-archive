"""Run the accepted DOS fixture verifiers on a clean develop checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CENSUS = {"mk1": 2656, "mk2": 5369, "mk3": 9186}
EXE_HASHES = (
    "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14",
    "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
    "8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0",
)
SCORES = dict(pass_="P64", status="PASS", mk2Assets=5369, originalScores=33,
              originalStreams=212, repeatBoundaries=82, stopBoundaries=130,
              independentlyComparedMidiEvents=37481, selectedZipScoreEntries=66,
              allOriginalSourceHashesAndOffsetsMatched=True, selectedZipPreservedSource=True,
              allMidiBytesAndEventTicksMatched=True, runtimeLoopDurationsClaimed=False,
              nativeTimbreOrOriginalPlaybackClaimed=False, interactiveBrowserExportVerified=False)
STREAMS = dict(pass_="P65", status="PASS", mk1Assets=2656, originalTables=8,
               verifiedAnitabCells=739, uniqueOriginalSourceStreams=514,
               sourceInstructionFrameOccurrences=1824, sourceInstructionControlOccurrences=786,
               indexedDescriptorRecords=1102, indexedSourceFramePartsVerified=1853,
               distinctLinkedDescriptorKeys=1102, originalExecutableOpcodesAndPointersMatched=True,
               originalO60IndexedBytesByteIdentical=True, noOriginalPaletteOrTimingAssigned=True,
               fullThreeGameRegressionPerformed=False, browserPackageDownloadVerified=False)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def matches(actual, expected):
    for key, value in expected.items():
        key = "pass" if key == "pass_" else key
        require(key in actual and type(actual[key]) is type(value) and actual[key] == value,
                f"Unexpected verifier field {key}: {actual.get(key)!r}")


def run(*args):
    result = subprocess.run(args, cwd=ROOT, stdout=subprocess.PIPE, check=True,
                            env={**os.environ, "PYTHON": sys.executable, "PYTHONDONTWRITEBYTECODE": "1"})
    return result.stdout.decode("utf-8").strip()


def audit_source():
    require(run("git", "branch", "--show-current") == "develop", "Expected develop")
    require(not run("git", "status", "--porcelain", "--untracked-files=all"), "Dirty source checkout")
    commit = run("git", "rev-parse", "HEAD")
    tree = run("git", "rev-parse", "HEAD^{tree}")
    entries = []
    for row in run("git", "ls-tree", "-rz", tree).rstrip("\0").split("\0"):
        meta, name = row.split("\t", 1)
        mode, kind, sha = meta.split()
        require(kind == "blob", "Unexpected non-file entry: " + name)
        entries.append(dict(mode=mode, type=kind, sha=sha, path=name))
    audit = runpy.run_path(str(ROOT / "scripts/verify-p31-source-tree.py"))["audit"]
    result = audit(ROOT, dict(sha=tree, tree=entries, truncated=False), commit)
    require(result["status"] == "PASS", f"Source audit failed: {result}")
    return result


def separate(paths):
    for i, left in enumerate(paths):
        for right in paths[i+1:]:
            require(not (left.is_relative_to(right) or right.is_relative_to(left)),
                    f"Overlapping checkout, fixtures or private output: {left}, {right}")


def checkpoint(args):
    require(__debug__ and not os.environ.get("PYTHONOPTIMIZE"), "Python assertions must be enabled")
    games = [Path(getattr(args, game)).resolve(strict=True) for game in CENSUS]
    work = Path(args.work).resolve()
    separate([ROOT, work, *games])
    identities = {}
    for name, folder, expected in zip(CENSUS, games, EXE_HASHES):
        executable, = [p for p in folder.iterdir() if p.name.lower() == name + ".exe"]
        identities[name] = hashlib.sha256(executable.read_bytes()).hexdigest()
        require(identities[name] == expected, "Unexpected " + name + " executable")
    source = audit_source()
    work.mkdir(parents=True, exist_ok=False)
    report = dict(status="RUNNING", source=source, executableSha256=identities, steps={},
                  startedAt=datetime.now(timezone.utc).isoformat(), interactiveBrowserExportVerified=False)

    def save():
        tmp = work / "report.tmp"
        tmp.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        tmp.replace(work / "report.json")

    def verify(label, script, arguments, expected):
        print(label, flush=True)
        output = run("node", "scripts/" + script, *arguments)
        if isinstance(expected, str):
            require(output.startswith(expected), f"{label}: unexpected verifier output {output!r}")
            result = output
        else:
            result = json.loads(output)
            matches(result, expected)
        report["steps"][label] = result
        save()

    save()
    try:
        mk1, mk2, mk3 = games
        verify("P61", "verify-p61-checkpoint.cjs",
               ["--mk1", mk1, "--mk2", mk2, "--mk3", mk3, "--report", work/"p61.json",
                "--work", work/"p61-work"], dict(pass_="P61", status="PASS", stepsPassed=9,
                census=CENSUS, sourceCommit=source["commit"], sourceTree=source["treeSha"],
                originalThreeGameRegressionVerified=True))
        verify("P62", "verify-mk1-p62-audio.cjs", [mk1],
               "PASS 2656 MK1 assets, 244 original and selected-ZIP WAVs, 243 EXE bindings and one path-only WAV")
        verify("P63", "verify-mk3-p63-audio.cjs", [mk3],
               "PASS: 9186 assets, 1024 original intervals and selected WAVs, 673 distinct byte strings")
        verify("P64", "verify-mk2-p64-scores.cjs", [mk2], SCORES)
        verify("P65", "verify-mk1-p65-anitab-streams.cjs", [mk1], STREAMS)
        verify("P62 controls", "test-p62-mk1-audio.cjs", [], "PASS MK1 WAV provenance and four invalid evidence joins")
        verify("P63 controls", "test-p63-mk3-audio.cjs", [], "PASS: repeated records retain offsets, four malformed intervals refused")
        verify("P64 controls", "test-p64-mk2-score.cjs", [], dict(pass_="P64_SOURCE", status="PASS", falseClaimsRejected=8))
        verify("P65 controls", "test-p65-mk1-anitab-streams.cjs", [], dict(pass_="P65_SOURCE", status="PASS", syntheticFalseEvidenceRejected=15))
        require(audit_source() == source, "Source changed during checkpoint")
        report["status"] = "PASS"
    except Exception as error:
        report.update(status="FAIL", failure=str(error))
        raise
    finally:
        report["finishedAt"] = datetime.now(timezone.utc).isoformat()
        save()
    print(f"P66 PASS: {work / 'report.json'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for option in (*CENSUS, "work"):
        parser.add_argument("--" + option, required=True)
    checkpoint(parser.parse_args())
