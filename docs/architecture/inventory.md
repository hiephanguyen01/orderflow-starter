# Inventory

Inventory is a critical consistency boundary.

Rules:

- adding an item to cart does not reserve inventory;
- checkout reserves inventory atomically;
- inventory updates under contention must use atomic database operations;
- never implement unsafe read-then-write decrements;
- expired reservations release reserved inventory exactly once;
- inventory state changes that affect orders must be auditable.
