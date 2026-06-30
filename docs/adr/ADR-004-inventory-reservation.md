# ADR-004: Inventory Reservation

## Status

Accepted

## Decision

Checkout creates temporary inventory reservations atomically with order creation.

## Consequences

- Cart actions do not reserve inventory.
- Checkout must prevent overselling with database-backed atomicity.
- Expired reservations release inventory exactly once.
- Retryable checkout commands require idempotency.
