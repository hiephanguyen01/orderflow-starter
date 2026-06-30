# Worker Guidance

Workers must be idempotent, retry-safe and observable. Claim work atomically. Never process the same
business transition twice. Use bounded batches and graceful shutdown.
