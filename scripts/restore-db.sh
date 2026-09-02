#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=RESTORE to confirm database replacement}"
[ "$CONFIRM_RESTORE" = "RESTORE" ] || { echo "Restore confirmation did not match" >&2; exit 2; }
[ -f "$BACKUP_FILE" ] || { echo "BACKUP_FILE does not exist" >&2; exit 2; }
[ -f "$BACKUP_FILE.sha256" ] && (cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$BACKUP_FILE").sha256")
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" "$BACKUP_FILE"
