# API Standards

- Validate all external input.
- Keep controllers free of business logic.
- Use DTOs for public request and response contracts.
- Do not return Prisma models directly.
- Use stable error codes for known client-facing errors.
- Check permission codes, not role names, on business endpoints.
- Treat client-supplied prices, inventory and permissions as untrusted.
- Document contract changes when request or response shapes change.
