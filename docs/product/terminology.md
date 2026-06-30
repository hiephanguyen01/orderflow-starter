# Terminology

- Flash sale: a time-bounded sale campaign with constrained inventory.
- Reservation: temporary inventory hold created during checkout.
- Idempotency key: client or server generated key used to make retries safe.
- Permission code: backend authorization string in `resource.action` format.
- Direct ALLOW: user-specific permission grant.
- Direct DENY: user-specific permission denial that overrides role grants and direct ALLOW.
- Outbox event: durable database record used to publish integration work reliably.
