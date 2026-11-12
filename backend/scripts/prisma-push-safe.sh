#!/usr/bin/env bash
set -euo pipefail

backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
schema_path="$backend_dir/prisma/schema.prisma"

if [[ ! -f "$schema_path" ]]; then
  printf 'Prisma schema was not found: %s\n' "$schema_path" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" && ! -f "$backend_dir/.env" ]]; then
  printf 'DATABASE_URL is unset and backend/.env was not found. Configure the database connection first.\n' >&2
  exit 1
fi

printf '%s\n' 'Syncing Prisma schema without force-reset or accept-data-loss flags.'
printf '%s\n' 'If Prisma requires destructive changes, it will not receive confirmation and the sync will stop.'

cd "$backend_dir"
npx prisma db push --schema "$schema_path" </dev/null
