# Security Standards

- Enforce authorization in the backend.
- Check permission codes instead of role names in business endpoints.
- Do not treat hidden frontend controls as authorization.
- Do not trust client-provided identity, role or permission values.
- Invalidate authorization cache after permission changes.
- Audit privileged access-control changes.
- Prevent privilege escalation.
- Protect the final super administrator.
- Never log secrets, tokens, passwords or sensitive payment data.
