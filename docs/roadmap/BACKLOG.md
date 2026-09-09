# Plata Product Backlog

**Structure:** Epic → Story → Subtask
**Scope:** 8 Epics · 19 Stories · 59 Subtasks

A **Story** is a product capability. Finishing one means a real feature works end to end.
A **Subtask** is a layer of that capability — domain, persistence, use case, API, tests — sized in hours, not minutes. Class names, fields and method signatures belong inside a subtask, never as subtasks of their own.

---

# Where the code is now

Almost nothing. The Java code was deliberately wiped to be rewritten:

- `PlataApplication` — the Spring Boot entry point
- `common/config/SecurityConfig` — a `PasswordEncoder` bean and nothing else
- `V1__create_customers_table.sql` — id, email, password_hash, role, status, first_name, last_name, phone_number, created_at

The `customers` table survives, so Story 1.1 needs no new migration.

There is no exception handling, no error contract, no tests, and no security — `spring-boot-starter-security` is not a dependency yet.

---

# Order

| # | Epic | Stories |
|---|---|---|
| 1 | Authentication and Authorization | 4 |
| 2 | Customer | 2 |
| 3 | Account | 3 |
| 4 | Transactions and Ledger | 2 |
| 5 | Deposits and Withdrawals | 2 |
| 6 | Transfers | 2 |
| 7 | Payments *(post-MVP)* | 3 |
| 8 | Cards *(post-MVP)* | 1 |

**MVP = Epics 1–6.** At the end of Epic 6 two customers can register, log in, open accounts, deposit, transfer and see their history, with the ledger balancing and concurrent transfers unable to overdraw.

Epics 7 and 8 carry stories but no subtasks — PRD §17 puts them outside Version 1, and breaking them down before the design exists would be guesswork.

---

# EPIC 1 — Authentication and Authorization

Covers PRD §3, BR-001, BR-002, BR-017.

## Story 1.1 — User registration

Built from scratch. The `customers` table already exists, so no new migration.

*Done when:* a new customer can be created with a unique, normalized email and a hashed password, and every rule in BR-001 is proven by a test.

- **Implement Customer domain** — `Customer` aggregate with `Role` and `CustomerStatus`. Email as a normalized value object, so `Bob@Example.COM` and `bob@example.com` are one customer (BR-001). No public setters; a factory that assigns `CUSTOMER` and `ACTIVE`. Password policy expressed once, in the domain.
- **Implement persistence** — repository over the existing `customers` table, mapping the aggregate and its enums. Existence lookup by normalized email. No new migration.
- **Implement registration use case** — normalize, check for a duplicate, hash with the `PasswordEncoder` bean, persist. The duplicate check must survive two simultaneous registrations of the same email: rely on the unique constraint, not only on a prior read.
- **Implement registration API** — `POST /auth/register`; 201 on success, 409 on duplicate, 400 on validation failure; a response type structurally incapable of carrying the password hash. Includes the shared error contract — a business-failure base type plus one `@RestControllerAdvice` returning RFC 7807 problem details — since nothing exists yet and every later endpoint reuses it.
- **Add tests** — unit tests for the domain and use case; integration tests for the endpoint against real PostgreSQL. Duplicate rejected, password stored hashed, email lowercased, role and status assigned, no hash in the response.

## Story 1.2 — User login and session tokens

The largest story in the MVP.

*Done when:* a customer logs in, receives an access token and a refresh token, can refresh without re-entering credentials, and can log out so the refresh token stops working.

- **Implement refresh token domain and persistence** — migration, entity and repository. Store a SHA-256 hash only; the raw value goes to the client once and never to the database. Fields for expiry and revocation; lookup by hash and by customer.
- **Implement JWT token service** — issue and validate HS256 access tokens carrying customer id and role, with expiry bound from `jwt.*` configuration rather than a constant. Startup fails loudly if the secret is missing instead of signing with an empty key.
- **Implement Spring Security configuration** — add `spring-boot-starter-security`, a stateless filter chain with CSRF disabled, public paths for register and login, everything else authenticated, and the JWT filter that populates the security context. Adding the starter locks everything by default, so the path rules belong in the same change.
- **Implement authentication use cases** — login, refresh and logout. Credential verification against the stored hash; refresh rotates the token so a reused one is rejected; logout revokes, individually and for a whole customer. BR-002: a wrong password and an unknown email must be indistinguishable, and a suspended customer cannot authenticate.
- **Implement authentication API** — `POST /auth/login`, `/auth/refresh`, `/auth/logout`, and logout from every device (PRD §3.4). Failures are 401 through the error contract, never 500.
- **Add tests** — the full flow: register, log in, call a protected endpoint, refresh, call again, log out, refresh fails. Plus expired, tampered and missing tokens, reused and revoked refresh tokens, and the identical-error rule.

## Story 1.3 — Authorization

*Done when:* protected endpoints reject unauthenticated callers, know which customer is calling, and admin-only endpoints reject a customer token.

- **Implement roles and authorities** — map `Role` onto Spring authorities and enable method security.
- **Implement caller identity resolution** — an argument resolver or custom principal giving a controller the authenticated customer id directly. No controller should ever touch the token service. Every ownership check from Epic 3 onwards is built on this.
- **Secure protected endpoints** — declare the access rules in one place, and make the codes mean the right thing: 401 not authenticated, 403 authenticated but not permitted, 404 exists but belongs to someone else.
- **Add tests** — one per protected endpoint: no token gives 401, a customer token on an admin endpoint gives 403, a valid token reaches the handler with the right customer id.

## Story 1.4 — Password management

*Done when:* a customer can change their password, and doing so ends every other session.

- **Implement the change-password use case** — verify the current password, apply the same policy as registration from the same place, revoke every refresh token for that customer on success.
- **Implement password API** — `POST /auth/password`, authenticated. Wrong current password gives 401, a weak new one gives 400.
- **Add tests** — the old password stops working, the new one works, and a refresh token issued before the change is rejected afterwards.

---

# EPIC 2 — Customer

Covers PRD §4, BR-002, BR-003.

## Story 2.1 — Customer profile

*Done when:* a customer can read and edit their own profile, and can never read or edit anyone else's.

- **Implement profile use case** — read, and partial update of first name, last name and phone number. Email and role are not editable here: changing an email is an identity change needing verification, which is out of Version 1. Absent fields leave existing values untouched rather than nulling them.
- **Implement profile API** — `GET` and `PATCH /customers/me`. The customer comes from the token, never from a path or body parameter, or the endpoint becomes "edit any customer".
- **Add tests** — unauthenticated gives 401; two customers each see only their own profile; a partial update touches only what was sent; email and role changes are refused.

## Story 2.2 — Customer lifecycle

*Done when:* a customer's status governs whether they may authenticate at all.

- **Implement customer status domain** — `ACTIVE` / `SUSPENDED` / `CLOSED` and the allowed transitions, expressed as named methods on the aggregate rather than a setter.
- **Implement status transitions and session revocation** — suspending revokes every refresh token so live sessions end; a suspended or closed customer cannot log in (BR-002). Suspension is always explicit — Version 1 never suspends for inactivity.
- **Add tests** — a suspended customer cannot log in, their refresh tokens stop working, reactivation restores login, a closed customer never logs in again.

---

# EPIC 3 — Account

Covers PRD §5, BR-003, BR-004, BR-004a, BR-005, BR-006.

## Story 3.1 — Money and currency model

Build this before anything stores a balance. Changing the type used for amounts afterwards means rewriting every table, service and test that touches one.

*Done when:* every amount in Plata is a typed value that cannot lose precision or mix currencies.

- **Implement the Money value object** — `Currency` with its ISO code and minor units; `Money` holding a `long` in minor units plus a currency. Never `double`, never a bare `BigDecimal`. Factories from minor and major units, rejecting more precision than the currency has. Arithmetic, negation and comparison; mixing currencies throws. Immutable, with `equals` and `hashCode`. Negative `Money` is legal at the type level because a ledger needs both directions — business rules reject negative amounts, the type does not.
- **Implement Money persistence** — an embeddable mapping to an amount column and a currency column, so any entity can hold one.
- **Implement Money API representation** — serialize as major units in a string: `{"amount": "10.50", "currency": "AZN"}`. Never a JSON float; a float amount is how a balance becomes 10.499999999.
- **Add tests** — every operation, both conversions in both directions, the mismatch failure, equality, a database round trip against real PostgreSQL, and the JSON shape.

## Story 3.2 — Open and view accounts

*Done when:* a customer can open accounts, list them and view one with its balance, and can never reach another customer's account.

- **Implement Account domain** — `Account` aggregate: owner, type (`CUSTOMER` / `SYSTEM`), currency, status, display name, optimistic-locking version. Opening yields `ACTIVE` with a zero balance in the platform currency. **No balance field** — balance is derived from the ledger; a separately editable balance is how money quietly appears and disappears.
- **Implement persistence** — migration and repository. Lookups are always scoped by owner; a plain find-by-id must not be reachable from customer-facing code.
- **Implement account use cases** — open, list mine, view one. **Ownership resolution lives in exactly one method** that every account operation goes through, now and in later epics. An endpoint that trusts the account id in the URL without checking who owns it is the most commonly exploited bug in wallet applications.
- **Implement account API** — create, list, get one. The listing returns only the caller's accounts and never a `SYSTEM` account. Another customer's account id gives 404, not 403 — a 403 confirms it exists.
- **Add tests** — opening gives zero balance and `ACTIVE`; a customer may hold several (BR-003); customer A gets 404 on every operation against customer B's account, written so endpoints added later are covered by construction.

## Story 3.3 — Account lifecycle

*Done when:* an account's status decides what it can do, in one place rather than scattered across services.

- **Implement account status domain** — `ACTIVE` does everything; `FROZEN` may receive but not send or withdraw (BR-005, BR-015) — freezing is containment against outgoing misuse, not a full lock; `CLOSED` does nothing in either direction. Expose the rules as intention-revealing methods so callers ask the account rather than switching on its status.
- **Implement lifecycle use cases** — rename (cosmetic only, no effect on identity, currency or ledger entries — BR-006a), freeze, unfreeze, and close. Closure requires a zero balance and no pending operations, and is permanent: a closed account cannot be reopened and stays visible in history (BR-006).
- **Implement lifecycle API** — rename and close. Closing a non-empty account returns a clear error naming the remaining balance.
- **Add tests** — every transition, valid and invalid, and especially the two easy to get backwards: a frozen account can receive, and a closed one cannot be reopened.

---

# EPIC 4 — Transactions and Ledger

The financial core — everything after this is endpoints around it. Covers PRD §9 and §10, BR-010, BR-011, BR-012, BR-018.

## Story 4.1 — Double-entry ledger

*Done when:* every movement of money is recorded as balanced entries, entries can never be changed, and any balance can be proven by re-deriving it.

- **Implement the ledger domain** — transaction and entry model, with the convention fixed once and never varied: **CREDIT increases an account's balance, DEBIT decreases it**. A factory that **refuses to build an unbalanced transaction** — credits must equal debits, entries must share a currency, at least two entries. This invariant is what the whole platform rests on, so it belongs in the factory, not in a service a future caller can bypass.
- **Implement ledger persistence and immutability** — migrations for transactions and entries, plus the seeded system account that is the counterparty for money entering and leaving the platform. Double entry needs two sides: a deposit is a CREDIT on the customer account and a DEBIT on the system account. Append-only enforced in PostgreSQL as well as Java — revoke UPDATE and DELETE from the application role, or a trigger that raises. BR-011 requires immutability, and a revoked grant is a guarantee where a convention is only a habit.
- **Implement the posting use case** — one transactional service that is **the only write path into the ledger** in the whole codebase. Everything financial goes through it.
- **Implement balance derivation** — balance computed from entries, returned as `Money`, with the index the query needs. An account with no entries has a balance of zero. There is no stored balance anywhere, so this is the single source of truth.
- **Add tests** — unbalanced rejected, mixed currency rejected, a single entry rejected, an `UPDATE` against the ledger fails at the database, and a derived balance equals the arithmetic sum of the postings. These prove money cannot be created or destroyed.

## Story 4.2 — Transaction history

Build after Transfers, so there is something to show.

*Done when:* a customer can see every operation on their accounts, newest first, filtered how they like, and nothing belonging to anyone else.

- **Implement the history read model** — a query joining transactions and entries, returning direction, amount, counterparty, note and timestamp, with the indexes it needs.
- **Implement history use cases** — pagination from the start with an enforced maximum page size; filters by account, type and date range; ownership filtering so a caller can only ever see rows belonging to their own accounts. An unbounded list endpoint over a financial table is a problem you discover in production.
- **Implement history API** — history for one account, history across all my accounts, and one transaction in detail including both entries. An unrelated transaction id gives 404.
- **Add tests** — after a deposit, a withdrawal and a transfer the history shows exactly three entries in the right order and directions; a transfer appears in both parties' history with opposite directions; cross-customer isolation on every endpoint.

---

# EPIC 5 — Deposits and Withdrawals

Simulated in Version 1 — no payment gateway (PRD §17). Covers BR-007, BR-008, BR-015.

## Story 5.1 — Deposit funds

*Done when:* a customer can add money to an account, the ledger balances, and a retried request never deposits twice.

- **Implement idempotency for money-moving operations** — a key recorded with the operation; a repeat returns the original result instead of acting again. Built here and reused by withdrawals and transfers. Retrofitting this onto a live money endpoint is far harder than building it in, and it is the only thing standing between a client timeout-and-retry and a double payment.
- **Implement the deposit use case** — amount must be positive (BR-007), no maximum in Version 1; the account must be able to receive, so `CLOSED` is rejected and `FROZEN` allowed (BR-005); posts exactly two balanced entries in one database transaction.
- **Implement deposit API** — 201 with the transaction id and the new balance; another customer's account gives 404.
- **Add tests** — the balance increases by exactly the amount; two balanced entries exist; the same key twice deposits once; zero, negative and closed-account cases are rejected.

## Story 5.2 — Withdraw funds

*Done when:* a customer can take money out, and can never take out more than they have.

- **Implement the withdrawal use case** — DEBIT the customer account, CREDIT the system account, reusing the idempotency mechanism. Amount positive (BR-008); account must be `ACTIVE`, since a frozen account cannot withdraw (BR-015); the funds check completes before any posting, so a rejected withdrawal writes nothing.
- **Implement withdrawal API** — 201 with the transaction id and the new balance.
- **Add tests** — a successful withdrawal reduces the balance exactly; over-withdrawal is rejected **and leaves the ledger row counts unchanged**; a frozen account is rejected; idempotency behaves as for deposits.

---

# EPIC 6 — Transfers

The point of the product. Finishing this epic completes the MVP. Covers PRD §8, BR-009, BR-010.

## Story 6.1 — Transfer between accounts

*Done when:* one customer can send money to another, atomically, with every rule in BR-009 enforced before anything is written.

- **Implement transfer domain and persistence** — the transfer record with its optional free-text note (up to 255 characters, no functional effect — BR-009), its migration and repository.
- **Implement the transfer use case and rules** — DEBIT source, CREDIT destination, one transaction row and two balanced entries. All of BR-009 evaluated **before any posting**: the caller owns the source; both accounts exist and differ; amount positive; source `ACTIVE`; destination `ACTIVE` **or** `FROZEN`, since a frozen account can still receive (BR-005) — the rule most often got wrong; sufficient funds. Because validation completes first, a rejected transfer leaves no partial state (BR-010). No fees, no limits in Version 1.
- **Implement transfer API** — `POST /transfers`, 201 with the transaction id, amount and the source's new balance; an unowned source gives 404; idempotency reused from Story 5.1.
- **Add tests** — one per BR-009 rule asserting the specific error; a happy path across two customers with both balances correct; the note visible to both; a repeated key transfers once; and after every rejection case the ledger row counts are unchanged.

## Story 6.2 — Concurrency and consistency

*Done when:* concurrent transfers cannot overdraw an account, proven by a test that actually runs them in parallel.

- **Implement the locking strategy** — the non-obvious part of the project. Because the balance is derived rather than stored, optimistic locking does **not** protect it: two concurrent transfers both read the same balance, both pass the funds check, and the account row never changes so no version conflict is raised. Take a pessimistic lock on the source account before reading the balance and hold it for the transaction. Decide what happens on lock timeout, and order lock acquisition so two customers paying each other cannot deadlock.
- **Add the concurrency test suite** — fund an account for exactly one transfer, fire ten in parallel against real PostgreSQL: exactly one succeeds, the balance never goes negative, and total credits still equal total debits. Add the mutual-transfer case for deadlock. **This test is the point of the whole project** — if it passes reliably, the hard part is done.

---

# EPIC 7 — Payments *(post-MVP)*

Outside Version 1 per PRD §15 and §17. Stories record the direction; subtasks come when the design does. Each needs an ADR first.

- **Story 7.1 — Payment requests between customers**
- **Story 7.2 — QR payments**
- **Story 7.3 — Merchant payments**

---

# EPIC 8 — Cards *(post-MVP)*

Outside Version 1 per PRD §17.

- **Story 8.1 — Card management** — issue, view, freeze. Card data is regulated; nothing here is designed without an ADR covering what is stored, what is tokenised, and what never touches the database.

---

# Not in this backlog

Deliberately absent so the product gets built first: CI and DevOps, Docker, structured logging, ArchUnit, observability, OpenAPI, admin APIs, audit log, notifications, rate limiting, multi-currency, Kafka, Redis.
