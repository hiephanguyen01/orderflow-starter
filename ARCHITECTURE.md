# OrderFlow Architecture

## Architectural Style

OrderFlow starts as a modular monolith.

The primary deployment units are:

- HTTP API;
- background worker;
- customer storefront;
- administration application.

Backend modules are isolated by domain boundaries but initially share one PostgreSQL database.

## Backend Flow

```text
HTTP request
    ↓
Authentication guard
    ↓
Permission guard
    ↓
Controller
    ↓
Application service
    ↓
Domain logic
    ↓
Repository
    ↓
PostgreSQL
```

## Backend Modules

```text
identity
access-control
users
catalog
inventory
flash-sales
cart
checkout
orders
payments
refunds
notifications
audit
outbox
```

A module may not access another module's persistence implementation directly.

Cross-module operations must use:

- exported application services;
- explicit ports;
- domain or integration events.

## Critical Consistency Boundary

Checkout requires one database transaction for:

- idempotency record;
- inventory reservation;
- inventory balance update;
- order creation;
- order item snapshots;
- outbox events.

Notification delivery and analytics are asynchronous.

## Frontend Architecture

```text
app/
features/
shared/
providers/
i18n/
```

A feature owns:

```text
feature/
├── api/
├── components/
├── hooks/
├── schemas/
├── types/
└── utils/
```

UI components do not call Axios directly.

Data flow:

```text
Page or component
    ↓
Feature hook
    ↓
API client
    ↓
Backend API
```

## Authorization

The backend is the final authorization authority.

The frontend may hide unavailable actions for usability, but it must not be treated as a security
boundary.

See:

- `docs/architecture/authorization-rbac.md`
- `docs/adr/ADR-003-dynamic-rbac.md`
