#!/usr/bin/env bash
# Usage: deploy/sync-s3.sh <bucket> [cloudfront-distribution-id]
set -euo pipefail
BUCKET="${1:?bucket name required}"
cd "$(dirname "$0")/.."
npm ci
npm run build
aws s3 sync dist "s3://$BUCKET" --delete --cache-control "max-age=300"
# config.js should not be cached long so the backend owner can change it quickly
aws s3 cp dist/config.js "s3://$BUCKET/config.js" --cache-control "no-cache"
[ -n "${2:-}" ] && aws cloudfront create-invalidation --distribution-id "$2" --paths "/*"
echo "Deployed to s3://$BUCKET"
