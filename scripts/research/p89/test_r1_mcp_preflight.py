#!/usr/bin/env python3
"""Synthetic localhost-only MCP protocol controls; no DOSBox-X or games."""
import socket
import threading
import unittest

import r1_mcp_preflight as subject


def simulate(reply_plan):
    local, remote = socket.socketpair()
    result = []

    def responder():
        with remote:
            reader = remote.makefile("rb")
            for expected, response in reply_plan:
                command = reader.readline().decode("ascii").strip()
                result.append(command)
                if command != expected:
                    break
                remote.sendall(response.encode("utf8"))

    worker = threading.Thread(target=responder, daemon=True)
    worker.start()
    return local, worker, result


class MCPTests(unittest.TestCase):
    def test_positive_ping_and_stopped_ev(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEAX=00000000\nEND 2\n"),
        ])
        with peer:
            result = subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)
        self.assertTrue(result["pingVerified"])
        self.assertFalse(result["originalDataReadOrDecoded"])
        self.assertEqual(requests, ["REQ 1 PING", "REQ 2 EXEC EV EAX"])

    def test_remote_run_break_return_to_stopped_state(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC RUN", "BEGIN 3 OK\nEND 3\n"),
            ("REQ 4 BREAK", "BEGIN 4 OK\nEND 4\n"),
            ("REQ 5 EXEC EV EAX", "BEGIN 5 OK\nEV of 'EAX' is:\n5\nEND 5\n"),
        ])
        with peer:
            result = subject.probe_protocol(
                subject.Control(peer), exercise_resume=True
            )
        worker.join(timeout=1)
        self.assertTrue(result["runAcknowledged"])
        self.assertTrue(result["remoteBreakAcknowledged"])
        self.assertTrue(result["registerAfterBreakVerified"])
        self.assertFalse(result["originalGameMounted"])
        self.assertEqual(requests[-3:], [
            "REQ 3 EXEC RUN", "REQ 4 BREAK", "REQ 5 EXEC EV EAX",
        ])

    def test_remote_break_failure_is_fail_closed(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC RUN", "BEGIN 3 OK\nEND 3\n"),
            ("REQ 4 BREAK", "BEGIN 4 ERR\nnot supported\nEND 4\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer), exercise_resume=True)
        worker.join(timeout=1)
        self.assertEqual(requests[-1], "REQ 4 BREAK")

    def test_postbreak_missing_register_refused(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC RUN", "BEGIN 3 OK\nEND 3\n"),
            ("REQ 4 BREAK", "BEGIN 4 OK\nEND 4\n"),
            ("REQ 5 EXEC EV EAX", "BEGIN 5 OK\nnot stopped\nEND 5\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer), exercise_resume=True)
        worker.join(timeout=1)
        self.assertEqual(requests[-1], "REQ 5 EXEC EV EAX")

    def test_source_reader_commands_probed_with_no_game(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC STEPIN",
             "BEGIN 3 OK\nDEBUG: STEPIN CS:IP=0000:0001 AX=0000 BX=0000 CX=0000 DX=0000\nEND 3\n"),
            ("REQ 4 EXEC BPDEL *", "BEGIN 4 OK\nDEBUG: Breakpoints deleted.\nEND 4\n"),
            ("REQ 5 EXEC BPINT 21 42",
             "BEGIN 5 OK\nDEBUG: Set interrupt breakpoint at INT 21 AH=42\nEND 5\n"),
            ("REQ 6 EXEC BPLIST",
             "BEGIN 6 OK\nBreakpoint list:\n00. BPINT 21 AH=42\nEND 6\n"),
            ("REQ 7 EXEC BPDEL *", "BEGIN 7 OK\nDEBUG: Breakpoints deleted.\nEND 7\n"),
        ])
        with peer:
            result = subject.probe_protocol(
                subject.Control(peer), exercise_step_commands=True
            )
        worker.join(timeout=1)
        self.assertTrue(result["originalProbeCommandSetVerified"])
        self.assertEqual(result["originalProbeCommandsChecked"],
                         ["STEPIN", "BPDEL *", "BPINT 21 42", "BPLIST", "BPDEL *"])
        self.assertFalse(result["originalGameMounted"])
        self.assertFalse(result["originalDataReadOrDecoded"])
        self.assertEqual(requests[-1], "REQ 7 EXEC BPDEL *")

    def test_actual_2026_10_release_missing_stepin_is_diagnosed(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC STEPIN",
             "BEGIN 3 ERR\n*** Debugger command not recognized\nEND 3\n"),
        ])
        with peer, self.assertRaisesRegex(ValueError, "EXEC STEPIN unavailable"):
            subject.probe_protocol(subject.Control(peer),
                                   exercise_step_commands=True)
        worker.join(timeout=1)
        self.assertEqual(requests[-1], "REQ 3 EXEC STEPIN")

    def test_empty_stepin_response_cannot_pass_capability_gate(self):
        peer, worker, requests = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEV of 'EAX' is:\n0\nEND 2\n"),
            ("REQ 3 EXEC STEPIN", "BEGIN 3 OK\nEND 3\n"),
        ])
        with peer, self.assertRaisesRegex(ValueError, "verified post-step"):
            subject.probe_protocol(subject.Control(peer),
                                   exercise_step_commands=True)
        worker.join(timeout=1)

    def test_missing_pong_rejected(self):
        peer, worker, _ = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nNOT_PONG\nEND 1\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)

    def test_wrong_response_id_rejected(self):
        peer, worker, _ = simulate([
            ("REQ 1 PING", "BEGIN 7 OK\nPONG\nEND 7\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)

    def test_protocol_error_rejected(self):
        peer, worker, _ = simulate([
            ("REQ 1 PING", "BEGIN 1 ERR\nno support\nEND 1\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)

    def test_missing_end_rejected(self):
        peer, worker, _ = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)

    def test_no_ev_output_rejected(self):
        peer, worker, _ = simulate([
            ("REQ 1 PING", "BEGIN 1 OK\nPONG\nEND 1\n"),
            ("REQ 2 EXEC EV EAX", "BEGIN 2 OK\nEND 2\n"),
        ])
        with peer, self.assertRaises(ValueError):
            subject.probe_protocol(subject.Control(peer))
        worker.join(timeout=1)

    def test_control_rejects_newline_in_commands(self):
        peer, worker, _ = simulate([])
        with peer, self.assertRaises(ValueError):
            subject.Control(peer).request("PING\nBREAK")
        worker.join(timeout=1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
