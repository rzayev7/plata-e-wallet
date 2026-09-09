\# ADR-0002: Module Communication Boundaries



\*\*Status:\*\* Accepted



\*\*Date:\*\* July 28, 2026



\---



\# Context



ADR-0001 established that Plata is a Modular Monolith, and `architecture.md` states that modules "should avoid direct dependencies on each other's internal implementation." Left at that level of generality, this rule is easy to violate under time pressure — e.g. `TransferService` reaching directly into `WalletRepository` instead of going through the Wallet module's own application service. This is the single most common way modular monoliths quietly degrade into a traditional, tightly-coupled monolith over time.



A concrete rule is needed for:



1\. What another module is allowed to call.

2\. How side effects propagate across modules (e.g. a completed Transfer needs to trigger a Notification).

3\. How the rule is enforced, not just documented.



\---



\# Decision



\*\*1. Package visibility.\*\* Within each module (`domain/`, `application/`, `infrastructure/`, `api/`), only the `application` package's public service interfaces are visible outside the module. `domain` and `infrastructure` classes are package-private or otherwise inaccessible from other modules. No module may inject or call another module's repository, entity, or infrastructure class directly.



\*\*2. Synchronous calls.\*\* Where one module genuinely needs a synchronous answer from another (e.g. Transfer needs to check whether a wallet exists and is ACTIVE before proceeding), it calls that module's public application-service interface. This is a normal in-process method call — no additional infrastructure is introduced for it.



\*\*3. Asynchronous side effects.\*\* Where a module needs to react to something that happened in another module, but does not need to block on the result (e.g. Notification reacting to a completed Transfer), this is modeled as a \*\*domain event\*\*. Until Phase 7 introduces the message-driven infrastructure (Kafka), domain events are published and handled in-process (e.g. via Spring's `ApplicationEventPublisher`); the event contracts are designed from the start as if they will later cross a real message broker, so the Phase 7 migration is a transport change, not a redesign.



\*\*4. Enforcement.\*\* These rules are checked automatically in CI via ArchUnit tests, introduced in Phase 0/1, for example:



\* No class outside `wallet.\*` may reference a class in `wallet.domain` or `wallet.infrastructure`.

\* No module may have a compile-time dependency on another module's `infrastructure` package.

\* Cyclic dependencies between modules are forbidden.



A failing ArchUnit test blocks the build, exactly like a failing unit test.



\---



\# Rationale



Documenting a boundary ("modules should communicate through well-defined interfaces") without a mechanism to enforce it is optimistic rather than architectural. Given this project is developed solo, there is no code-review partner to catch a boundary violation informally — the CI check has to do that job.



Distinguishing synchronous application-service calls from asynchronous domain events also gives early, low-cost practice with the event-driven pattern the roadmap introduces later (Phase 7), without requiring Kafka before it's justified.



\---



\# Consequences



\## Positive



\* Module boundaries are real, not aspirational.

\* Cross-module coupling is caught at build time, not discovered during a difficult refactor.

\* Early, low-risk exposure to event-driven thinking, ahead of the Phase 7 Kafka migration.



\## Negative



\* Additional upfront ceremony: every module needs an explicit public interface even for simple operations.

\* In-process domain events introduce a small amount of indirection that is not strictly necessary until Phase 7.

\* ArchUnit rules themselves require maintenance as the module set evolves.



These costs are accepted because the alternative — relying on manual discipline — is the specific failure mode ADR-0001 already flagged as a risk.



\---



\# Alternatives Considered



\## Convention only, no enforcement



Rejected. This is effectively the status quo before this ADR and does not address the actual risk.



\## Full asynchronous messaging from day one (introduce Kafka in Phase 0/1)



Rejected. This pulls Phase 7 infrastructure forward without a demonstrated need, violating the project's "new technologies should only be introduced when they solve an actual engineering problem" principle (Vision Document).



\---



\# Review



Revisit this decision if:



\* ArchUnit's module-boundary checks prove too rigid for legitimate cross-module queries (may need a read-only "shared kernel" for a small number of value objects).

\* The in-process event mechanism becomes a bottleneck before Phase 7 is reached.

