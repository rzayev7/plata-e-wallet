# Plata Roadmap

---

# Guiding Principles

* Build incrementally.
* Finish one milestone before starting the next.
* Never introduce complexity without a clear reason.
* Every feature must include automated tests.
* Every architectural decision should be documented as an ADR (`docs/adr/`).
* Refactor continuously.

---

# Phase 0 — Engineering Foundation

## Objective

Establish the project's engineering standards before writing business logic.

## Deliverables

* Vision document
* README
* Development roadmap
* Architecture overview
* Architecture Decision Records (ADRs) + ADR index/template
* Coding standards
* Development environment
* GitHub repository
* CI pipeline
* Initial Spring Boot project skeleton, structured by module (see `architecture.md`)
* **Baseline structured logging** (JSON logs + request/correlation ID filter)

> Baseline logging is pulled into Phase 0 rather than deferred to the Operational Excellence phase, because debugging Phase 1–3 without it teaches bad habits (e.g. `println` debugging). Full observability (metrics, tracing, dashboards) still belongs to Phase 5.

## Learning Goals

* Project organization
* Documentation
* Architectural thinking
* Professional repository management

---

# Phase 1 — Identity & Access

## Objective

Build a secure authentication system.

## Features

* User registration
* Login
* JWT authentication
* Refresh tokens
* Password encryption
* Role-based authorization
* User profile

## Engineering Focus

* Spring Security
* Authentication
* Authorization
* Validation
* Exception handling

---

# Phase 2 — Wallet Management

## Objective

Introduce the core wallet domain.

## Features

* Create wallet
* Wallet details
* Wallet status (ACTIVE / FROZEN / CLOSED)
* Multiple wallets per user
* Rename wallet
* Balance inquiry

## Engineering Focus

* Domain modeling
* Aggregate design
* Entity relationships
* Business rules

---

# Phase 3 — Ledger

## Objective

Model financial transactions correctly.

## Features

* Double-entry ledger
* Ledger entries
* Immutable transaction records
* Account balances derived from ledger

## Engineering Focus

* Financial consistency
* Transaction management
* Auditability
* Data integrity

---

# Phase 4 — Money Transfers

## Objective

Allow secure money movement between wallets.

## Features

* Deposit (simulated)
* Withdraw (simulated)
* Wallet-to-wallet transfers
* Transaction history

## Engineering Focus

* ACID transactions
* Concurrency
* Idempotency
* Optimistic locking
* Failure recovery

---

## 🔎 Scope Checkpoint (end of Phase 4)

At this point the core wallet product (identity, wallets, ledger, transfers) is functionally complete. Before continuing into Phases 5–10, explicitly revisit:

* Is the one-year, part-time pace still realistic?
* Do you still want the full distributed-systems track (Phases 7–9), or would doubling down on making the monolith excellent (testing depth, performance, security) serve the learning goal better?
* Record the outcome as an ADR, even if the decision is "continue as planned."

---

# Phase 5 — Operational Excellence

## Objective

Operate the application like a production system.

## Features

* Metrics
* Health checks
* Distributed tracing
* Audit logging (dedicated audit trail, distinct from application logs)

## Engineering Focus

* Observability
* Monitoring
* Production diagnostics

---

# Phase 6 — Performance

## Objective

Improve responsiveness and scalability.

## Features

* Redis caching
* Pagination
* Search
* Performance optimization

## Engineering Focus

* Cache design
* Query optimization
* Benchmarking
* Load testing

---

# Phase 7 — Event-Driven Architecture

## Objective

Decouple modules using asynchronous communication.

## Features

* Domain events
* Event publishing
* Kafka integration
* Asynchronous processing

## Engineering Focus

* Event-driven design
* Eventual consistency
* Reliable messaging

---

# Phase 8 — Wallet Expansion

## Objective

Extend the platform with additional wallet capabilities.

## Features

* Notifications (email/push, real delivery instead of simulated)
* Merchant wallets
* QR payments
* Scheduled transfers
* Payment requests

## Engineering Focus

* Modular growth
* Business workflows
* Background processing

---

# Phase 9 — Distributed Systems

## Objective

Prepare the platform for service decomposition.

## Features

* Extract selected modules
* API Gateway
* Service-to-service communication
* Resilience patterns

## Engineering Focus

* Distributed architecture
* Network communication
* Fault tolerance

---

# Phase 10 — Production Hardening

## Objective

Increase reliability and operational maturity.

## Features

* Backup strategy
* Disaster recovery
* Infrastructure automation
* Security hardening
* Deployment improvements

## Engineering Focus

* Reliability
* Operations
* Security
* Infrastructure

---

# Definition of Done

A phase is complete only when:

* All planned features are implemented.
* Unit tests pass.
* Integration tests pass.
* Documentation is updated.
* ADRs are written for significant architectural decisions.
* Code has been reviewed and refactored.
* The application is deployable.

---

# Long-Term Goal

The ultimate objective of Plata is not simply to build a digital wallet.

It is to become a portfolio-quality demonstration of production-grade backend engineering that showcases sound software architecture, financial domain modeling, operational excellence, and modern engineering practices.

By the end of the project, every design decision should be understandable, every architectural trade-off should be documented, and every major component should reflect the standards expected in professional engineering teams.