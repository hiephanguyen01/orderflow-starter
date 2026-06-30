# OrderFlow Agent Guide

## Project

OrderFlow is a production-oriented flash-sale commerce platform.

Its critical engineering goals are:

- prevent inventory overselling;
- prevent duplicate orders and payments;
- support temporary inventory reservations;
- support runtime-configurable RBAC;
- maintain auditable state transitions;
- process asynchronous work reliably.

## Repository

This repository is a pnpm and Turborepo monorepo.

Applications:

- `apps/api`: NestJS HTTP API;
- `apps/worker`: background workers;
- `apps/storefront`: customer Next.js application;
- `apps/admin`: administration Next.js application.

Shared packages:

- `packages/ui`: shared HeroUI presentation components;
- `packages/api-client`: typed Axios client;
- `packages/shared-types`: cross-workspace contracts;
- `packages/typescript-config`: shared TypeScript configuration.

## Required Reading

Before changing code, read the relevant documents:

- Overall architecture: `ARCHITECTURE.md`
- Business rules: `docs/product/business-rules.md`
- Module boundaries: `docs/architecture/module-boundaries.md`
- Coding standards: `docs/standards/coding.md`
- Backend standards: `docs/standards/backend.md`
- Frontend standards: `docs/standards/frontend.md`
- API conventions: `docs/standards/api.md`
- Database conventions: `docs/standards/database.md`
- Security rules: `docs/standards/security.md`
- Commands: `docs/development/commands.md`

For authorization work, also read:

- `docs/architecture/authorization-rbac.md`
- `docs/adr/ADR-003-dynamic-rbac.md`

For inventory or checkout work, also read:

- `docs/architecture/inventory.md`
- `docs/architecture/checkout.md`
- `docs/adr/ADR-004-inventory-reservation.md`

## Core Stack

Frontend:

- Next.js App Router;
- React;
- TypeScript strict mode;
- HeroUI;
- Tailwind CSS;
- TanStack Query;
- React Hook Form;
- Zod;
- next-intl;
- Axios through the shared API client.

Backend:

- NestJS;
- TypeScript strict mode;
- PostgreSQL;
- Prisma;
- Redis;
- BullMQ;
- MinIO;
- OpenAPI.

## Mandatory workflow

Before coding:

1. Read this file and relevant referenced documents.
2. Inspect related implementations and existing patterns.
3. Identify the smallest valid change.
4. List files expected to change.
5. Confirm database, API, authorization and i18n effects.
6. Avoid modifying unrelated code.

After coding:

1. Run formatting.
2. Run linting for affected workspaces.
3. Run type checking.
4. Run relevant tests when tests exist.
5. Run the affected application build.
6. Review the diff for unrelated changes.
7. Update documentation when contracts or architecture change.

## Global engineering rules

Always:

- use TypeScript strict mode;
- use descriptive names;
- validate external input;
- preserve module boundaries;
- handle expected failures explicitly;
- reuse established abstractions;
- keep changes scoped to the request;
- keep business logic outside controllers and UI components;
- use transactions where atomicity is required;
- implement idempotency for retryable commands;
- enforce authorization in the backend.

Never:

- use `any`;
- silently swallow errors;
- log passwords, tokens or sensitive data;
- call Axios directly from UI components;
- treat hidden frontend controls as authorization;
- hard-code roles in business endpoints;
- update inventory with unsafe read-then-write logic;
- introduce a new library without a clear need;
- rewrite unrelated code.
- create speculative abstractions.

## Authorization

OrderFlow uses dynamic RBAC.

- Roles and permissions are stored in PostgreSQL.
- Users may have multiple roles.
- Permissions may be assigned directly to users.
- Business endpoints check permission codes, not role names.
- Direct `DENY` overrides role and direct `ALLOW`.
- Permission changes must invalidate authorization cache.
- Authorization changes must create audit records.
- Prevent privilege escalation and protect the last super administrator.

Example:

```ts
@RequirePermissions('orders.cancel')
```

Do not use:

```ts
@Roles('ADMIN')
```

## Internationalization

The existing next-intl configuration is the source of truth.

Use i18n for:

- labels;
- navigation;
- validation text;
- empty states;
- confirmation dialogs;
- toast messages;
- known backend error codes.

Dynamic role and permission names are stored as normal database values and are displayed as
returned by the API. Do not create translation tables for them.

## Documentation

Update documentation when changing:

- public API contracts;
- database structure;
- module responsibilities;
- permission semantics;
- state machines;
- architecture decisions;
- operational commands.

Do not duplicate detailed documentation in this file. Link to the source of truth instead.
