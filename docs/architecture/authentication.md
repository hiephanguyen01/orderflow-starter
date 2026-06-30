# Authentication

Authentication establishes the current user before authorization is evaluated.

Rules:

- validate credentials and tokens at the backend boundary;
- never trust user, role or permission data supplied by the client;
- avoid logging tokens, passwords or secret-bearing headers;
- keep authentication concerns separate from business authorization;
- return stable known error codes for client translation.
