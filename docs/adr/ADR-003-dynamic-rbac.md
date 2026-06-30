# ADR-003: Dynamic RBAC

## Status

Accepted

## Decision

OrderFlow uses runtime-configurable RBAC backed by database roles, permissions and assignments.

Effective permissions are:

```text
(role permissions union direct ALLOW) minus direct DENY
```

## Consequences

- Business endpoints check permission codes, not role names.
- Permission changes invalidate authorization cache.
- Access-control changes create audit records.
- Runtime role and permission names are displayed as API data, not translated through static
  message files.
