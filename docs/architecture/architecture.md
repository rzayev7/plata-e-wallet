# Plata Architecture

## Overview

Plata is designed as a production-grade digital wallet platform that emphasizes maintainability, correctness, scalability, and clean software engineering practices.

The project begins as a **Modular Monolith**, allowing rapid development while maintaining clear boundaries between business domains. As the platform evolves and real engineering challenges emerge, selected modules may be extracted into independent services.

The architecture prioritizes business correctness over technical complexity. Every architectural decision should solve an existing problem rather than anticipate hypothetical future requirements.

---

# Architectural Goals

The architecture should:

* Be easy to understand.
* Keep business logic independent of frameworks.
* Support incremental evolution.
* Encourage high cohesion and low coupling.
* Be testable at every layer.
* Make failures observable.
* Support future scalability without premature optimization.

---

# Architectural Style

## Modular Monolith

Plata is implemented as a Modular Monolith. This means the codebase is organized **by module first, by layer second** — the module boundary is the primary structural unit, and each module contains its own internal layers. See "Package Structure" below for the concrete layout, and `docs/adr/0002-module-communication-boundaries.md` for how modules are allowed to talk to each other.

Initial modules:

* Identity & Access
* Users
* Wallet
* Ledger
* Transfer
* Notification
* Administration

This approach provides many of the organizational benefits of microservices while avoiding their operational complexity — but only if module boundaries are mechanically enforced (see below), not just documented.

---

# Package Structure

Packages are organized by module, not by technical layer. A global `controllers/`, `services/`, `repositories/` split is explicitly rejected because it hides which module a class belongs to and makes it easy to reach across boundaries by accident.

```text
com.plata
 ├── identity/
 │    ├── domain/          (entities, value objects, domain rules)
 │    ├── application/     (use cases / application services, public interfaces)
 │    ├── infrastructure/  (JPA repositories, external clients)
 │    └── api/              (REST controllers, DTOs)
 ├── user/
 │    └── ... (same internal structure)
 ├── wallet/
 │    └── ...
 ├── ledger/
 │    └── ...
 ├── transfer/
 │    └── ...
 ├── notification/
 │    └── ...
 └── administration/
      └── ...
```

Within a module, the layering still follows Clean Architecture (domain → application → infrastructure/api depend inward, never outward). The difference from a layered-monolith structure is that this dependency rule is enforced **per module**, and one module's internals are invisible to another module.

---

# Module Boundary Enforcement

Documenting a boundary is not the same as enforcing it. Plata enforces module boundaries mechanically:

* Only classes in a module's `application` package (its public application-service interfaces) may be called from another module. `domain`, `infrastructure`, and repositories are package-private or otherwise inaccessible from outside the module.
* Cross-module side effects (e.g. Transfer completing → Notification reacting) are triggered via **domain events**, not direct method calls, once Phase 7 introduces the event-driven pattern. Until then, synchronous calls go through application-service interfaces only.
* **ArchUnit tests**, introduced in Phase 0/1, assert these rules automatically as part of the build — e.g. "no class in `wallet.infrastructure` is referenced outside the `wallet` package." A CI failure here is treated the same as a failing unit test.

This is the concrete answer to the risk flagged in `docs/adr/0001-use-modular-monolith.md` ("poor module discipline could eventually lead to a traditional monolith") — the discipline is backed by a test, not just intent.

---

# Architectural Principles

## Domain First

Business rules are the most important part of the application. Frameworks, databases, and infrastructure exist to support the domain — not the other way around.

## Clean Architecture

Business logic should remain independent of Spring Boot, PostgreSQL, Kafka, Redis, HTTP, and infrastructure concerns generally. Frameworks should be replaceable without changing the core domain.

## Evolutionary Architecture

Architecture is expected to evolve throughout the lifetime of the project. New technologies should only be introduced when they solve a demonstrated engineering problem, e.g.:

* Redis when database load becomes significant.
* Kafka when asynchronous communication becomes necessary.
* Kubernetes when deployment complexity justifies orchestration.

## Documentation-Driven Development

Every significant architectural decision must be documented using an Architecture Decision Record (ADR) in `docs/adr/`. Documentation is considered part of the software.

---

# Request Flow

Within a single module, a request flows through the following layers:

```text
Client
   │
REST API (module's api/ package)
   │
Application Layer (module's application/ package)
   │
Domain Layer (module's domain/ package)
   │
Persistence Layer (module's infrastructure/ package)
   │
PostgreSQL
```

Cross-cutting concerns applied at the edges of every module include:

* Security
* Validation
* Logging (structured, correlation-ID based — see `ROADMAP.md` Phase 0)
* Observability
* Exception Handling
* Auditing

---

# Technology Stack

## Backend

* Java 21
* Spring Boot 3
* Maven

## Database

* PostgreSQL
* Flyway

## Testing

* JUnit 5
* Testcontainers
* ArchUnit (module-boundary enforcement)

## Infrastructure

* Docker
* Docker Compose
* GitHub Actions

Future technologies include Redis, Kafka, OpenTelemetry, Kubernetes, and Terraform.

---

# Financial Correctness

Because Plata models a financial system, correctness is prioritized over performance.

Core principles include:

* Immutable transaction history
* Double-entry ledger
* Transactional consistency
* Idempotent operations where appropriate
* Optimistic locking for concurrent updates
* Complete auditability

---

# Testing Strategy

Testing is an architectural requirement. Each feature should include:

* Unit tests
* Integration tests
* Repository tests where appropriate
* ArchUnit tests for module-boundary rules

Critical business rules should always be verified through automated tests.

---

# Future Evolution

The architecture is expected to evolve gradually. Potential future improvements include:

* Event-Driven Architecture
* Distributed services
* API Gateway
* Caching
* Distributed tracing
* Infrastructure automation

These additions should only occur when they provide measurable engineering value, and each should be preceded by an ADR.

---

# Architectural Philosophy

Plata is not intended to demonstrate the use of as many technologies as possible.

Instead, it demonstrates thoughtful engineering decisions, disciplined architecture, and a commitment to building software that remains understandable, maintainable, and reliable as it grows.