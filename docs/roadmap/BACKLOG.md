# Plata Backlog

**Status:** Draft
**Created:** September 9, 2026
**Source:** `PRODUCT_REQUIREMENTS.md`, `BUSINESS_RULES.md`, `ROADMAP.md`, `architecture.md`

**Scale:** 15 Epics · 32 Stories · 152 Tasks

---

# How to read this

| Type | Meaning |
|---|---|
| **Epic** | A capability. Groups stories and tasks. |
| **Story** | Something a customer, administrator or operator can do. |
| **Task** | Technical work with no direct user-facing value. |

**Size:** S = up to a day · M = a few days · L = about a week. Solo-developer pace.

**Order matters.** Epics, and items inside them, are listed in build order. Anything listed before another item is either a hard dependency or the thing that makes the next item testable.

---

# Milestones

| Milestone | Epics | Goal | Done when |
|---|---|---|---|
| **M0 — Foundation** | 1 | The project can be built, tested and debugged | CI green, logs readable, local stack starts with one command |
| **M1 — MVP** | 2–9 | A customer can register, hold a wallet, receive money and send it | Two customers, one transfer, ledger balances, concurrency test passes |
| **M2 — Version 1** | 10–13 | Everything `PRODUCT_REQUIREMENTS.md` calls Version 1 | Withdrawals, wallet lifecycle, audit, notifications, admin |
| **M3 — Operable** | 14–15 | Safe to run somewhere real | Hardened, observable, documented, deployed |

**The MVP is deliberately narrow.** Withdrawals, admin tools, notifications and audit logging are Version 1 but *not* MVP. Getting one transfer provably correct is worth more than ten half-finished features.

---

# EPIC-1 — Engineering Foundation

**Milestone:** M0 · **Covers:** `ROADMAP.md` Phase 0

No stories — none of this is visible to a user. All of it makes everything after it cheaper.

| ID | Type | Title | Size | Status / Depends |
|---|---|---|---|---|
| FND-T1 | Task | Git repository and initial commit | S | Done |
| FND-T2 | Task | CI pipeline running `mvn verify` on push and pull request | S | Done |
| FND-T3 | Task | Architecture document and ADR-0004 package structure | M | Done |
| FND-T4 | Task | Logback JSON encoder configuration | S | — |
| FND-T5 | Task | Correlation ID filter: accept `X-Correlation-Id` or generate one | M | FND-T4 |
| FND-T6 | Task | Put the correlation ID in the MDC and in every log line | S | FND-T5 |
| FND-T7 | Task | Return the correlation ID in the response header | S | FND-T5 |
| FND-T8 | Task | Confirm no password, token or hash reaches the logs | S | FND-T6 |
| FND-T9 | Task | `docker-compose.yml` with PostgreSQL for local development | S | — |
| FND-T10 | Task | Coding standards document | S | — |
| FND-T11 | Task | Pin the PostgreSQL image version in `TestcontainersConfiguration` | S | — |
| FND-T12 | Task | Base integration test class with shared Testcontainers setup | M | FND-T11 |
| FND-T13 | Task | ArchUnit: no module touches another module's `repository` or `entity` | S | EPIC-4 |
| FND-T14 | Task | ArchUnit: no field injection, no cycles between modules | S | FND-T13 |

**FND-T5.** `ROADMAP.md` puts logging in Phase 0 on purpose. Debugging a failed transfer without a correlation ID is where `System.out.println` habits are born.

**FND-T9.** `docker-compose.yml` is currently an empty file. Done when `docker compose up -d` followed by `./mvnw spring-boot:run` works on a clean machine.

**FND-T11.** Currently `postgres:latest`. A test suite that passes today and fails next month because the image moved is not a test suite.

**FND-T13.** Blocked until a second module exists — a boundary rule over one module tests nothing.

---

# EPIC-2 — Authentication and Customer Account

**Milestone:** M1 · **Covers:** §3, §4 · BR-001, BR-002, BR-017

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| AUTH-S1 | Register with email and password | M | Done |
| AUTH-S2 | Log in and receive an access and refresh token | S | AUTH-T8 |
| AUTH-S3 | Refresh my access token without logging in again | S | AUTH-T9 |
| AUTH-S4 | Log out, invalidating my refresh token | S | AUTH-T10 |
| AUTH-S5 | Log out from every device | S | AUTH-T10 |
| AUTH-S6 | Change my password | S | AUTH-T14 |
| AUTH-S7 | View my profile and account creation date | S | AUTH-T12 |
| AUTH-S8 | Edit my first name, last name and phone number | S | AUTH-S7 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| AUTH-T1 | Add `spring-boot-starter-security` and a `SecurityFilterChain` | M | — |
| AUTH-T2 | Declare which paths are public and which require authentication | S | AUTH-T1 |
| AUTH-T3 | `JwtTokenService`: issue signed access tokens | M | AUTH-T1 |
| AUTH-T4 | JWT authentication filter populating the security context | M | AUTH-T3 |
| AUTH-T5 | Reject expired, tampered and absent tokens with 401 | S | AUTH-T4 |
| AUTH-T6 | Token expiry read from configuration, not a constant | S | AUTH-T3 |
| AUTH-T7 | `refresh_tokens` migration: hashed token, expiry, revoked flag | S | — |
| AUTH-T8 | `RefreshToken` entity and repository | S | AUTH-T7 |
| AUTH-T9 | Issue a refresh token and rotate it on every use | M | AUTH-T8 |
| AUTH-T10 | Revoke a refresh token, individually and for a whole customer | M | AUTH-T9 |
| AUTH-T11 | Map `Role` onto Spring authorities | S | AUTH-T4 |
| AUTH-T12 | `CurrentCustomer` resolver for the authenticated customer id | S | AUTH-T4 |
| AUTH-T13 | Block authentication for suspended customers | S | AUTH-T4 |
| AUTH-T14 | Password change: verify current password, revoke all refresh tokens | M | AUTH-T10 |
| AUTH-T15 | Profile endpoints and DTOs | S | AUTH-T12 |
| AUTH-T16 | Unit tests for `CustomerService` | M | — |
| AUTH-T17 | Integration test: duplicate email rejected | S | AUTH-T16 |
| AUTH-T18 | Integration test: unknown email and wrong password give identical errors | S | AUTH-T16 |
| AUTH-T19 | Integration test: full login, refresh, logout cycle | M | AUTH-S4 |

**AUTH-T1.** `spring-boot-starter-security` is not currently a dependency, so **every endpoint is open right now**. Adding it locks everything by default, which is why AUTH-T2 belongs in the same slice.

**AUTH-T7.** Store a hash of the refresh token, never the token itself. A leaked database should not be a leaked session.

**AUTH-T18.** BR-002 requires that a failed login never reveals whether the email exists. Otherwise the login form becomes an account-enumeration tool.

---

# EPIC-3 — Money

**Milestone:** M1 · **Covers:** BR-004a · `architecture.md` "Financial Correctness"

No stories. This epic exists so that nothing downstream invents its own way of representing an amount.

| ID | Type | Title | Size | Depends |
|---|---|---|---|---|
| MON-T1 | Task | `Currency` type | S | — |
| MON-T2 | Task | `Money` value object: `long` minor units plus currency | S | MON-T1 |
| MON-T3 | Task | Arithmetic, comparison, and a hard failure on mixed currencies | S | MON-T2 |
| MON-T4 | Task | JPA mapping for `Money` | S | MON-T2 |
| MON-T5 | Task | JSON representation of `Money` for the API | S | MON-T2 |
| MON-T6 | Task | Unit tests covering every operation and the mixed-currency failure | S | MON-T3 |

**Do this epic before anything stores a balance.** Changing the money type later means rewriting every table, every service and every test that touches an amount. `double` is never acceptable here, and a bare `BigDecimal` carries no currency.

---

# EPIC-4 — Wallets

**Milestone:** M1 · **Covers:** §5.1, §5.2 · BR-003, BR-004, BR-004a

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| WAL-S1 | Create a wallet | S | WAL-T4 |
| WAL-S2 | List my wallets | S | WAL-S1 |
| WAL-S3 | View one of my wallets | S | WAL-S1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| WAL-T1 | `wallets` table migration | S | MON-T4 |
| WAL-T2 | `Wallet` entity: owner, currency, status, display name, `@Version` | M | WAL-T1 |
| WAL-T3 | `WalletRepository` | S | WAL-T2 |
| WAL-T4 | `WalletService.create` — zero balance, ACTIVE status | M | WAL-T3 |
| WAL-T5 | Wallet request and response DTOs | S | WAL-T4 |
| WAL-T6 | Wallet controller endpoints | S | WAL-T5 |
| WAL-T7 | Ownership check applied to every wallet operation | M | AUTH-T12 |
| WAL-T8 | Another customer's wallet returns 404, not 403 | S | WAL-T7 |
| WAL-T9 | Unit tests for `WalletService` | M | WAL-T4 |
| WAL-T10 | Integration tests including cross-customer access attempts | M | WAL-T8 |

**WAL-T2.** Balance is **not** a column. It is derived from the ledger (EPIC-5). A stored, independently editable balance is how money quietly appears and disappears.

**WAL-T7.** BR-003. This is the most commonly exploited bug in wallet applications: an endpoint that trusts the wallet id in the URL and never checks who owns it. Every endpoint gets a test that proves it.

**WAL-T8.** 403 confirms the wallet exists, which leaks information. 404 does not.

---

# EPIC-5 — Ledger

**Milestone:** M1 · **Covers:** §10 · BR-010, BR-011, BR-018

The heart of the system. Everything financial writes through here and nowhere else.

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| LED-S1 | Administrator reconstructs a wallet balance from ledger entries | M | LED-T8 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| LED-T1 | `ledger_accounts` migration | S | WAL-T1 |
| LED-T2 | `ledger_transactions` migration | S | LED-T1 |
| LED-T3 | `ledger_entries` migration: direction, amount, account, transaction | M | LED-T2 |
| LED-T4 | `LedgerAccount` entity | S | LED-T1 |
| LED-T5 | `LedgerEntry` entity — immutable, no setters | S | LED-T3 |
| LED-T6 | `LedgerTransaction` aggregate whose factory enforces balance | L | LED-T5 |
| LED-T7 | `LedgerService.post()` as the only write path into the ledger | M | LED-T6 |
| LED-T8 | Balance query derived from entries | M | LED-T7 |
| LED-T9 | Platform account funding deposits and receiving withdrawals | M | LED-T4 |
| LED-T10 | Revoke UPDATE and DELETE on the ledger tables | S | LED-T3 |
| LED-T11 | Indexes for balance and entry lookups | S | LED-T8 |
| LED-T12 | Unit test: an unbalanced transaction cannot be constructed | M | LED-T6 |
| LED-T13 | Integration test: derived balance equals the sum of every operation | M | LED-T8 |

**LED-T6.** Total debits must equal total credits, checked when the object is built — not in a service method that a future caller can bypass. This single invariant is what BR-010 rests on.

**LED-T9.** Double entry needs both sides. A deposit is not "balance goes up"; it is a debit on the platform account and a credit on the wallet account.

**LED-T10.** BR-011 says ledger entries are immutable and never deleted. Enforce it in PostgreSQL, not only in Java. "We never update that table" is a habit; a revoked grant is a guarantee.

---

# EPIC-6 — Deposits

**Milestone:** M1 · **Covers:** §6 · BR-007. Simulated — no payment gateway (§17).

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| DEP-S1 | Deposit money into my wallet | M | DEP-T4 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| DEP-T1 | `idempotency_keys` migration | S | — |
| DEP-T2 | Idempotency interceptor reading an `Idempotency-Key` header | M | DEP-T1 |
| DEP-T3 | A repeated key returns the original response instead of acting again | M | DEP-T2 |
| DEP-T4 | `DepositService` with BR-007 validation | M | LED-T7 |
| DEP-T5 | Deposit posts balanced ledger entries in one database transaction | M | DEP-T4 |
| DEP-T6 | Deposit endpoint and DTOs | S | DEP-T5 |
| DEP-T7 | Unit tests for deposit rules | S | DEP-T4 |
| DEP-T8 | Integration test: the same key sent twice deposits once | M | DEP-T3 |

**DEP-T2.** Built here, reused by transfers. Retrofitting idempotency onto a live money-moving endpoint is far harder than building it in, and it is the only thing standing between a client timeout-and-retry and a double payment.

---

# EPIC-7 — Transfers

**Milestone:** M1 · **Covers:** §8 · BR-009, BR-010

The reason the project exists.

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| TRF-S1 | Send money to another wallet | L | TRF-T8 |
| TRF-S2 | Attach a note to a transfer for the recipient | S | TRF-S1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| TRF-T1 | `transfers` migration | S | LED-T3 |
| TRF-T2 | `Transfer` entity | S | TRF-T1 |
| TRF-T3 | `TransferService` orchestration | L | LED-T7 |
| TRF-T4 | Validate both wallets exist, differ, and the amount is positive | M | TRF-T3 |
| TRF-T5 | Validate sender is ACTIVE and receiver is ACTIVE or FROZEN | M | TRF-T4 |
| TRF-T6 | Sufficient-funds check before any ledger entry is written | M | TRF-T5 |
| TRF-T7 | Optimistic locking with a bounded retry on conflict | M | TRF-T6 |
| TRF-T8 | One database transaction covering ledger entries and transfer record | M | TRF-T7 |
| TRF-T9 | Idempotency applied to the transfer endpoint | S | DEP-T3 |
| TRF-T10 | Transfer endpoint and DTOs | S | TRF-T8 |
| TRF-T11 | Unit tests, one per BR-009 rule | L | TRF-T6 |
| TRF-T12 | Integration test for the happy path | M | TRF-T10 |
| TRF-T13 | Concurrency test: parallel transfers cannot overdraw a wallet | L | TRF-T7 |
| TRF-T14 | Test: a rejected transfer leaves no ledger entries at all | M | TRF-T6 |

**TRF-T5.** BR-005 is deliberate and easy to get wrong: a FROZEN wallet *can* receive. Freezing is containment against outgoing misuse, not a full lock.

**TRF-T13.** Fire N simultaneous transfers from a wallet that can fund only one. Exactly one succeeds, the balance never goes negative, the ledger still balances. **This test is the point of the whole project.** If it passes reliably, the hard part is done.

---

# EPIC-8 — Transaction History

**Milestone:** M1 · **Covers:** §9 · BR-012

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| HIS-S1 | View my transaction history, newest first | M | HIS-T2 |
| HIS-S2 | Filter my history by wallet, type and date range | S | HIS-S1 |
| HIS-S3 | View the full detail of one transaction | S | HIS-S1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| HIS-T1 | History read model over ledger and transfer records | M | TRF-T8 |
| HIS-T2 | Pagination on every history endpoint | M | HIS-T1 |
| HIS-T3 | Filter parameters and their validation | S | HIS-T2 |
| HIS-T4 | History endpoints and DTOs | S | HIS-T3 |
| HIS-T5 | Ownership filtering — a customer sees only their own transactions | M | WAL-T7 |
| HIS-T6 | Indexes supporting the history queries | S | HIS-T3 |
| HIS-T7 | Integration tests including cross-customer isolation | M | HIS-T5 |

**HIS-T2.** Pagination from the first commit, not once it is slow. An unbounded list endpoint over a financial table is a problem you discover in production.

---

# EPIC-9 — Withdrawals

**Milestone:** M1 · **Covers:** §7 · BR-008. Simulated, like deposits.

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| WDR-S1 | Withdraw money from my wallet | M | WDR-T1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| WDR-T1 | `WithdrawalService` with BR-008 validation | M | LED-T7 |
| WDR-T2 | Reject a withdrawal that would make the balance negative | S | WDR-T1 |
| WDR-T3 | A FROZEN wallet cannot withdraw | S | WDR-T1 |
| WDR-T4 | Withdrawal posts balanced ledger entries atomically | M | WDR-T1 |
| WDR-T5 | Withdrawal endpoint and DTOs | S | WDR-T4 |
| WDR-T6 | Unit and integration tests | M | WDR-T5 |

---

# EPIC-10 — Wallet Lifecycle

**Milestone:** M2 · **Covers:** §5.3, §5.4, §5.5 · BR-005, BR-006, BR-006a, BR-015

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| WLC-S1 | Rename my wallet | S | WLC-T1 |
| WLC-S2 | Close a wallet that has a zero balance | M | WLC-T3 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| WLC-T1 | Rename endpoint and validation | S | WAL-T6 |
| WLC-T2 | Wallet status state machine in a single place | M | WAL-T2 |
| WLC-T3 | Closure requires zero balance and no pending operations | M | WLC-T2 |
| WLC-T4 | Closure is permanent — a CLOSED wallet cannot be reopened | S | WLC-T3 |
| WLC-T5 | FROZEN blocks sending and withdrawing, allows receiving | M | WLC-T2 |
| WLC-T6 | CLOSED blocks every financial operation, incoming and outgoing | S | WLC-T2 |
| WLC-T7 | Unit tests covering every status transition | M | WLC-T2 |
| WLC-T8 | Integration tests for closure and frozen-wallet behaviour | M | WLC-T6 |

**WLC-T2.** One place decides what each status permits. Scattering these checks across services is how a frozen wallet ends up able to send money through one endpoint but not another.

---

# EPIC-11 — Audit Logging

**Milestone:** M2 · **Covers:** §14 · BR-016

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| AUD-S1 | Administrator reviews the audit log | M | AUD-T9 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| AUD-T1 | `audit_log` migration with timestamp and actor | S | — |
| AUD-T2 | `AuditEvent` entity — immutable | S | AUD-T1 |
| AUD-T3 | `AuditService` | M | AUD-T2 |
| AUD-T4 | Record registration, login, logout and password change | M | AUD-T3 |
| AUD-T5 | Record wallet creation, closure, freeze and unfreeze | M | AUD-T3 |
| AUD-T6 | Record deposits, withdrawals and transfers | M | AUD-T3 |
| AUD-T7 | Record every administrative action | M | AUD-T3 |
| AUD-T8 | Revoke UPDATE and DELETE on `audit_log` | S | AUD-T1 |
| AUD-T9 | Audit query endpoint with filters and pagination | M | AUD-T7 |
| AUD-T10 | Integration tests proving each BR-016 event is recorded | M | AUD-T9 |

**AUD-T4 to AUD-T7.** BR-016 lists exactly which events must be audited. Split across four tickets because they land alongside four different epics, not because the code differs.

---

# EPIC-12 — Notifications

**Milestone:** M2 · **Covers:** §11 · BR-013. In-app only in Version 1; real channels are Phase 8.

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| NOT-S1 | View my notifications | S | NOT-T7 |
| NOT-S2 | Mark a notification as read | S | NOT-S1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| NOT-T1 | `notifications` migration | S | — |
| NOT-T2 | `Notification` entity and repository | S | NOT-T1 |
| NOT-T3 | Domain events published from money operations | M | TRF-T8 |
| NOT-T4 | Listeners turning those events into notifications | M | NOT-T3 |
| NOT-T5 | Cover every event BR-013 lists | M | NOT-T4 |
| NOT-T6 | A notification failure must never roll back a financial operation | M | NOT-T4 |
| NOT-T7 | Notification endpoints and DTOs | S | NOT-T5 |
| NOT-T8 | Integration test: notification throws, transfer still commits | M | NOT-T6 |

**NOT-T3.** Spring's `ApplicationEventPublisher`, in process. ADR-0004 defers Kafka until a second consumer actually exists.

**NOT-T6.** BR-013 is explicit about this, and it is easy to get backwards: an event listener inside the transfer transaction can roll the transfer back when it fails.

---

# EPIC-13 — Administration

**Milestone:** M2 · **Covers:** §13 · BR-014, BR-015

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| ADM-S1 | Administrator lists and searches customers | M | ADM-T3 |
| ADM-S2 | Administrator views any wallet | S | ADM-T4 |
| ADM-S3 | Administrator freezes a wallet | M | ADM-T5 |
| ADM-S4 | Administrator unfreezes a wallet | S | ADM-T5 |
| ADM-S5 | Administrator suspends a customer | M | ADM-T6 |
| ADM-S6 | Administrator reactivates a customer | S | ADM-T6 |
| ADM-S7 | Administrator views transfers, deposits and withdrawals | M | ADM-T7 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| ADM-T1 | Administration module and routing under `/admin` | S | AUTH-T11 |
| ADM-T2 | ADMIN role required on every administration endpoint | M | ADM-T1 |
| ADM-T3 | Customer search query with pagination | M | ADM-T2 |
| ADM-T4 | Administrative wallet view bypassing ownership rules | M | WAL-T7 |
| ADM-T5 | Freeze and unfreeze service | M | WLC-T2 |
| ADM-T6 | Suspend and reactivate, revoking refresh tokens on suspend | M | AUTH-T10 |
| ADM-T7 | Administrative transaction views | M | HIS-T1 |
| ADM-T8 | Every administrative action writes an audit record | M | AUD-T7 |
| ADM-T9 | Authorization test: a CUSTOMER token gets 403 on every endpoint | M | ADM-T2 |
| ADM-T10 | Integration tests for each administrative operation | L | ADM-T8 |

**ADM-T9.** An admin API a normal customer can reach is worse than no admin API. One test per endpoint, no exceptions.

**Not in Version 1:** administrators cannot reverse a completed transfer (BR-010). A correction is a new compensating transfer, never a mutation of the original entries.

---

# EPIC-14 — Security Hardening

**Milestone:** M3 · **Covers:** §12 · BR-017

No stories. All of it is invisible until it is missing.

| ID | Type | Title | Size | Depends |
|---|---|---|---|---|
| SEC-T1 | Task | Rate limit the login and register endpoints | M | AUTH-T1 |
| SEC-T2 | Task | Security response headers | S | AUTH-T1 |
| SEC-T3 | Task | CORS policy | S | AUTH-T1 |
| SEC-T4 | Task | Move the JWT secret into real secret configuration | S | — |
| SEC-T5 | Task | Dependency vulnerability scanning in CI | S | FND-T2 |
| SEC-T6 | Task | Request body size limits | S | — |
| SEC-T7 | Task | Confirm no secret, token or hash reaches the logs | S | FND-T8 |
| SEC-T8 | Task | Security-focused integration tests | M | SEC-T1 |

**SEC-T1.** §12 files rate limiting under "future". For anything reachable from the internet it is not: without it the login endpoint is an unlimited password-guessing service.

**SEC-T4.** `.env` holding `JWT_SECRET` is fine locally and is git-ignored. Anywhere real it belongs in the platform's secret store — a leaked signing key lets anyone mint a token for any customer.

---

# EPIC-15 — Observability, API and Delivery

**Milestone:** M3 · **Covers:** §16 · `ROADMAP.md` Phase 5

## Stories

| ID | Title | Size | Depends |
|---|---|---|---|
| OPS-S1 | Operator checks whether the service is healthy and ready | S | OPS-T1 |

## Tasks

| ID | Title | Size | Depends |
|---|---|---|---|
| OPS-T1 | Actuator health and readiness probes | S | — |
| OPS-T2 | Micrometer metrics and a Prometheus endpoint | M | OPS-T1 |
| OPS-T3 | Business metrics: transfer volume, failure rate, latency | M | OPS-T2 |
| OPS-T4 | OpenTelemetry tracing | M | OPS-T2 |
| OPS-T5 | OpenAPI specification via springdoc | S | — |
| OPS-T6 | Version the API under `/api/v1` | S | — |
| OPS-T7 | Populate `docs/api/` | S | OPS-T5 |
| OPS-T8 | Multi-stage Dockerfile | M | — |
| OPS-T9 | Full-stack Docker Compose: application and database | S | OPS-T8 |
| OPS-T10 | Deploy to one real environment | L | OPS-T9 |
| OPS-T11 | Database backup and restore runbook | M | OPS-T10 |

**OPS-T4** is genuinely optional while this is a single process. Do it to learn tracing; skip it to ship.

**OPS-T6** is cheap now and expensive later. Do it before anything else consumes the API.

**OPS-T8.** `Dockerfile` is currently an empty file.

**OPS-T10** matters more than it looks. A project that has never been deployed has never been finished.

---

# Deliberately not created

These appear in `ROADMAP.md` or the vision document. No tickets, on purpose — none of them solves a problem this project currently has.

| Not created | Why |
|---|---|
| Kafka and event-driven infrastructure | Spring application events cover Version 1. Revisit when a second consumer exists. |
| Redis caching | Nothing has been measured as slow. Caching a ledger before measuring it is how balances go stale. |
| Kubernetes, Terraform | One process, one database. Compose is enough. |
| Extracting modules into services | ADR-0001 already rejects this until there is a real reason. |
| Multi-currency and FX | BR-004a defers it. The currency column exists from day one for when it matters. |
| Merchant wallets, QR, gateways, cards | §17 puts them outside Version 1. |
| Fraud detection, AML, risk scoring | Needs production traffic to be anything but theatre. |
| Two-factor authentication | §12 marks it future. SEC-T1 protects more, for less work. |
| Email, push and SMS delivery | BR-013 says Version 1 notifications are in-app. |
| CSV and PDF statement export | §9 marks it future. |

If one becomes necessary, it gets an ADR first, then tickets.

---

# Documentation consistency

Two inconsistencies were found while writing this backlog. Both are now fixed:

* `BUSINESS_RULES.md` §17 referenced an ADR on wallet ownership and currency that had never
  been written. It now exists as `ADR-0003`, and the package-structure decision moved to
  `ADR-0004` so the numbering matches the order the decisions were made.
* `PRODUCT_REQUIREMENTS.md` §18 listed ten open questions that `BUSINESS_RULES.md` had
  already answered. It now records the answers and points at the rule governing each.
