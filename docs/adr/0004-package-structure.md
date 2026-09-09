# ADR-0004: Package Structure and Module Boundaries

**Status:** Accepted

**Date:** September 9, 2026

**Supersedes:** ADR-0002 — Module Communication Boundaries

---

# Context

ADR-0001 chose a Modular Monolith. ADR-0002 then specified how modules should be separated:
each module split into `domain / application / infrastructure / api`, internals hidden using
package-private visibility, cross-module side effects modelled as domain events, and the
whole thing enforced by ArchUnit.

Two problems emerged when that was actually implemented.

**The enforcement mechanism does not work as described.** Java's package-private visibility
applies to a single package, not to a package tree. `customer.application` and
`customer.domain` are different packages, so a service cannot see its own entity unless the
entity is `public` — at which point it is visible to the entire application. ADR-0002's main
mechanism is therefore unavailable, and only the ArchUnit part of it is real.

**The structure costs more than it returns at this stage.** A four-layer split with ports,
adapters and a persistence model kept separate from the domain model was built for the
customer module. It produced roughly five extra classes for one CRUD-shaped feature. That
overhead is justified when a module has complex invariants; it is not justified for
"save a row, hash a password".

There is also a project-level fact worth stating plainly: Plata is written by one developer
who is early in their career. An architecture that is understood is worth more than an
architecture that is admired. A structure nobody can hold in their head gets abandoned or,
worse, followed incorrectly.

---

# Decision

**1. Packages are grouped by module first, by technical layer second.**

```text
com.plata
 ├── common/
 │    ├── config/
 │    ├── exception/
 │    └── money/
 ├── customer/
 │    ├── controller/
 │    ├── dto/
 │    ├── entity/
 │    ├── exception/
 │    ├── repository/
 │    └── service/
 ├── account/
 └── transfer/
```

A global `controller/` + `service/` + `repository/` split at the root is rejected — it hides
which module a class belongs to, which is the property this project most needs to keep.

**2. Entities carry JPA annotations directly.** No separate persistence model, no mappers.
The rule "business logic is independent of frameworks" is narrowed to something achievable
and checkable: *entities and services must not know about HTTP, Kafka or Redis*. JPA mapping
is permitted.

Entities are still expected to protect themselves: no public setters, state changed through
named methods, construction through static factory methods.

**3. Modules communicate through `service/` only.** A module must never inject or call
another module's `repository/` or `entity/`. This single rule is retained from ADR-0002
unchanged, because it is the one that actually preserves modularity.

**4. Cross-module side effects are direct service calls for now.** Domain events and an
event publication registry are deferred until the Notification module exists (Phase 6) and
there is a second consumer to justify them.

**5. Enforcement is by hand until there is a second module.** ArchUnit tests asserting rule 3
are added when `account/` lands — a boundary rule over a single module tests nothing. Until
then, CI runs `mvn verify` on every push, which is the enforcement that matters today.

---

# Consequences

## Positive

* The structure is conventional: any Spring developer reads it without explanation.
* Far less code per feature — no mappers, no ports, no duplicate models.
* Module boundaries are still real, because rule 3 survives from ADR-0002.
* The rules that remain are ones that can actually be enforced.

## Negative

* Entities depend on `jakarta.persistence`. Swapping the ORM would touch them.
* An anemic domain model is now easier to write by accident. Rule 2's "no public setters" is
  the guard against that, and it is a habit rather than a mechanism.
* Boundary violations are not caught automatically until ArchUnit arrives.

These are accepted. Rule 3 is the one worth defending; if it starts being violated, that is
the signal to bring ArchUnit forward rather than to add more structure.

---

# Review

Revisit this decision if:

* A module's business rules outgrow what a `service/` class can hold clearly — most likely
  `ledger`, where a transaction must always balance. A single module may then adopt a richer
  internal structure without the others changing. Uniformity across modules is not a goal.
* Boundary violations between modules appear in review. Add ArchUnit at that point.
* The project stops being a single-developer project.
