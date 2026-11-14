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
