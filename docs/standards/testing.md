# Testing Standards

- Add focused tests for business invariants and authorization behavior.
- Cover idempotency for retryable commands.
- Cover transaction boundaries for multi-write flows.
- Cover direct DENY precedence for RBAC changes.
- Prefer module-level tests for application-service behavior.
- Keep UI tests focused on loading, empty, error and success states when behavior changes.
