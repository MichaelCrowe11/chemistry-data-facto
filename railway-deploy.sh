#!/usr/bin/env bash
set -euo pipefail

# Railway CLI end-to-end setup for a 2-service deploy:
# - backend: FastAPI from ./backend
# - frontend: Vite build + nginx from repo root
#
# Usage:
#   ./railway-deploy.sh
#
# Notes:
# - `railway login` is interactive unless you use a token.
# - This script tries to auto-detect the backend public URL after deploy.

BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME:-backend}
FRONTEND_SERVICE_NAME=${FRONTEND_SERVICE_NAME:-frontend}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

if ! need_cmd railway; then
  echo "railway CLI not found. Installing via npm..."
  if ! need_cmd npm; then
    echo "Error: npm is required to install @railway/cli (or install Railway CLI another way)." >&2
    exit 1
  fi
  npm i -g @railway/cli
fi

echo "Logging in to Railway (may open a browser)..."
railway login

echo "Initializing/linking Railway project (interactive if not linked yet)..."
railway init

echo "Creating services (ok if they already exist)..."
railway service create "$BACKEND_SERVICE_NAME" || true
railway service create "$FRONTEND_SERVICE_NAME" || true

echo "Deploying backend service..."
(
  cd backend
  railway up --service "$BACKEND_SERVICE_NAME"
)

echo "Attempting to detect backend public URL from Railway status..."
# Best-effort: parse first https:// URL mentioned in status output.
BACKEND_PUBLIC_BASE=""
STATUS_OUT=$(railway status --service "$BACKEND_SERVICE_NAME" 2>/dev/null || railway status 2>/dev/null || true)
if [[ -n "${STATUS_OUT}" ]]; then
  BACKEND_PUBLIC_BASE=$(printf "%s" "$STATUS_OUT" | grep -Eo 'https://[^ ]+' | head -n 1 || true)
fi

if [[ -z "${BACKEND_PUBLIC_BASE}" ]]; then
  echo "Could not auto-detect the backend URL." >&2
  echo "Run: railway status" >&2
  echo "Then set VITE_API_URL for the frontend service to: https://<backend-domain>/api/v1" >&2
  echo "Example: railway variables set VITE_API_URL=\"https://<backend>.up.railway.app/api/v1\" --service ${FRONTEND_SERVICE_NAME}" >&2
  read -r -p "Paste backend public base URL (e.g. https://xxxx.up.railway.app): " BACKEND_PUBLIC_BASE
fi

# Normalize: remove trailing slash
BACKEND_PUBLIC_BASE=${BACKEND_PUBLIC_BASE%/}
BACKEND_API_URL="${BACKEND_PUBLIC_BASE}/api/v1"

echo "Setting frontend runtime variable VITE_API_URL=${BACKEND_API_URL}"
railway variables set VITE_API_URL="$BACKEND_API_URL" --service "$FRONTEND_SERVICE_NAME"

echo "Deploying frontend service..."
railway up --service "$FRONTEND_SERVICE_NAME"

echo
echo "Done. Verify:"
echo "- Backend:   ${BACKEND_PUBLIC_BASE}/health"
echo "- Backend:   ${BACKEND_API_URL}/stats"
echo "- Frontend:  (see railway status for the frontend domain)"
