# ADR-005: Transactional Outbox

## Status

Accepted

## Decision

OrderFlow uses a transactional outbox for integration events that must be published after a
business transaction commits.

## Consequences

- Outbox records are written in the same transaction as the business state change.
- Workers publish outbox events asynchronously.
- Event publishing must be idempotent and retryable.
- Notification and analytics delivery stay outside the checkout consistency boundary.
