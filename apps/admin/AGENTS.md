# Admin Application Guidance

This application is the OrderFlow administration portal.

Before changing this application, read:

- root `AGENTS.md`;
- `docs/standards/frontend.md`;
- `docs/architecture/authorization-rbac.md` for access-control work.

## UI

- Use HeroUI components.
- Reuse `packages/ui` before adding local wrappers.
- Use the existing next-intl configuration.
- Use TanStack Query for server state.
- Use React Hook Form and Zod for forms.
- Use the shared API client.

## Access Control

- Filter navigation and actions by effective permissions.
- Always handle backend `403` responses.
- Hidden UI does not replace backend authorization.
- Display the source of effective permissions when available.
- Confirm destructive permission and role operations.

## Dynamic Data

Role and permission names are runtime database values.

Display:

```text
role.name
permission.name
```

Do not attempt:

```text
t(`roles.${role.code}`)
t(`permissions.${permission.code}`)
```
