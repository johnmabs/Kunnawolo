#!/bin/sh
set -eu

: "${APP_URL:?APP_URL is required}"
: "${INVITATION_DELIVERY_CRON_SECRET:?INVITATION_DELIVERY_CRON_SECRET is required}"

curl --fail --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${INVITATION_DELIVERY_CRON_SECRET}" \
  "${APP_URL%/}/api/internal/invitation-deliveries"
