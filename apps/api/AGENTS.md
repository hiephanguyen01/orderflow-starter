# API Application Guidance

This application owns the HTTP API.

Before changing it, read:

- root `AGENTS.md`;
- `docs/standards/backend.md`;
- `docs/standards/api.md`;
- the owning domain documentation.

## HTTP Layer

Controllers may:

- validate and map requests;
- call application services;
- return response DTOs.

Controllers may not:

- contain business rules;
- access Prisma directly;
- implement transaction orchestration.

## Authentication and Authorization

Apply guards in this order:

```text
Authentication
    ↓
Permission metadata and guard
    ↓
Resource-level policy
    ↓
Application use case
```

Do not trust role or permission information provided by the client.

## Persistence

- Use repositories.
- Use explicit transactions for multi-write business operations.
- Add unique constraints as the final duplicate-protection layer.
- Use atomic updates for contested inventory.
