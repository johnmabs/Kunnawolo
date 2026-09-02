#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"
case "$BACKUP_DIR" in /*) ;; *) echo "BACKUP_DIR must be an absolute path" >&2; exit 2;; esac
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$BACKUP_DIR/kunnawolo-$timestamp.dump"
temporary="$archive.tmp"
pg_dump --format=custom --no-owner --file "$temporary" "$DATABASE_URL"
mv "$temporary" "$archive"
sha256sum "$archive" > "$archive.sha256"
printf '%s\n' "$archive"
