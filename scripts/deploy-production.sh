#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_DIRECTORY="/opt/taskflow"
readonly COMPOSE_FILE="${REPOSITORY_DIRECTORY}/compose.production.yaml"
readonly ENV_FILE="${REPOSITORY_DIRECTORY}/apps/api/.env.production"
readonly HEALTH_URL="http://127.0.0.1:3000/api/v1/health"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: This deployment script must run as root."
  exit 1
fi

if [[ "$#" -ne 1 ]]; then
  echo "Usage: $0 ghcr.io/zebishah/taskflow-og-api:<commit-sha>"
  exit 1
fi

readonly NEW_IMAGE="$1"

if [[ ! "${NEW_IMAGE}" =~ ^ghcr\.io/zebishah/taskflow-og-api:[0-9a-f]{40}$ ]]; then
  echo "ERROR: Image must use a complete 40-character Git commit SHA."
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" || ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: Production files are missing."
  exit 1
fi

if [[ "$(stat -c '%a' "${ENV_FILE}")" != "600" ]]; then
  echo "ERROR: ${ENV_FILE} must have permission 600."
  exit 1
fi

cd "${REPOSITORY_DIRECTORY}"

CURRENT_CONTAINER_ID="$(docker compose --file "${COMPOSE_FILE}" ps --quiet api 2>/dev/null || true)"
PREVIOUS_IMAGE=""

if [[ -n "${CURRENT_CONTAINER_ID}" ]]; then
  PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "${CURRENT_CONTAINER_ID}" 2>/dev/null || true)"
fi

rollback() {
  local exit_code="$?"
  echo "Deployment failed."

  if [[ -n "${PREVIOUS_IMAGE}" && "${PREVIOUS_IMAGE}" != "${NEW_IMAGE}" ]]; then
    TASKFLOW_API_IMAGE="${PREVIOUS_IMAGE}" \
      docker compose --file "${COMPOSE_FILE}" \
        up --detach --no-build --remove-orphans api worker
  fi

  exit "${exit_code}"
}

trap rollback ERR

docker pull "${NEW_IMAGE}"

TASKFLOW_API_IMAGE="${NEW_IMAGE}" \
  docker compose --file "${COMPOSE_FILE}" --profile tools \
    run --rm --no-deps migration

TASKFLOW_API_IMAGE="${NEW_IMAGE}" \
  docker compose --file "${COMPOSE_FILE}" \
    up --detach --no-build --remove-orphans api worker

health_check_passed="false"

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 10 "${HEALTH_URL}" >/dev/null; then
    health_check_passed="true"
    break
  fi

  echo "Health attempt ${attempt}/30 failed; retrying..."
  sleep 2
done

if [[ "${health_check_passed}" != "true" ]]; then
  docker compose --file "${COMPOSE_FILE}" logs --tail 100 api worker
  false
fi

trap - ERR
docker compose --file "${COMPOSE_FILE}" ps
curl --fail-with-body --silent --show-error "${HEALTH_URL}"
echo
docker image prune --force
echo "Deployment completed successfully: ${NEW_IMAGE}"
