# Checkout

Checkout creates the reservation and order consistency boundary.

A successful checkout transaction includes:

- idempotency record;
- inventory reservation;
- inventory balance update;
- order creation;
- order item snapshots;
- outbox events.

Retryable checkout commands must be idempotent. Clients must not be trusted for final product
prices, inventory availability or permission state.
