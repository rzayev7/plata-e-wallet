# Plata Architecture

## Overview

Plata is a digital wallet platform built as a learning project by a single developer.

The architecture is deliberately kept at a level that one person can actually maintain and
understand. Complexity is added when a concrete problem demands it, not in advance.

---

# Architectural Style

## Modular Monolith

One deployable application, split into modules by business capability.

Modules planned across the roadmap:

* `customer` — registration, login, profile
* `account` — wallets: balance, status, ownership
* `transfer` — moving money between accounts
* `ledger` — double-entry records of every movement
* `notification`
* `administration`

Each module owns its own data and its own rules. See `docs/adr/0004-package-structure.md`
for why the packages are laid out the way they are.

---

# Package Structure

Packages are grouped **by module first**, and by technical layer inside the module.

```text
com.plata
 ├── common/
 │    ├── config/        cross-cutting Spring configuration
 │    ├── exception/     BusinessException + GlobalExceptionHandler
 │    └── money/         Money, Currency (shared value objects)
 ├── customer/
 │    ├── controller/    REST endpoints
 │    ├── dto/           request/response records
 │    ├── entity/        JPA entities + enums
 │    ├── exception/     this module's business exceptions
 │    ├── repository/    Spring Data repositories
 │    └── service/       business logic
 ├── account/
 │    └── ... same layout
 └── transfer/
      └── ... same layout
```

A global `controller/`, `service/`, `repository/` split at the root is rejected: it hides
which module a class belongs to, and it makes reaching across module boundaries invisible.

`common/` is kept deliberately small. It holds only things that genuinely belong to no
single module. The moment a service or repository wants to live there, that is a sign a
new module is needed instead.

---

# Module Boundaries

**One rule, and it is the important one:**

> A module never uses another module's `repository/` or `entity/`. It calls that module's
> `service/`.

So `TransferService` does not inject `AccountRepository`. It calls `AccountService`.

This is what keeps modules separable. Everything else in this document is detail by
comparison. The rule is currently upheld by hand; an automated check (ArchUnit) is planned
once there is more than one module to check — see `docs/adr/0004-package-structure.md`.

---

# Layer Responsibilities

| Layer | Does | Must not |
|---|---|---|
| `controller` | validate input, call a service, return a DTO | contain business rules |
| `service` | business rules, transaction boundaries | know about HTTP |
| `repository` | database access | contain business rules |
| `entity` | hold state, protect its own invariants | leave the service layer |
| `dto` | carry data in and out of the API | expose password hashes or internals |

Two habits that follow from this table and are worth keeping from day one:

* **Entities never leave the service layer.** Controllers return DTOs. This is why
  `CustomerResponse` has no `passwordHash` field.
* **Entities have no public setters.** State is set through a named factory method or a
  method that expresses a business action (`customer.register(...)`, `account.freeze()`).
  An entity that can be put into an invalid state will eventually be put into one.

---

# Financial Correctness

This is a money system, so a few rules are not negotiable:

* **Money is a type, not a number.** `Money` stores an amount in minor units (`long`) plus a
  currency. Never `double`. Adding two different currencies is an error, not a silent bug.
* **The ledger is append-only.** Ledger rows are never updated or deleted.
* **Balances are derived from the ledger**, not stored as an independently editable field.
* **A ledger transaction must balance**: total debits equal total credits, enforced when the
  record is created.
* **Transfers are idempotent.** A retried request with the same idempotency key must not move
  money twice.
* **Optimistic locking (`@Version`)** on anything two requests can touch at once.

---

# Technology Stack

* Java 21, Spring Boot, Maven
* PostgreSQL, Flyway (Flyway owns the schema; `ddl-auto` is `validate`, never `update`)
* JUnit 5, Testcontainers
* Docker, GitHub Actions

Redis, Kafka, Kubernetes and the rest appear in the roadmap. They get added when there is a
problem they solve, and each one gets an ADR first.

---

# Testing

* Business rules in `service/` get unit tests.
* Endpoints get integration tests against a real PostgreSQL via Testcontainers.
* CI runs `mvn verify` on every push. A red build is a broken build.

---

# Evolution

This structure is expected to change. If a module's `service/` grows a domain complex enough
to deserve it, that module — and only that module — can move to a richer internal structure.
Architecture is allowed to differ between modules; uniformity is not a goal in itself.

Every significant change gets an ADR in `docs/adr/`.
