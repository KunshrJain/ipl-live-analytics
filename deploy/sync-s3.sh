#!/usr/bin/env bash
# Usage: deploy/sync-s3.sh <bucket> [cloudfront-distribution-id]
set -euo pipefail
BUCKET="${1:?bucket name required}"
cd "$(dirname "$0")/.."
aws s3 sync . "s3://$BUCKET" --delete \
  --exclude ".git/*" --exclude "deploy/*" --exclude "docs/*" --exclude "README.md" --exclude ".gitignore" \
  --cache-control "max-age=300"
# config.js should not be cached long so the backend owner can change it quickly
aws s3 cp js/config.js "s3://$BUCKET/js/config.js" --cache-control "no-cache"
[ -n "${2:-}" ] && aws cloudfront create-invalidation --distribution-id "$2" --paths "/*"
echo "Deployed to s3://$BUCKET"
