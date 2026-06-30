# Asynchronous Processing

OrderFlow uses asynchronous workers for non-critical side effects and external integration work.

Use the transactional outbox for work that must not be lost when a database transaction commits.

Background work should be:

- idempotent;
- retryable;
- observable through structured logs;
- safe when executed more than once;
- separated from synchronous checkout correctness.
