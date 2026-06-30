# Environment Variables

Keep local secrets in `.env` files that are not committed.

Rules:

- document required variable names in `.env.example`;
- do not commit real secrets;
- do not log environment values that contain credentials, tokens or keys;
- restart affected applications after changing runtime configuration.
