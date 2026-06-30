# Core Business Rules

1. Adding an item to a cart does not reserve inventory.
2. Checkout reserves inventory atomically.
3. A retry must not create a duplicate order, payment or refund.
4. Expired reservations return reserved inventory exactly once.
5. Order items store immutable product and price snapshots.
6. Business endpoints authorize permission codes, not role names.
7. Every privileged access-control change is audited.
