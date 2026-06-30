# OrderFlow

OrderFlow is a production-oriented flash-sale commerce platform built as a modular monolith.
The project focuses on inventory consistency, idempotent checkout, reliable asynchronous
processing and dynamic permission-based RBAC.

## Applications

| Workspace         | Purpose                    | Default port |
| ----------------- | -------------------------- | ------------ |
| `apps/storefront` | Customer web application   | `3000`       |
| `apps/admin`      | Administration application | `3001`       |
| `apps/api`        | NestJS HTTP API            | `4000`       |
| `apps/worker`     | Background jobs            | No HTTP port |

## Core stack

- Node.js 24 LTS
- pnpm workspace and Turborepo
- Next.js App Router, HeroUI and next-intl
- NestJS
- PostgreSQL, Prisma, Redis and MinIO
- TypeScript strict mode

## First run

```bash
cp .env.example .env
pnpm install
pnpm infra:up
pnpm db:generate
pnpm dev
```

Open:

- Storefront: `http://localhost:3000/vi`
- Admin: `http://localhost:3001/vi`
- API health: `http://localhost:4000/api/v1/health`
- Swagger: `http://localhost:4000/docs`
- MinIO Console: `http://localhost:9001`

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## Current scope

Sprint 0 establishes the repository, applications, shared packages, infrastructure and agent
contracts. Authentication and Dynamic RBAC are implemented in the next sprint.

Read `AGENTS.md` before using Codex or another coding agent in this repository.
