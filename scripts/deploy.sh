#!/usr/bin/env bash
#
# deploy.sh — build the SPA and deploy it to Cloudflare Pages, with every
# downloadable artefact (deck, study guide, demo card, diagram pack and the
# screenshots) served from /downloads/ on the same origin.
#
# The Vite build clears dist/, so the downloads are copied in AFTER the build.
#
# Usage:
#   ./scripts/deploy.sh [pages-branch]
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"
cd "$ROOT"

echo "==> building the SPA"
npm run build

echo "==> collecting downloadable artefacts"
mkdir -p dist/downloads
cp dist-deliverables/GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx dist/downloads/
cp dist-deliverables/GreenToken-Verifiable-Carbon-Tokens-Unit5.pdf  dist/downloads/
cp dist-deliverables/GreenToken-Fabric-Guide.pdf                  dist/downloads/
cp dist-deliverables/GreenToken-Fabric-Diagrams.pdf               dist/downloads/
cp dist-deliverables/DEMO-CARD.pdf                                dist/downloads/
cp dist-deliverables/GreenToken-Case-Study-21CSE435T.pdf         dist/downloads/
cp dist-deliverables/GreenToken-Case-Study-21CSE435T.docx        dist/downloads/
cp dist-deliverables/Hyperledger-Fabric-First-Principles.pdf      dist/downloads/
cp dist-deliverables/GreenToken-The-Tree-That-Was-Sold-Twice.pptx  dist/downloads/
cp dist-deliverables/GreenToken-The-Tree-That-Was-Sold-Twice.pdf   dist/downloads/
cp docs/diagrams.html                                             dist/downloads/
cp docs/guide.html                                                dist/downloads/
cp docs/screenshots/*.png                                         dist/downloads/

echo "==> deploying to Cloudflare Pages (branch: $BRANCH)"
npx wrangler pages deploy dist --project-name greentoken --branch "$BRANCH" --commit-dirty=true

echo
echo "==> verifying"
for f in GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx GreenToken-Fabric-Guide.pdf \
         GreenToken-Fabric-Diagrams.pdf DEMO-CARD.pdf GreenToken-Case-Study-21CSE435T.pdf \
         Hyperledger-Fabric-First-Principles.pdf GreenToken-The-Tree-That-Was-Sold-Twice.pptx; do
  code="$(curl -s -o /dev/null -w '%{http_code} %{size_download}' \
    "https://greentoken-7gc.pages.dev/downloads/$f")"
  echo "    $f -> $code"
done
echo "    app -> $(curl -s -o /dev/null -w '%{http_code}' https://greentoken-7gc.pages.dev)"
