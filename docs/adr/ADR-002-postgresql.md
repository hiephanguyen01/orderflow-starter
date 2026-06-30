# ADR-002: PostgreSQL

## Status

Accepted

## Decision

PostgreSQL is the source of truth for transactional business state.

## Consequences

- Critical duplicate-prevention rules must be backed by database constraints.
- Multi-write consistency boundaries use database transactions.
- Contested inventory changes use atomic updates.
