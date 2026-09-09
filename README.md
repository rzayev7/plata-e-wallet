# Plata

> A production-grade digital wallet platform built to explore modern backend engineering.

## Overview

Plata is a long-term software engineering project that demonstrates how a modern digital wallet platform can be designed and implemented using enterprise software engineering practices.

Rather than focusing on rapid feature development, Plata prioritizes correctness, maintainability, scalability, reliability, and clean architecture. The project serves as an engineering laboratory for learning how production-grade financial systems are designed, built, and evolved.

The platform is intentionally developed as if it were a real-world product while remaining independent of any banking institution or payment network.

---

## Purpose

The primary goal of Plata is educational.

This project is designed to bridge the gap between building CRUD applications and engineering complex backend systems.

Throughout its development, Plata explores topics such as:

* Domain-Driven Design (DDD)
* Clean Architecture
* Modular Monolith Architecture
* Event-Driven Architecture
* Transaction Management
* Concurrency
* Security
* API Design
* Database Design
* Distributed Systems
* Observability
* Performance Engineering
* Testing
* CI/CD
* Infrastructure as Code

The software is the learning platform.

The real product is the engineering experience gained while building it.

---

## Features

### Version 1

* User Authentication & Authorization
* User Management
* Wallet Management
* Double-Entry Ledger
* Money Transfers
* Transaction History
* Audit Logging
* Administrative APIs

### Planned Features

* Merchant Wallets
* QR Payments
* Payment Gateway Integrations
* Notifications
* Scheduled Transfers
* Fraud Detection
* Foreign Exchange
* Reporting
* Real-Time Analytics
* Distributed Services

---

## Architecture

Plata begins as a **Modular Monolith** designed with clear module boundaries and Clean Architecture principles.

As the project evolves, selected modules may be extracted into independent services when justified by real engineering requirements.

The architecture emphasizes:

* High cohesion
* Low coupling
* Explicit boundaries
* Testability
* Maintainability
* Incremental evolution

Architectural decisions are documented using Architecture Decision Records (ADRs).

---

## Technology Stack

### Backend

* Java 21
* Spring Boot
* Maven

### Database

* PostgreSQL
* Flyway

### Infrastructure

* Docker
* Docker Compose
* GitHub Actions

### Testing

* JUnit 5
* Testcontainers

### Future Technologies

* Redis
* Kafka
* OpenTelemetry
* Kubernetes
* Terraform

New technologies are introduced only when they solve an actual engineering problem.

---

## Project Structure

```text
docs/
├── adr/
├── architecture/
├── domain/
├── product/
├── roadmap/
└── vision/

src/
├── main/
└── test/
```

---

## Engineering Principles

Plata follows several core principles throughout its development:

* Correctness before speed.
* Simplicity before complexity.
* Architecture evolves through incremental improvements.
* Business rules remain independent of frameworks.
* Every significant architectural decision is documented.
* Every feature includes automated tests.
* APIs are designed for long-term evolution.
* Infrastructure is reproducible.
* Production-ready practices are adopted whenever practical.

---

## Project Status

🚧 **Active Development**

Plata is currently in the engineering foundation phase, where the project's architecture, documentation, domain model, and development standards are being established before implementation begins.

---

## License

This project is licensed under the MIT License.

---

## Author

**Sahib Rzayev**

Plata is a long-term engineering project created to deepen expertise in backend development, software architecture, and financial systems while demonstrating production-grade engineering practices.
