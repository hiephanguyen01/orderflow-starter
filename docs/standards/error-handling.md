# Error Handling Standards

- Handle expected failures explicitly.
- Translate infrastructure failures at module boundaries.
- Preserve the original cause for diagnostics.
- Log unexpected errors once with structured context.
- Never log passwords, tokens or sensitive values.
- Never expose stack traces or sensitive implementation details to clients.
- Return stable known error codes when the frontend needs localized messages.
