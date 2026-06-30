# Database Standards

- Use PostgreSQL as the source of truth for transactional state.
- Use Prisma through module-owned repositories.
- Add unique constraints for duplicate-protection invariants.
- Use transactions for multi-write operations that must succeed together.
- Use atomic updates for contested inventory changes.
- Keep audit and outbox writes in the same transaction as the business change when required.
- Prefer explicit database constraints over application-only assumptions.
