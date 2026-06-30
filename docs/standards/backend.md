# Backend Standards

Controllers map HTTP requests and responses only. Application services orchestrate use cases.
Domain code owns business rules. Repositories hide persistence details.

Use global input validation. Never return Prisma records directly as public API contracts.
Multi-write operations that must succeed together use one database transaction. Retryable commands
require idempotency. Reliable events are written through a transactional outbox.
