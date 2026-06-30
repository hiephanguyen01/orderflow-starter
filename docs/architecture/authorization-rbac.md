# Dynamic RBAC

## Model

```text
User -> UserRole -> Role -> RolePermission -> Permission
User -> UserPermission(ALLOW | DENY) -> Permission
```

Effective permissions:

```text
(role permissions union direct ALLOW) minus direct DENY
```

## Requirements

- Create roles and permissions while the system is running.
- Assign multiple roles to any user.
- Assign permissions directly to any user.
- Check permission codes at backend endpoints.
- Invalidate Redis authorization cache after changes.
- Audit all assignments and revocations.
- Prevent privilege escalation and protect the final super administrator.

Runtime-created role and permission names are normal database values. Existing next-intl files
translate only static interface content.
