"""Keep the newest three successful browser uploads. Run only from the default branch."""
import json
import os
import re
import subprocess
import sys
import time

NAME = "mk-dos-p11-browser-build"
WORKFLOW = ".github/workflows/p11-build-smoke.yml"
UPLOAD_STEP = "Upload verified static build (no original game assets)"


def api(path, *, pages=False, delete=False):
    command = ["gh", "api", f"repos/{os.environ['GITHUB_REPOSITORY']}/actions/{path}"]
    if pages:
        command.extend(["--paginate", "--slurp"])
    if delete:
        command.extend(["--method", "DELETE"])
    result = subprocess.check_output(command)
    return json.loads(result) if result.strip() else None


def active(artifact):
    return artifact["name"] == NAME and artifact["expired"] is False


def verify(artifact):
    if not (artifact["size_in_bytes"] > 0 and re.fullmatch(r"sha256:[0-9a-f]{64}", artifact["digest"] or "")):
        raise ValueError(f"Missing size or digest for artifact {artifact['id']}")


def successful(run):
    return (run["path"] == WORKFLOW and run["event"] in ("push", "workflow_dispatch")
            and run["head_repository"]["full_name"] == os.environ["GITHUB_REPOSITORY"]
            and run["status"] == "completed" and run["conclusion"] == "success")


def uploaded(run):
    if not successful(run):
        return None
    attempt = f"runs/{run['id']}/attempts/{run['run_attempt']}"
    jobs = api(f"{attempt}/jobs?per_page=100", pages=True)
    if not any(step["name"] == UPLOAD_STEP and step["conclusion"] == "success"
               for page in jobs for job in page["jobs"] for step in job["steps"]):
        return None
    pages = api(f"runs/{run['id']}/artifacts?per_page=100", pages=True)
    matches = [a for page in pages for a in page["artifacts"] if active(a)]
    if len(matches) != 1:
        raise ValueError("Expected one active browser artifact after upload")
    verify(matches[0])
    return matches[0]["id"]


def browser_pages():
    return api(f"artifacts?name={NAME}&per_page=100", pages=True)


def prune(run, uploaded_id):
    pages = browser_pages()
    eligible = {}
    for page in pages:
        for artifact in page["artifacts"]:
            if not active(artifact):
                continue
            source = artifact["workflow_run"]
            producer = api(f"runs/{source['id']}")
            if not successful(producer) or producer["head_sha"] != source["head_sha"]:
                continue
            verify(artifact)
            eligible[artifact["id"]] = artifact
    witness = eligible.get(uploaded_id)
    if not witness or witness["workflow_run"]["id"] != run["id"] or witness["workflow_run"]["head_sha"] != run["head_sha"]:
        raise ValueError("Verified upload missing from repository inventory")
    ordered = sorted(eligible.values(), key=lambda a: (a["created_at"], a["id"]), reverse=True)
    print("Keeping", [a["id"] for a in ordered[:3]], flush=True)
    for artifact in reversed(ordered[3:]):
        current = api(f"artifacts/{artifact['id']}")
        fields = ("id", "name", "digest", "size_in_bytes", "created_at", "workflow_run")
        if not active(current) or any(current[k] != artifact[k] for k in fields):
            raise ValueError("Deletion candidate changed since inventory")
        print("Deleting older successful browser build", current["id"], current["digest"], flush=True)
        api(f"artifacts/{current['id']}", delete=True)
    reconcile(ordered)


def reconcile(ordered, *, attempts=10, pause_seconds=2):
    """Wait for GitHub's post-delete artifact list to reflect accepted DELETEs.

    Never issue a second deletion during a retry. Require the original retained
    IDs to stay visible and every exact deleted ID to disappear. A permanently
    inconsistent inventory must still fail the job.
    """
    kept = {a["id"] for a in ordered[:3]}
    deleted = {a["id"] for a in ordered[3:]}
    if attempts < 1:
        raise ValueError("At least one inventory reconciliation attempt is required")
    for attempt in range(1, attempts + 1):
        remaining = {a["id"] for page in browser_pages() for a in page["artifacts"] if active(a)}
        stale_deleted = deleted & remaining
        missing_kept = kept - remaining
        if not stale_deleted and not missing_kept:
            print("Verified retained IDs and deletions against fresh inventory", flush=True)
            return
        print(f"Artifact inventory not reconciled (attempt {attempt}/{attempts}): "
              f"deleted still listed={sorted(stale_deleted)}; "
              f"retained missing={sorted(missing_kept)}", flush=True)
        if attempt < attempts:
            time.sleep(pause_seconds)
    raise ValueError("Retained and deleted IDs did not reconcile after bounded retries")


if __name__ == "__main__":
    with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as event_file:
        run = json.load(event_file)["workflow_run"]
    if sys.argv[1] == "verify":
        artifact_id = uploaded(run)
        if artifact_id:
            with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
                print(f"artifact_id={artifact_id}", file=output)
    elif sys.argv[1] == "prune":
        prune(run, int(os.environ["UPLOADED_ID"]))
