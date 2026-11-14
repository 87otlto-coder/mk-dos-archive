#!/usr/bin/env python3
"""Source-only negative controls for original MK3 record-0 MCP read-request probe."""
from __future__ import annotations

import tempfile
from pathlib import Path
import time
import unittest

import r1_original_mcp_record0_probe as subject


def reg(eax=0x4200, ebx=5, ecx=0xA, edx=0x30DA):
    return {"EAX":eax, "EBX":ebx, "ECX":ecx, "EDX":edx, "DS":0x188,
            "CS":0x180, "EIP":0x26B090}


class MockStoppedChannel:
    def __init__(self, values: dict[str,int], step=True):
        self.values = values
        self.step = step
        self.calls = []

    def request(self, cmd):
        self.calls.append(cmd)
        if cmd.startswith("EXEC EV "):
            name = cmd.split()[-1]
            return ["EV of '"+name+"' is:", f"{self.values[name]:X}"]
        if cmd == "EXEC STEPIN":
            if not self.step:
                raise ValueError("P89 MCP preflight: debugger rejected request: requires the debugger to be stopped")
            return ["DEBUG: STEPIN CS:IP=0180:26B092 AX=4200 BX=0005 CX=000A DX=30DA"]
        raise AssertionError("unexpected command "+cmd)


class OriginalProbeTests(unittest.TestCase):
    def test_parse_live_ev_value(self):
        self.assertEqual(subject.parse_ev(["EV of 'EAX' is:", "4200"], "EAX"), 0x4200)

    def test_parse_register_expression_hex_prefix(self):
        self.assertEqual(subject.parse_ev(["EV of 'ECX' is:", "0xA"], "ECX"), 10)

    def test_empty_register_expression_refused(self):
        with self.assertRaises(ValueError):
            subject.parse_ev(["EV of 'EAX' is:", "not a register"], "EAX")

    def test_exact_original_seek_offset_witness(self):
        self.assertTrue(subject.is_p79_seek(reg()))
        self.assertEqual(subject.START, 667866)

    def test_seek_absolute_origin_required(self):
        self.assertFalse(subject.is_p79_seek(reg(eax=0x4201)))

    def test_seek_full_32bit_offset_required(self):
        self.assertFalse(subject.is_p79_seek(reg(ecx=0, edx=0x30DA)))

    def test_seek_substitute_offset_refused(self):
        self.assertFalse(subject.is_p79_seek(reg(edx=0x30DB)))

    def test_exact_record0_read_length_and_handle(self):
        r=reg(eax=0x3F41, ebx=5, ecx=0x5E2, edx=0x1234)
        self.assertTrue(subject.is_record0_read(r, 5))
        self.assertEqual(subject.P79_FIRST_PAYLOAD, 732662)

    def test_mismatched_file_handle_refused(self):
        self.assertFalse(subject.is_record0_read(
            reg(eax=0x3F41, ecx=0x5E2, ebx=6), 5))

    def test_nonread_operation_refused(self):
        self.assertFalse(subject.is_record0_read(
            reg(eax=0x4201, ecx=0x5E2), 5))

    def test_wrong_read_size_refused(self):
        self.assertFalse(subject.is_record0_read(
            reg(eax=0x3F00, ecx=1505), 5))

    def test_remote_stopped_state_is_verifiably_stepped(self):
        m=MockStoppedChannel(reg())
        result=subject.await_stopped(m, time.monotonic()+2)
        self.assertEqual(result["EIP"], 0x26B090)
        self.assertEqual(m.calls[-1], "EXEC STEPIN")
        self.assertEqual(len(m.calls), 8)

    def test_unsupported_successful_step_response_refused(self):
        class MalformedStep(MockStoppedChannel):
            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    return ["OK with no actual stopped state"]
                return super().request(cmd)
        with self.assertRaises(ValueError):
            subject.await_stopped(MalformedStep(reg()), time.monotonic()+2)

    def test_missing_release_stepin_is_precisely_reported(self):
        class OldDosboxStep(MockStoppedChannel):
            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    raise ValueError(
                        "P89 MCP preflight: debugger rejected request: "
                        "*** Debugger command not recognized"
                    )
                return super().request(cmd)
        with self.assertRaisesRegex(ValueError, "initial debugger not stopped or STEPIN unsupported"):
            subject.await_stopped(OldDosboxStep(reg()), time.monotonic()+2)

    def test_supported_stepin_generic_running_error_retries_after_bootstrap(self):
        class NotYetAtBreakpoint(MockStoppedChannel):
            def __init__(self, values):
                super().__init__(values)
                self.steps = 0

            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    self.steps += 1
                    if self.steps < 3:
                        raise ValueError(
                            "P89 MCP preflight: debugger rejected request: "
                            "*** Debugger command not recognized"
                        )
                return super().request(cmd)

        mock = NotYetAtBreakpoint(reg())
        result = subject.await_stopped(
            mock, time.monotonic() + 2,
            stepin_confirmed_for_session=True
        )
        self.assertEqual(result["EAX"], 0x4200)
        self.assertEqual(mock.steps, 3)

    def test_generic_running_error_never_retries_before_startup_stop(self):
        class RunningAtStartup(MockStoppedChannel):
            def __init__(self, values):
                super().__init__(values)
                self.attempts = 0

            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    self.attempts += 1
                    raise ValueError(
                        "P89 MCP preflight: debugger rejected request: "
                        "*** Debugger command not recognized"
                    )
                return super().request(cmd)

        mock = RunningAtStartup(reg())
        with self.assertRaisesRegex(ValueError, "original-game session must"):
            subject.await_stopped(mock, time.monotonic() + 2)
        self.assertEqual(mock.attempts, 1)

    def test_supported_stepin_running_past_deadline_fails_closed(self):
        class NeverStops(MockStoppedChannel):
            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    raise ValueError(
                        "P89 MCP preflight: debugger rejected request: "
                        "*** Debugger command not recognized"
                    )
                return super().request(cmd)
        with self.assertRaisesRegex(ValueError, "no verified breakpoint stop"):
            subject.await_stopped(
                NeverStops(reg()), time.monotonic() + 0.02,
                stepin_confirmed_for_session=True
            )

    def test_supported_stepin_other_command_error_never_retried(self):
        class UnrelatedFailure(MockStoppedChannel):
            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    raise ValueError("network protocol mismatch")
                return super().request(cmd)
        with self.assertRaisesRegex(ValueError, "network protocol mismatch"):
            subject.await_stopped(
                UnrelatedFailure(reg()), time.monotonic() + 2,
                stepin_confirmed_for_session=True
            )

    def test_nonrunning_step_error_refused(self):
        class UnexpectedStepError(MockStoppedChannel):
            def request(self, cmd):
                if cmd == "EXEC STEPIN":
                    raise ValueError("unexpected emulator command")
                return super().request(cmd)
        with self.assertRaises(ValueError):
            subject.await_stopped(UnexpectedStepError(reg()), time.monotonic()+2)

    def test_private_fixture_guard_rejects_unfingerprinted_copy(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/"VALIDATION"
            game=root/"P89-R1-MK3-DEBUG-COPY"
            out=root/"P89-R1-TEST"
            game.mkdir(parents=True)
            out.mkdir()
            (game/"IMAGE").mkdir()
            (game/"IMAGE"/"MK3.CUE").write_bytes(b"fake")
            (game/"IMAGE"/"MK3.GOG").write_bytes(b"fake")
            (game/"MK3.EXE").write_bytes(b"fake")
            (game/"DATA.MK3").write_bytes(b"fake")
            with self.assertRaises(ValueError):
                subject.require_original_debug_copy(game, out, root)

    def test_validation_folder_not_original_game_copy(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/"VALIDATION"
            game=root/"P89-R1-MK3-DEBUG-COPY"
            game.mkdir(parents=True)
            with self.assertRaises(ValueError):
                subject.require_original_debug_copy(game, game, root)


if __name__ == "__main__":
    unittest.main(verbosity=2)
