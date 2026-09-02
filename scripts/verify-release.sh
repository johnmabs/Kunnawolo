#!/usr/bin/env sh
set -eu

pnpm prisma:generate
pnpm db:migrate:deploy
pnpm lint
pnpm typecheck
pnpm test -- --maxWorkers=1
pnpm build
pnpm db:migrate:status
