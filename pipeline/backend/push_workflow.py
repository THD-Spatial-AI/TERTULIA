#!/usr/bin/env python3
"""One-time script: push the workshop-report GitHub Actions workflow to the Wildfire repo.

Run from inside the pipeline/backend directory:
    python push_workflow.py
"""
import os
import pathlib
from dotenv import load_dotenv

load_dotenv()

import github_integration

WORKFLOW_PATH = pathlib.Path(__file__).parent.parent / "github-workflows" / "workshop-report.yml"


def main():
    if not WORKFLOW_PATH.exists():
        print(f"ERROR: workflow file not found at {WORKFLOW_PATH}")
        return 1

    content = WORKFLOW_PATH.read_text(encoding="utf-8")
    repo = os.environ.get("GITHUB_REPO", "")
    token = os.environ.get("GITHUB_TOKEN", "")

    if not repo or not token:
        print("ERROR: GITHUB_REPO or GITHUB_TOKEN not set in .env")
        return 1

    print(f"Pushing .github/workflows/workshop-report.yml → {repo} ...")
    ok = github_integration.push_workflow_file(content)
    if ok:
        print(f"Done! Visit https://github.com/{repo}/actions to find the workflow.")
        print("Add WORKSHOP_TOKEN as a repository secret before running it.")
    else:
        print("Failed. Check your token permissions (needs repo write access).")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
