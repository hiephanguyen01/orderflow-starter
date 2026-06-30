# Module Boundaries

Backend modules are organized by business capability. Each module owns its persistence access,
application services and domain rules.

Modules must not:

- import another module's repository directly;
- query another module's tables as a shortcut;
- expose Prisma records as public contracts;
- put cross-module orchestration in controllers.

Cross-module collaboration uses:

- exported application services;
- explicit ports;
- domain events;
- integration events persisted through the outbox.
