#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Foldexa DiffAb — Optimized build & push script
# Mac ARM → linux/amd64  (RunPod GPU compatible)
#
# Usage:
#   ./build.sh           → builds & pushes with registry cache (fast)
#   ./build.sh --no-push → builds locally only (for testing)
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

IMAGE="kanseu/foldexa-diffab"
TAG="v1.9.1"
CACHE_REF="${IMAGE}:buildcache"
DOCKERFILE="Dockerfile.diffab"

PUSH=true
if [[ "${1:-}" == "--no-push" ]]; then
  PUSH=false
fi

# ── 1. Ensure buildx builder exists for linux/amd64 ─────────────
if ! docker buildx inspect foldexa-builder &>/dev/null; then
  echo "→ Creating buildx builder..."
  docker buildx create --name foldexa-builder \
    --driver docker-container \
    --platform linux/amd64 \
    --use
else
  docker buildx use foldexa-builder
fi

# ── 2. Build ─────────────────────────────────────────────────────
echo "→ Building ${IMAGE}:${TAG} for linux/amd64..."

BUILD_ARGS=(
  --platform linux/amd64
  --file "${DOCKERFILE}"
  --tag  "${IMAGE}:${TAG}"
  --tag  "${IMAGE}:latest"
  # Pull layer cache from registry — zero local disk usage
  --cache-from "type=registry,ref=${CACHE_REF}"
  --cache-to   "type=registry,ref=${CACHE_REF},mode=max"
)

if [ "$PUSH" = true ]; then
  BUILD_ARGS+=(--push)
  echo "→ Will push to Docker Hub on success."
else
  BUILD_ARGS+=(--load)
  echo "→ --no-push: loading image locally."
fi

docker buildx build "${BUILD_ARGS[@]}" .

echo ""
echo "✓ Done: ${IMAGE}:${TAG}"
if [ "$PUSH" = true ]; then
  echo "✓ Pushed to Docker Hub. Update RunPod endpoint to: ${IMAGE}:${TAG}"
fi
