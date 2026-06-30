# Development Commands

Run commands from the repository root unless stated otherwise.

## Install

```bash
pnpm install
```

## Start Infrastructure

```bash
docker compose up -d
```

The repository may also expose a package script for infrastructure:

```bash
pnpm infra:up
```

## Start All Applications

```bash
pnpm dev
```

## Start Individual Applications

```bash
pnpm --filter @orderflow/api dev
pnpm --filter @orderflow/worker dev
pnpm --filter @orderflow/storefront dev
pnpm --filter @orderflow/admin dev
```

## Formatting

```bash
pnpm format
pnpm format:check
```

## Lint

```bash
pnpm lint
```

## Type Checking

```bash
pnpm typecheck
```

## Tests

```bash
pnpm test
pnpm test:unit
pnpm test:integration
```

## Build

```bash
pnpm build
```

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:dev
pnpm db:seed
pnpm db:studio
```

## Infrastructure Logs

```bash
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f minio
```

## Validation Before Commit

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
