# Payment

Payment workflows must prevent duplicate charges and duplicate payment records.

Rules:

- use idempotency for retryable payment commands;
- persist external provider references once they exist;
- reconcile asynchronous provider callbacks with current order state;
- audit payment state transitions;
- do not expose provider secrets or raw sensitive payloads to clients.
