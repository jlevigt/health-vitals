#!/usr/bin/env bash
set -euo pipefail

# Deploys API + Worker to Fly.io using secrets from .env.production (gitignored).
# Run from repo root: ./infra/fly/deploy.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ENV_FILE:-.env.production}"

if ! command -v fly >/dev/null 2>&1; then
  echo "❌ 'fly' CLI not found. Ensure ~/.fly/bin is in your PATH."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "❌ ${ENV_FILE} not found. Create it with your production secrets first."
  exit 1
fi

while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  export "${key}=${val}"
done < "${ENV_FILE}"

ensure_app() {
  local config="$1"
  local app_name
  app_name=$(awk -F'"' '/^app[[:space:]]*=/{print $2; exit}' "${config}")
  if ! fly status --app "${app_name}" >/dev/null 2>&1; then
    echo "🆕 Creating Fly app '${app_name}'..."
    fly apps create "${app_name}"
  else
    echo "✓ Fly app '${app_name}' exists."
  fi
}

ensure_app "infra/fly/api.toml"
ensure_app "infra/fly/worker.toml"

echo "🔐 Syncing secrets to health-vitals-api..."
fly secrets set --app health-vitals-api --stage \
  DATABASE_URL="${DATABASE_URL}" \
  RABBITMQ_URL="${RABBITMQ_URL}" \
  STORAGE_ENDPOINT="${STORAGE_ENDPOINT}" \
  STORAGE_REGION="${STORAGE_REGION}" \
  STORAGE_ACCESS_KEY="${STORAGE_ACCESS_KEY}" \
  STORAGE_SECRET_KEY="${STORAGE_SECRET_KEY}" \
  SECRET_JWT_KEY="${SECRET_JWT_KEY}" \
  WEB_URL="${WEB_URL:-https://binderlex.com}" \
  MAIL_PROVIDER="${MAIL_PROVIDER:-resend}" \
  RESEND_API_KEY="${RESEND_API_KEY:-}"

echo "🔐 Syncing secrets to health-vitals-worker..."
fly secrets set --app health-vitals-worker --stage \
  DATABASE_URL="${DATABASE_URL}" \
  RABBITMQ_URL="${RABBITMQ_URL}" \
  STORAGE_ENDPOINT="${STORAGE_ENDPOINT}" \
  STORAGE_REGION="${STORAGE_REGION}" \
  STORAGE_ACCESS_KEY="${STORAGE_ACCESS_KEY}" \
  STORAGE_SECRET_KEY="${STORAGE_SECRET_KEY}" \
  GEMINI_API_KEY="${GEMINI_API_KEY}" \
  SECRET_JWT_KEY="${SECRET_JWT_KEY:-not-in-use-secret-jwt-key}"

echo "🚀 Deploying health-vitals-api..."
fly deploy --ha=false --config infra/fly/api.toml --dockerfile apps/api/Dockerfile .

echo "🚀 Deploying health-vitals-worker..."
fly deploy --ha=false --config infra/fly/worker.toml --dockerfile apps/worker/Dockerfile .

echo "✅ Fly.io deployment complete!"
