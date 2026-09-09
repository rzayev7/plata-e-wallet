# Plata Product Backlog

**Structure:** Epic → Story → Subtask
**Scope:** 8 Epics · 19 Stories · 45 Subtasks

A **Story** is a product capability. Finishing one means a real feature works end to end.
A **Subtask** is a meaningful chunk of engineering — several hours, not a single class.

Take one story, work through its three or four subtasks, and you have shipped a capability.

---

# Where the code is now

- `customer/` — `Customer` entity, repository, `CustomerService.register/login`, `AuthController` with `/auth/register` and `/auth/login`
- `common/` — `PasswordEncoder` bean, `BusinessException`, `GlobalExceptionHandler`
- `V1__create_customers_table.sql`

No tests of business logic. No security — every endpoint is open.

---

# Order

| # | Epic | Stories |
|---|---|---|
| 1 | Authentication & Authorization | 4 |
| 2 | Customer | 2 |
| 3 | Account | 3 |
| 4 | Transactions & Ledger | 2 |
| 5 | Deposits & Withdrawals | 2 |
| 6 | Transfers | 2 |
| 7 | Payments *(post-MVP)* | 3 |
| 8 | Cards *(post-MVP)* | 1 |

**MVP = Epics 1–6.** At the end of Epic 6 two customers can register, log in, open accounts, deposit, transfer and see their history, with the ledger balancing and concurrent transfers unable to overdraw.

Epics 7 and 8 carry stories but no subtasks yet — `PRODUCT_REQUIREMENTS.md` §17 puts them outside Version 1, and breaking them down before the design exists would be guesswork.

---

# EPIC 1 — Authentication & Authorization

Covers PRD §3, BR-001, BR-002, BR-017.

## Story 1.1 — User registration

Registration already works but is untested and unhardened.

*Done when:* a new customer can be created with a unique, normalized email and a hashed password, and every rule in BR-001 is proven by a test.

- **Implement domain, persistence and use case** — email as a normalized value object, password policy, `Customer` invariants and factory. Tighten the existing `CustomerService.register`.
- **Implement REST API** — request validation, 409 on duplicate email, response that can never leak the password hash.
- **Add tests** — unit tests for the use case, integration tests for the endpoint against real PostgreSQL.

## Story 1.2 — User login and session tokens

The largest story in the MVP.

*Done when:* a customer logs in, receives an access token and a refresh token, can refresh without re-entering credentials, and can log out so the refresh token stops working.

- **Implement the authentication flow** — add Spring Security, a stateless `SecurityFilterChain`, public vs protected paths, credential verification, and the BR-002 rule that a wrong password and an unknown email are indistinguishable.
- **Implement JWT and refresh-token handling** — issue and validate signed access tokens from configured properties; refresh tokens stored as hashes only, with rotation on use and revocation (BR-017).
- **Implement REST API** — `login`, `refresh`, `logout`, and logout from every device.
- **Add tests** — the full flow end to end, plus expired, tampered and revoked token cases.

## Story 1.3 — Authorization

*Done when:* protected endpoints reject unauthenticated callers, know which customer is calling, and admin-only endpoints reject a customer token.

- **Implement roles and caller identity** — map `Role` to authorities, enable method security, and give controllers the authenticated customer id without touching tokens.
- **Secure protected endpoints** — declare the access rules once, and make 401 versus 403 mean the right thing.
- **Add tests** — one authorization test per protected endpoint.

## Story 1.4 — Password management

*Done when:* a customer can change their password, and doing so ends every other session.

- **Implement the change-password use case** — verify the current password, apply the same policy as registration, revoke every refresh token for that customer.
- **Implement REST API and tests.**

---

# EPIC 2 — Customer

Covers PRD §4, BR-002, BR-003.

## Story 2.1 — Customer profile

*Done when:* a customer can read and edit their own profile, and can never read or edit anyone else's.

- **Implement domain and use case** — profile read and partial update; email and role are not editable here.
- **Implement REST API** — `GET` and `PATCH /customers/me`.
- **Add tests** — including that an unauthenticated call is rejected.

## Story 2.2 — Customer lifecycle

*Done when:* a customer's status governs whether they may authenticate at all.

- **Implement the status model** — `ACTIVE` / `SUSPENDED` / `CLOSED`, the allowed transitions, and their effect on login and on existing sessions (BR-002).
- **Add tests** — a suspended customer cannot log in and their sessions are revoked.

---

# EPIC 3 — Account

Covers PRD §5, BR-003, BR-004, BR-004a, BR-005, BR-006.

## Story 3.1 — Money and currency model

Build this before anything stores a balance. Changing the money type later means rewriting every table, service and test that touches an amount.

*Done when:* every amount in Plata is a typed value that cannot lose precision or mix currencies.

- **Implement the Money value object** — amount as a `long` in minor units plus a currency; arithmetic, comparison, and a hard failure on mixed currencies. Never `double`, never a bare `BigDecimal`.
- **Implement persistence and API representation** — embeddable mapping to amount and currency columns; JSON as major units in a string, never a float.
- **Add tests** — every operation, both conversions, the mismatch failure, and a database round trip.

## Story 3.2 — Open and view accounts

*Done when:* a customer can open accounts, list them and view one, and can never reach another customer's account.

- **Implement domain, persistence and use case** — `Account` aggregate with status, currency, optimistic locking and a factory; **no balance column** — balance is derived from the ledger. Ownership resolution lives in exactly one method.
- **Implement REST API** — create, list, get one.
- **Add tests** — including that another customer's account id returns 404, not 403: a 403 confirms the account exists.

## Story 3.3 — Account lifecycle

*Done when:* an account's status decides what it can do, in one place rather than scattered across services.

- **Implement the status model and rules** — `ACTIVE` does everything; `FROZEN` may receive but not send or withdraw (BR-005); `CLOSED` does nothing. Closure requires a zero balance and is permanent (BR-006).
- **Implement REST API** — rename and close.
- **Add tests** — every transition, and the frozen-can-receive rule that is easy to get backwards.

---

# EPIC 4 — Transactions & Ledger

The financial core. Covers PRD §9 and §10, BR-010, BR-011, BR-012, BR-018.

## Story 4.1 — Double-entry ledger

*Done when:* every movement of money is recorded as balanced entries, entries can never be changed, and any balance can be proven by re-deriving it.

- **Implement the ledger domain** — transaction and entry model, the system account that is the counterparty for money entering and leaving the platform, and a factory that **refuses to build an unbalanced transaction**. This invariant belongs in the factory, not in a service a future caller can bypass.
- **Implement persistence, posting and immutability** — one posting service as the only write path into the ledger; append-only enforced in the database, not only in Java (BR-011).
- **Implement balance derivation** — balance computed from entries, with the index the query needs.
- **Add tests** — unbalanced rejected, mixed currency rejected, an update against the ledger fails, and a derived balance matches the arithmetic sum of the operations.

## Story 4.2 — Transaction history

*Done when:* a customer can see every operation on their accounts, newest first, and nothing belonging to anyone else.

- **Implement the read model and query** — join transactions and entries, with pagination from the start and filters by account, type and date range.
- **Implement REST API** — history per account, history across all my accounts, and one transaction in detail.
- **Add tests** — a transfer appears in both parties' history with opposite directions; no endpoint can return a row the caller does not own.

---

# EPIC 5 — Deposits & Withdrawals

Simulated in Version 1 — no payment gateway (PRD §17). Covers BR-007, BR-008.

## Story 5.1 — Deposit funds

*Done when:* a customer can add money to an account, the ledger balances, and a retried request never deposits twice.

- **Implement idempotency for money-moving operations** — an idempotency key on the operation, so a repeat returns the original result instead of acting again. Built here and reused by withdrawals and transfers; retrofitting it later is far harder, and it is the only thing standing between a client timeout-and-retry and a double payment.
- **Implement the deposit use case** — amount must be positive; account must be able to receive; post balanced entries in one database transaction.
- **Implement REST API and tests** — including that the same key sent twice deposits once.

## Story 5.2 — Withdraw funds

*Done when:* a customer can take money out, and can never take out more than they have.

- **Implement the withdrawal use case** — positive amount, sufficient funds, account must be `ACTIVE` (a frozen account cannot withdraw, BR-015), balanced entries.
- **Implement REST API and tests** — over-withdrawal is rejected **and leaves the ledger untouched**, because validation completes before any posting.

---

# EPIC 6 — Transfers

The point of the product. Covers PRD §8, BR-009, BR-010.

## Story 6.1 — Transfer between accounts

*Done when:* one customer can send money to another, atomically, with every rule in BR-009 enforced before anything is written.

- **Implement the transfer use case and rules** — caller owns the source; both accounts exist and differ; positive amount; source `ACTIVE`; destination `ACTIVE` **or** `FROZEN`; sufficient funds. All checks complete before any posting, so a rejected transfer leaves no partial state.
- **Implement REST API** — including the optional free-text note, and idempotency reused from Story 5.1.
- **Add tests** — one per rule, plus a happy path across two customers and a check that a rejected transfer wrote nothing.

## Story 6.2 — Concurrency and consistency

*Done when:* concurrent transfers cannot overdraw an account, proven by a test that actually runs them in parallel.

- **Implement the locking strategy** — because the balance is derived rather than stored, optimistic locking on the account does **not** protect it: two concurrent transfers can both read the same balance and both pass the funds check. Take a pessimistic lock on the source account and hold it for the transaction.
- **Add the concurrency test suite** — fund an account for exactly one transfer, fire ten in parallel: exactly one succeeds, the balance never goes negative, and total debits still equal total credits. **This test is the point of the whole project.**

---

# EPIC 7 — Payments *(post-MVP)*

Outside Version 1 per PRD §15 and §17. Stories are listed so the direction is recorded; subtasks come when the design does.

- **Story 7.1 — Payment requests between customers**
- **Story 7.2 — QR payments**
- **Story 7.3 — Merchant payments**

Each needs an ADR before implementation.

---

# EPIC 8 — Cards *(post-MVP)*

Outside Version 1 per PRD §17.

- **Story 8.1 — Card management** — issue, view, freeze.

---

# Not in this backlog

Deliberately absent so the product gets built first: CI and DevOps, Docker, structured logging, ArchUnit, observability, OpenAPI, admin APIs, audit log, notifications, rate limiting, multi-currency, Kafka, Redis.

They matter, and several are cheap. They are simply not what stands between Plata and a working banking application today.
