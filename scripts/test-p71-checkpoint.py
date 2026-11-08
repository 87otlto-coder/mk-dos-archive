#!/usr/bin/env python3
"""P71 source-only refusal controls for accepted fixture/browser checkpoint.

This test imports the P71 gate but never touches original game files. It
falsifies accepted evidence fields, source identity, browser provenance, and
private input/output paths. Full fixture validation is a separate acceptance.
"""
import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest

G = runpy.run_path(str(Path(__file__).with_name("verify-p71-checkpoint.py")))


def fake_source():
    return {"status":"PASS", "commit":"a"*40,"treeSha":"b"*40,
            "fileBlobs":2355, "sourceFiles":398,"missing":[],"mismatches":[],
            "unsafePaths":[]}


def fake_p66():
    source=fake_source()
    steps={name:{} for name in (
        "P61","P62","P63","P64","P65",
        "P62 controls","P63 controls","P64 controls","P65 controls")}
    steps["P61"]={"pass":"P61","status":"PASS","stepsPassed":9,
        "census":dict(G["CENSUS"]),
        "originalThreeGameRegressionVerified":True,
        "sourceCommit":source["commit"],"sourceTree":source["treeSha"]}
    return {"status":"PASS","source":source,"steps":steps}


def p69():
    return {"pass":"P69","status":"PASS","mk3Assets":9186,
        "originalFtrContainers":17,"originalIndexedSprites":6654,
        "independentlyDecodedPlanes":6654,
        "originalSourceIntervalsVerified":6654,
        "indexedPixelBytesVerified":32675690,
        "opaqueMaskPixelsVerified":11689513,
        "outputPackages":17,"allOriginalSourceHashesMatched":True,
        "noNativePaletteOrRuntimeSequenceClaimed":True,
        "browserPackageDownloadVerified":False}


def p70():
    return {"pass":"P70","status":"PASS","mk3Assets":9186,
        "originalCueBytes":3014,"originalOggTracks":46,
        "originalOggByteTotal":43367491,
        "allOriginalSourceBytesAndHashesMatched":True,
        "literalMp3CueVsActualOggPreserved":True,
        "nativeGameplayAssociationsClaimed":False,
        "completeCdImageClaimed":False,"browserDownloadVerified":False}


def p68():
    return {"pass":"P68_BROWSER","status":"PASS","oneBrowserTab":True,
        "originalGamesSwitchedInOrder":["mk1","mk2","mk3","mk1"],
        "nativePickerCancelPreservedQueue":True,
        "nativePermissionDeniedPreservedQueue":True,
        "mixedCandidateRejectedWithoutLosingQueue":True,
        "staleInspectorAudioAndEvidenceResetOnAcceptedSwitch":True,
        "privateDownloadsVerifiedAgainstOriginals":3,
        "gameCensus":[2656,5369,9186],"audiblePlaybackVerified":False}


def p69_browser():
    return {"pass":"P69_BROWSER","status":"PASS","game":"mk3",
        "mk3Assets":9186,"originalFtr":"BLADE.FTR",
        "independentlyCheckedFrames":363,
        "originalCompressedIntervalsChecked":True,
        "downloadIndexedPixelsAndMasksVerified":True,
        "nativePaletteOrAnimationOrderClaimed":False}


def p70_browser():
    return {"pass":"P70_BROWSER","status":"PASS","game":"mk3",
        "mk3Assets":9186,"oneClickOriginalCueMusicDownload":True,
        "independentOriginalOggTracks":46,
        "originalCueBytesPreserved":True,
        "originalOggSourceBytesVerified":43367491,
        "cueMp3VsActualOggMismatchPreserved":True,
        "completeOriginalDiscImageClaimed":False,
        "nativeRuntimeMusicAssociationsClaimed":False,
        "audiblePlaybackVerified":False}


class P71SourceOnlyRefusals(unittest.TestCase):
    def test_complete_synthetic_gate_shapes(self):
        self.assertEqual(G["p66_summary"](fake_p66(),fake_source())["originalAssetRepresentations"],17211)
        self.assertEqual(G["check_p69"](p69())["originalIndexedSprites"],6654)
        self.assertEqual(G["check_p70"](p70())["originalOggTracks"],46)
        lines="Chrome 141.0\n"+ "".join(
            f"{game} verified Chrome downloads for ['source']\n"
            for game in ("mk1","mk2","mk3"))
        self.assertTrue(G["check_p67"](lines)["threeSeparateOriginalChromeGamesVerified"])
        self.assertTrue(G["check_p68"](p68())["oneBrowserTab"])
        self.assertEqual(G["check_p69_browser"](p69_browser())["originalBLADEFtrDownloadedFrames"],363)
        self.assertEqual(G["check_p70_browser"](p70_browser())["originalDownloadedOggTracks"],46)
        self.assertEqual(len(G["EXPECTED_STEPS"]),10)

    def test_p68_real_browser_readbacks_precede_final_json(self):
        # The actual original-fixture P68 runner uses Python stdio:inherit
        # and prints authenticated MK1/MK2/MK3 selection-ZIP readbacks
        # BEFORE its pretty-printed final JSON. P71 must parse that exact
        # existing producer contract, not downgrade to "last JSON wins".
        lines = [
            f"{game} P68 same-tab download matches original source and selection"
            for game in ("mk1", "mk2", "mk3")
        ]
        body = json.dumps(p68(), indent=2)
        accepted = "\n".join([*lines, body]) + "\n"
        verified = G["check_p68_browser_stdout"](accepted)
        self.assertTrue(verified["oneBrowserTab"])
        self.assertEqual(verified["originalSourceDownloadsChecked"], 3)

        corruptions = [
            body,  # Original provenance readback lines cannot be omitted.
            "\n".join(lines[:2] + [body]),
            "\n".join(lines[::-1] + [body]),
            "\n".join([lines[0],lines[0],lines[2],body]),
            "\n".join(["warning",*lines,body]),
            "\n".join([*lines,"not JSON"]),
            "\n".join([*lines,body,"unexpected trailing output"]),
            "\n".join([*lines,json.dumps({**p68(),"status":"FAIL"})]),
            "\n".join([*lines,json.dumps({**p68(),"privateDownloadsVerifiedAgainstOriginals":2})]),
            "\n".join([*lines,"{}",body]),  # No discarded leading JSON.
        ]
        for ordinal, bad in enumerate(corruptions):
            with self.subTest(corruption=ordinal),self.assertRaises(ValueError):
                G["check_p68_browser_stdout"](bad)

    def test_missing_or_modified_p66_group_refused(self):
        actual=fake_p66()
        for key in actual["steps"]:
            mutated=copy.deepcopy(actual)
            del mutated["steps"][key]
            with self.subTest(missing=key),self.assertRaises(ValueError):
                G["p66_summary"](mutated,fake_source())
        for key,value in actual["steps"]["P61"].items():
            mutated=copy.deepcopy(actual)
            mutated["steps"]["P61"][key] = False if not isinstance(value,bool) else not value
            with self.subTest(misreported=key),self.assertRaises(ValueError):
                G["p66_summary"](mutated,fake_source())
        mutated=copy.deepcopy(actual)
        mutated["source"]["treeSha"]="c"*40
        with self.assertRaises(ValueError):
            G["p66_summary"](mutated,fake_source())

    def test_full_original_p69_fields_cannot_be_falsified(self):
        good=p69()
        for key,value in good.items():
            for mode in ("missing","wrong"):
                changed=copy.deepcopy(good)
                if mode=="missing":
                    del changed[key]
                else:
                    changed[key]=not value if isinstance(value,bool) else -1
                with self.subTest(key=key,mode=mode),self.assertRaises(ValueError):
                    G["check_p69"](changed)

    def test_full_original_p70_fields_cannot_be_falsified(self):
        good=p70()
        for key,value in good.items():
            for mode in ("missing","wrong"):
                changed=copy.deepcopy(good)
                if mode=="missing":
                    del changed[key]
                else:
                    changed[key]=not value if isinstance(value,bool) else -1
                with self.subTest(key=key,mode=mode),self.assertRaises(ValueError):
                    G["check_p70"](changed)

    def test_separate_browser_evidence_not_synthetic_fixture_pass(self):
        good=p68()
        for key,value in good.items():
            mutated=copy.deepcopy(good)
            mutated[key]=None
            with self.subTest(key=key),self.assertRaises(ValueError):
                G["check_p68"](mutated)
        for checker,fixture in ((G["check_p69_browser"],p69_browser()),
                                (G["check_p70_browser"],p70_browser())):
            for key,value in fixture.items():
                changed=copy.deepcopy(fixture)
                del changed[key]
                with self.subTest(checker=checker.__name__,key=key),self.assertRaises(ValueError):
                    checker(changed)
        with self.assertRaises(ValueError):
            G["check_p67"]("Chrome 141.0\nmk1 verified Chrome downloads for source\n")
        with self.assertRaises(ValueError):
            G["check_p67"]("mk1 verified Chrome downloads for source\n"
                             "mk2 verified Chrome downloads for source\n"
                             "mk3 verified Chrome downloads for source\n")
        exact=G["exact"]
        with self.assertRaises(ValueError):
            exact({"nativePaletteVerified":0},{"nativePaletteVerified":False},"booleans")

    def test_private_paths_and_invalid_executables_refused(self):
        with tempfile.TemporaryDirectory(prefix="mkdos-p71-negative-") as tmp:
            base=Path(tmp)
            roots={}
            for name in ("mk1","mk2","mk3"):
                folder=base/name
                folder.mkdir()
                (folder/(name.upper()+".EXE")).write_bytes(b"MZ fake")
                roots[name]=str(folder)
            # The original-fixture identity is checked before opening a private
            # report or executing any game-source decoder.
            with self.assertRaises(ValueError):
                G["preflight"](roots,base/"private")
            self.assertFalse((base/"private").exists())
            with self.assertRaises(ValueError):
                G["preflight"](roots,Path.cwd()/"DO_NOT_CREATE_P71")
            nested=dict(roots);nested["mk2"]=roots["mk1"]
            with self.assertRaises(ValueError):
                G["preflight"](nested,base/"private")
            existing=base/"existing";existing.mkdir()
            with self.assertRaises(ValueError):
                G["preflight"](roots,existing)
            with self.assertRaises(ValueError):
                G["preflight"](roots,base/"mk3"/"private")
            self.assertFalse((base/"mk3"/"private").exists())


if __name__=="__main__":
    unittest.main()
