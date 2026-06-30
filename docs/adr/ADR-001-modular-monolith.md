# ADR-001: Modular Monolith

## Status

Accepted

## Decision

OrderFlow starts as a modular monolith with separate deployable applications for the HTTP API,
worker, storefront and admin UI.

## Consequences

- Domain boundaries are enforced in code before services are split.
- Backend modules share one PostgreSQL database initially.
- Cross-module work uses exported services, ports or events instead of direct repository access.
