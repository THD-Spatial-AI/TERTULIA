#!/usr/bin/env bash
# Creates all required GitHub labels for the feedback pipeline.
# Run once after creating the GitHub repo (safe to re-run — skips existing labels).
#
# Usage:
#   GITHUB_TOKEN=github_pat_... \
#   GITHUB_REPO=THD-Spatial-AI/Storcito-Wildfire \
#   WORKSHOP_TAG=workshop-2026-munich \
#   bash create_labels.sh

set -euo pipefail

: "${GITHUB_TOKEN:?Set GITHUB_TOKEN}"
: "${GITHUB_REPO:?Set GITHUB_REPO}"
: "${WORKSHOP_TAG:=workshop-2026-munich}"

API="https://api.github.com/repos/$GITHUB_REPO/labels"
AUTH="Authorization: Bearer $GITHUB_TOKEN"
ACCEPT="Accept: application/vnd.github+json"
VERSION="X-GitHub-Api-Version: 2022-11-28"

create_label() {
  local name="$1" color="${2#\#}"  # strip leading #
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API" \
    -H "$AUTH" -H "$ACCEPT" -H "$VERSION" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"color\":\"$color\"}")
  case "$status" in
    201) echo "  created  $name" ;;
    422) echo "  exists   $name (skipped)" ;;
    *)   echo "  ERROR $status  $name" ;;
  esac
}

echo "==> Scope labels"
create_label "scope::ui"          "#0075ca"
create_label "scope::map"         "#008672"
create_label "scope::data"        "#e4e669"
create_label "scope::performance" "#d93f0b"

echo "==> Type labels"
create_label "type::bug"      "#d73a4a"
create_label "type::feature"  "#a2eeef"
create_label "type::question" "#cfd3d7"
create_label "type::praise"   "#7057ff"

echo "==> Priority labels"
create_label "priority::critical" "#b60205"
create_label "priority::high"     "#e11d48"
create_label "priority::medium"   "#f59e0b"
create_label "priority::low"      "#6b7280"

echo "==> Workshop label"
create_label "$WORKSHOP_TAG" "#5319e7"

echo ""
echo "Done. All labels are ready in $GITHUB_REPO."
