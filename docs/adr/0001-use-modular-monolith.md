# ADR-0001: Use a Modular Monolith Architecture

**Status:** Accepted

**Date:** July 21, 2026

---

# Context

Plata is being developed by a single engineer as a long-term learning project.

The project aims to explore production-grade backend engineering while maintaining a manageable level of operational complexity.

Although modern software systems often use microservices, adopting a distributed architecture from the beginning would introduce additional concerns such as:

* Service discovery
* Distributed transactions
* Network communication
* Deployment orchestration
* Event consistency
* Infrastructure management

These concerns would distract from the primary goal of learning software architecture and domain modeling.

---

# Decision

Plata will initially be implemented as a **Modular Monolith**.

Each business capability will be developed as an independent module with clear ownership, well-defined interfaces, and minimal coupling.

Modules should communicate through explicit application interfaces rather than direct access to implementation details. The concrete package structure and enforcement mechanism for this rule are specified in `architecture.md` and `ADR-0002`.

The codebase should be organized so that individual modules can be extracted into independent services in the future if a genuine engineering need arises.

---

# Rationale

A Modular Monolith provides several advantages for this project:

* Simpler development workflow.
* Single deployment unit.
* Easier debugging.
* Strong module boundaries.
* Lower operational overhead.
* Faster feedback during development.
* Easier refactoring while the domain is still evolving.

This approach allows architectural discipline without introducing unnecessary distributed-system complexity.

---

# Consequences

## Positive

* Faster development.
* Easier local development.
* Reduced infrastructure complexity.
* Easier testing.
* Lower maintenance cost.
* Encourages well-defined module boundaries.

## Negative

* Entire application is deployed as a single unit.
* Independent module scaling is not possible.
* Future service extraction may require refactoring.
* Poor module discipline could eventually lead to a traditional monolith. **Mitigation:** module boundaries are enforced mechanically via ArchUnit tests rather than relying on discipline alone — see ADR-0002.

These trade-offs are acceptable for the current stage of the project.

---

# Alternatives Considered

## Microservices

Rejected because the project does not currently require independent deployment, autonomous teams, or distributed scalability.

Introducing microservices prematurely would increase complexity without providing proportional value.

## Layered Monolith

Rejected because it often leads to tightly coupled codebases where business domains are difficult to isolate.

A Modular Monolith provides clearer domain boundaries while retaining the simplicity of a single deployable application.

---

# Review

This decision should be revisited if one or more of the following conditions become true:

* Independent deployment of modules becomes necessary.
* Individual modules require significantly different scaling characteristics.
* The operational benefits of distributed services outweigh their complexity.

Until then, the Modular Monolith remains the preferred architectural style for Plata.

---

# Related Decisions

* ADR-0002 — Module Communication Boundaries
* ADR-0003 — Wallet Ownership and Currency Model