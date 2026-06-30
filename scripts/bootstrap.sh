#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

pnpm install
pnpm infra:up
pnpm db:generate

printf '
OrderFlow foundation is ready. Run: pnpm dev
'
