# Plata Development Backlog

**Focus:** building the banking application. Java 21 + Spring Boot.
**Scope:** 9 Epics · 18 Stories · 71 Implementation Tasks

Every task ends with code committed. Take task 1, code it, test it, commit it, take task 2.

---

# Where the code is right now

Already written and compiling:

- `common/config/SecurityConfig` — a `PasswordEncoder` bean and nothing else
- `common/exception/` — `BusinessException` + `GlobalExceptionHandler` (RFC 7807)
- `customer/` — `Customer` entity, repository, `CustomerService.register/login`, `AuthController` with `/auth/register` and `/auth/login`
- `V1__create_customers_table.sql`

Not written yet: **any test of the business logic**, and **any security** — every endpoint is currently open.

The order below starts from exactly that state.

---

# Build order

| # | Epic | Why here |
|---|---|---|
| 1 | Money | Zero dependencies, pure Java. Everything financial needs it first. |
| 2 | Authentication and Authorization | Nothing customer-scoped can exist until the app knows who is calling. |
| 3 | Customer Profile | Small; finishes the customer domain. |
| 4 | Accounts | Needs Money and Auth. |
| 5 | Transactions and Ledger | Needs Accounts. The financial core. |
| 6 | Deposits | First real money movement. Simplest one. |
| 7 | Withdrawals | Same pattern, plus a balance check. |
| 8 | Transfers | The point of the product. |
| 9 | Transaction History | Needs something to show. |

**MVP is done at the end of Epic 9:** two customers register, log in, open accounts, deposit, transfer, and see their history — with the ledger balancing and concurrent transfers unable to overdraw.

---

# EPIC 1 — Money

### Story 1.1 — My balance is always exact, and the system can never confuse two currencies

New package: `com.plata.common.money`

---

**MON-1 · Create the `Currency` enum**
Depends on: nothing. **This is task #1.**

Write `common/money/Currency.java`: an enum with the ISO code and the number of minor units.
Version 1 is single-currency (BR-004a), so it has one value — `AZN(2)` or whatever your platform currency is.

*Acceptance:*
- `Currency.AZN.minorUnits()` returns `2`
- `Currency.AZN.code()` returns `"AZN"`

---

**MON-2 · Create the `Money` value object**
Depends on: MON-1

Write `common/money/Money.java`. Amount is a `long` in **minor units** — never `double`, never a bare `BigDecimal`.

Factories: `Money.of(long minorUnits, Currency)`, `Money.ofMajor(BigDecimal, Currency)`, `Money.zero(Currency)`.

*Acceptance:*
- `Money.of(1050, AZN)` represents 10.50
- `Money.ofMajor(new BigDecimal("10.50"), AZN).amount() == 1050`
- `Money.ofMajor(new BigDecimal("10.505"), AZN)` throws — more precision than the currency has
- a null currency throws

---

**MON-3 · Arithmetic and comparison**
Depends on: MON-2

Add `plus`, `minus`, `negate`, `isZero`, `isNegative`, `isPositive`, `isGreaterThan`, `isLessThan`.

Negative `Money` is allowed at the type level — a ledger needs to express both directions. Business rules reject negative *amounts*; the type does not.

*Acceptance:*
- adding two different currencies throws `CurrencyMismatchException`
- `Money.of(100, AZN).minus(Money.of(150, AZN))` gives `-50`
- `Money` is immutable — `plus` returns a new instance

---

**MON-4 · Display and conversion**
Depends on: MON-2

Add `toMajorUnits()` returning `BigDecimal`, and `toString()`.

*Acceptance:*
- `Money.of(1050, AZN).toMajorUnits()` equals `new BigDecimal("10.50")`
- `Money.of(5, AZN).toMajorUnits()` equals `new BigDecimal("0.05")`
- `toString()` gives `"10.50 AZN"`

---

**MON-5 · Unit tests for `Money`**
Depends on: MON-3, MON-4

Write `MoneyTest`. Cover zero, positive, negative, addition, subtraction, currency mismatch, both conversions, equality and `hashCode`.

*Acceptance:* every method on `Money` has at least one test; `./mvnw test` is green.

---

**MON-6 · Make `Money` persistable**
Depends on: MON-2

Make `Money` an `@Embeddable` so an entity can hold it as two columns (`..._amount BIGINT`, `..._currency VARCHAR(3)`).

If a record gives trouble as an embeddable, use a final class with a `protected` no-arg constructor — the shape matters less than the round trip.

*Acceptance:* an entity with a `Money` field saves and loads unchanged, verified against real PostgreSQL.

---

**MON-7 · JSON representation for the API**
Depends on: MON-2

Serialize `Money` as `{"amount": "10.50", "currency": "AZN"}` — major units, **as a string**, never a JSON float.

*Acceptance:*
- an endpoint returning `Money.of(1050, AZN)` produces exactly that JSON
- the same JSON deserializes back to the same `Money`

---

# EPIC 2 — Authentication and Authorization

### Story 2.1 — I can register, and the rules are actually tested

**AUTH-1 · Unit tests for `CustomerService.register`**
Depends on: nothing

Write `CustomerServiceTest` with a mocked repository and encoder.

*Acceptance:*
- duplicate email throws `EmailAlreadyExistsException`
- the stored password is a hash, not the raw password
- `"Bob@Example.COM"` is stored as `"bob@example.com"`
- a new customer gets role `CUSTOMER` and status `ACTIVE`

---

**AUTH-2 · Integration test for `POST /auth/register`**
Depends on: AUTH-1

Against real PostgreSQL via the existing Testcontainers setup.

*Acceptance:*
- valid request → 201, body has no `passwordHash` field
- duplicate email → 409
- malformed email → 400
- password shorter than 8 characters → 400

---

### Story 2.2 — I can log in and receive a token

**AUTH-3 · Add Spring Security and a filter chain**
Depends on: nothing

Add `spring-boot-starter-security`. Extend `SecurityConfig` with a `SecurityFilterChain`: stateless sessions, CSRF disabled, `permitAll` on `/auth/register` and `/auth/login`, everything else authenticated.

*Acceptance:*
- `POST /auth/register` still returns 201
- any other endpoint without credentials returns 401, not 200
- no generated password appears in the startup log

---

**AUTH-4 · `JwtTokenService` issuing access tokens**
Depends on: AUTH-3

`jjwt` is already in `pom.xml`; `jwt.secret` and `jwt.access-token-expiration-minutes` are already in `application.yml`. Bind them with `@ConfigurationProperties`.

Claims: `sub` = customer id, plus email and role. Sign HS256.

*Acceptance:*
- an issued token parses back with the right `sub`
- expiry equals now plus the configured minutes — read from config, not a constant
- startup fails loudly if `jwt.secret` is missing

---

**AUTH-5 · `JwtAuthenticationFilter`**
Depends on: AUTH-4

A `OncePerRequestFilter` reading `Authorization: Bearer <token>`, validating it, and populating the `SecurityContext`.

*Acceptance:*
- valid token → request is authenticated
- expired token → 401
- token with a tampered signature → 401
- no header on a protected path → 401

---

**AUTH-6 · `refresh_tokens` migration**
Depends on: nothing

`V2__create_refresh_tokens_table.sql`: id, customer_id FK, `token_hash` UNIQUE, expires_at, revoked_at NULL, created_at.

*Acceptance:* migration applies cleanly; there is no column that could hold a raw token.

---

**AUTH-7 · `RefreshToken` entity and repository**
Depends on: AUTH-6

*Acceptance:* `findByTokenHash` returns the token; the entity has no public setters.

---

**AUTH-8 · `RefreshTokenService` — issue, validate, rotate, revoke**
Depends on: AUTH-7

Generate 256 bits of randomness, hand the raw value to the client **once**, store only its SHA-256 hash.

*Acceptance:*
- the raw token never reaches the database
- using a refresh token rotates it — the old one stops working
- a revoked token is rejected
- an expired token is rejected

---

**AUTH-9 · `POST /auth/login` returns access and refresh tokens**
Depends on: AUTH-5, AUTH-8

Replace the current `CustomerResponse` return with `{accessToken, refreshToken, expiresIn, customer}`.

*Acceptance:*
- valid credentials → 200 with both tokens
- wrong password and unknown email produce the **identical** 401 response
- a `SUSPENDED` customer gets 401

---

**AUTH-10 · `POST /auth/refresh`**
Depends on: AUTH-8

*Acceptance:* a valid refresh token returns a new access token and a new refresh token; the old refresh token then fails with 401.

---

**AUTH-11 · `POST /auth/logout`**
Depends on: AUTH-8

*Acceptance:* revokes the presented refresh token; a refresh with it afterwards returns 401.

---

### Story 2.3 — Endpoints know who is calling

**AUTH-12 · Current-customer resolver**
Depends on: AUTH-5

A way for a controller to receive the authenticated customer id without parsing a token itself — a custom `HandlerMethodArgumentResolver`, or `@AuthenticationPrincipal` on a custom principal.

*Acceptance:* a controller method signature can take the customer id directly; no controller touches `JwtTokenService`.

---

**AUTH-13 · Role-based authorization**
Depends on: AUTH-5

Map `Role` to `ROLE_CUSTOMER` / `ROLE_ADMIN` authorities. Enable method security.

*Acceptance:* an endpoint restricted to ADMIN returns 403 for a valid CUSTOMER token — 403, not 401.

---

**AUTH-14 · Suspended customers lose access**
Depends on: AUTH-9

*Acceptance:* suspending a customer revokes all their refresh tokens; they cannot log in again.

Note the honest limit: an already-issued access token stays valid until it expires. That is why access-token lifetime is short.

---

### Story 2.4 — I can change my password

**AUTH-15 · `POST /auth/password`**
Depends on: AUTH-8, AUTH-12

*Acceptance:*
- requires the current password; a wrong one gives 401
- the new password is validated like registration
- on success, every refresh token for that customer is revoked

---

**AUTH-16 · Integration test for the whole auth flow**
Depends on: AUTH-11, AUTH-15

*Acceptance:* register → login → call a protected endpoint → refresh → call again → logout → refresh fails. One test, one story.

---

# EPIC 3 — Customer Profile

### Story 3.1 — I can see my profile

**CUS-1 · `GET /customers/me`**
Depends on: AUTH-12

*Acceptance:* returns id, email, first name, last name, phone number, created date. Never the password hash.

---

### Story 3.2 — I can edit my profile

**CUS-2 · `PATCH /customers/me`**
Depends on: CUS-1

First name, last name, phone number only.

*Acceptance:* email and role cannot be changed through this endpoint; absent fields are left untouched.

---

**CUS-3 · Profile integration tests**
Depends on: CUS-2

*Acceptance:* an unauthenticated call gets 401; a customer can only ever read and write their own profile.

---

# EPIC 4 — Accounts

New package: `com.plata.account`

### Story 4.1 — I can open an account

**ACC-1 · `accounts` migration**
Depends on: nothing

`V3__create_accounts_table.sql`: id UUID PK, `customer_id` UUID **nullable** FK, `type` VARCHAR(20) (`CUSTOMER` / `SYSTEM`), currency VARCHAR(3), status VARCHAR(20), display_name VARCHAR(100), version BIGINT, created_at TIMESTAMPTZ. Index on customer_id.

**There is no balance column.** Balance is derived from the ledger (LED-7). A separately editable balance column is how money quietly appears and disappears.

`customer_id` is nullable because of the system account in LED-3 — the counterparty for money entering and leaving the platform.

*Acceptance:* migration applies; `./mvnw test` still green.

---

**ACC-2 · `Account` entity and `AccountStatus`**
Depends on: ACC-1, MON-1

`@Entity` with `@Version`. Static factory `Account.open(customerId, currency, displayName)`. **No public setters.** Behaviour methods: `freeze()`, `unfreeze()`, `close()`, `canSend()`, `canReceive()`.

Status rules from BR-005: `ACTIVE` does everything; `FROZEN` can receive but not send or withdraw; `CLOSED` does nothing.

*Acceptance:*
- a new account is `ACTIVE`
- the class has no public setter
- `canReceive()` is true for `FROZEN`, false for `CLOSED`

---

**ACC-3 · `AccountRepository`**
Depends on: ACC-2

*Acceptance:* `findByIdAndCustomerId` and `findAllByCustomerId` exist. Plain `findById` is not used anywhere in customer-facing code.

---

**ACC-4 · Ownership lookup in one place**
Depends on: ACC-3

One method — `AccountService.getOwnedAccount(accountId, customerId)` — that throws `AccountNotFoundException` when the account does not exist **or** is not owned by that customer.

Every account operation goes through it. This is the single most exploited bug in wallet applications: an endpoint that trusts the account id in the URL.

*Acceptance:* the two cases are indistinguishable from outside — both produce 404. A 403 would confirm the account exists.

---

**ACC-5 · `AccountService.open(...)`**
Depends on: ACC-4

*Acceptance:* creates an `ACTIVE`, `CUSTOMER`-type account in the platform currency, owned by the calling customer. A customer may hold several (BR-003).

---

**ACC-6 · `POST /accounts`**
Depends on: ACC-5, AUTH-12

*Acceptance:* 201 with id, currency, status, display name, `balance` of `0.00`, created date.

---

### Story 4.2 — I can see my accounts

**ACC-7 · `GET /accounts`**
Depends on: ACC-6

*Acceptance:* returns only the caller's accounts; never a `SYSTEM` account.

---

**ACC-8 · `GET /accounts/{id}`**
Depends on: ACC-7

*Acceptance:* another customer's account id returns 404.

---

### Story 4.3 — Nobody else can touch my account

**ACC-9 · Account integration tests**
Depends on: ACC-8

*Acceptance:* customer A gets 404 for every operation on customer B's account — read, and later deposit, withdraw and transfer. One test per endpoint.

---

# EPIC 5 — Transactions and Ledger

New package: `com.plata.ledger`. This is the financial core — the rest of the product is endpoints around it.

### Story 5.1 — Every movement of my money is recorded, and my balance can be proven from it

**LED-1 · `transactions` migration**
Depends on: ACC-1

`V4__create_transactions_table.sql`: id UUID PK, type VARCHAR(20) (`DEPOSIT` / `WITHDRAWAL` / `TRANSFER`), `idempotency_key` VARCHAR(255) NULL UNIQUE, note VARCHAR(255) NULL, created_at TIMESTAMPTZ.

A transaction row exists only if the operation succeeded — there is no `FAILED` state to model (BR-010: a rejected operation writes nothing).

*Acceptance:* unique index on `idempotency_key`; migration applies.

---

**LED-2 · `ledger_entries` migration**
Depends on: LED-1

`V5__create_ledger_entries_table.sql`: id UUID PK, transaction_id FK NOT NULL, account_id FK NOT NULL, direction VARCHAR(6) (`DEBIT` / `CREDIT`), amount BIGINT NOT NULL, currency VARCHAR(3) NOT NULL, created_at TIMESTAMPTZ. Index on `(account_id, created_at DESC)`.

Convention, written down once and never varied: **CREDIT increases an account's balance, DEBIT decreases it.**

*Acceptance:* migration applies; the index exists.

---

**LED-3 · Seed the system account**
Depends on: ACC-1

A migration inserting one `SYSTEM` account with a fixed UUID and `customer_id` NULL.

Double entry needs two sides. A deposit is not "the balance goes up" — it is a CREDIT on the customer account and a DEBIT on the system account. Without this, entries cannot balance.

*Acceptance:* the system account exists after migration and never appears in `GET /accounts`.

---

**LED-4 · `Transaction` and `LedgerEntry` entities**
Depends on: LED-2

Both immutable: no setters, no update methods, package-private constructors.

*Acceptance:* nothing outside `com.plata.ledger` can construct a `LedgerEntry`.

---

**LED-5 · The balancing invariant**
Depends on: LED-4

A factory that builds a `Transaction` with its entries and **refuses** to build when: total CREDIT ≠ total DEBIT, entries span more than one currency, or there are fewer than two entries.

This is the invariant the whole platform rests on. It belongs in the factory, not in a service method a future caller can bypass.

*Acceptance:*
- an unbalanced set of entries throws `UnbalancedTransactionException`
- there is no other code path that creates a `LedgerEntry`

---

**LED-6 · `LedgerService.post(...)`**
Depends on: LED-5

`@Transactional`. Saves the transaction and all its entries, or nothing.

*Acceptance:* the only write path into the ledger in the entire codebase.

---

**LED-7 · Balance derived from entries**
Depends on: LED-6

```sql
SELECT COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0)
FROM ledger_entries WHERE account_id = ?
```

Return it as `Money`.

*Acceptance:*
- an account with no entries has a balance of zero
- the balance reflects every posted entry
- there is no balance field stored anywhere

---

**LED-8 · Make the ledger append-only in the database**
Depends on: LED-2

Revoke UPDATE and DELETE on `ledger_entries` and `transactions` from the application role, or add a trigger that raises on either.

BR-011 requires immutability. "We never update that table" is a habit; a revoked grant is a guarantee.

*Acceptance:* an `UPDATE` against `ledger_entries` fails at the database, proven by a test.

---

**LED-9 · Unit tests for the invariant**
Depends on: LED-5

*Acceptance:* unbalanced rejected; mixed currencies rejected; a single entry rejected; a valid two-entry transaction builds.

---

**LED-10 · Integration test: derived balance is correct**
Depends on: LED-7

*Acceptance:* after a sequence of postings, the derived balance equals the arithmetic sum of them.

---

# EPIC 6 — Deposits

### Story 6.1 — I can put money into my account

**DEP-1 · Idempotency**
Depends on: LED-6

Client sends an `Idempotency-Key` header. Before doing anything, look for a transaction with that key: if it exists, return its result instead of acting again.

Build it here and reuse it for withdrawals and transfers. Retrofitting idempotency onto a live money endpoint is far harder than building it in, and it is the only thing standing between a client timeout-and-retry and a double payment.

*Acceptance:* the same request sent twice produces one transaction, one pair of entries, and the same response body both times.

---

**DEP-2 · `DepositService.deposit(...)`**
Depends on: DEP-1, ACC-4

Validate, then post: CREDIT the customer account, DEBIT the system account.

*Acceptance:*
- amount must be greater than zero (BR-007)
- a `CLOSED` account is rejected; `FROZEN` is allowed, since it may receive (BR-005)
- exactly two ledger entries, and they balance
- the whole thing is one database transaction

---

**DEP-3 · `POST /accounts/{id}/deposits`**
Depends on: DEP-2

*Acceptance:* 201 with transaction id, amount, and the new balance. Another customer's account id gives 404.

---

**DEP-4 · Deposit integration tests**
Depends on: DEP-3

*Acceptance:* balance increases by the amount; two balanced entries exist; a repeated idempotency key deposits once; zero and negative amounts are rejected.

---

# EPIC 7 — Withdrawals

### Story 7.1 — I can take money out of my account

**WDR-1 · `WithdrawalService.withdraw(...)`**
Depends on: DEP-2, LED-7

DEBIT the customer account, CREDIT the system account.

*Acceptance:*
- amount greater than zero (BR-008)
- the account must be `ACTIVE` — `FROZEN` cannot withdraw (BR-015)
- balance may never go negative

---

**WDR-2 · Insufficient funds**
Depends on: WDR-1

*Acceptance:* withdrawing more than the balance is rejected with a clear error, **and no ledger entry is written** — the check happens before any posting.

---

**WDR-3 · `POST /accounts/{id}/withdrawals`**
Depends on: WDR-2

*Acceptance:* 201 with transaction id and the new balance; idempotency honoured as in DEP-1.

---

**WDR-4 · Withdrawal integration tests**
Depends on: WDR-3

*Acceptance:* a successful withdrawal reduces the balance; over-withdrawal is rejected and leaves the ledger untouched; a frozen account is rejected.

---

# EPIC 8 — Transfers

### Story 8.1 — I can send money to another account

**TRF-1 · `TransferService.transfer(...)`**
Depends on: DEP-1, LED-6

Signature: source account, destination account, `Money`, optional note, idempotency key.

*Acceptance:* on success, exactly one transaction row and two balanced entries — DEBIT source, CREDIT destination.

---

**TRF-2 · Validation rules**
Depends on: TRF-1

Every rule from BR-009, all of them evaluated **before** any posting:

- the caller owns the source account
- both accounts exist
- they are different accounts
- amount is greater than zero
- source is `ACTIVE`
- destination is `ACTIVE` **or** `FROZEN` — a frozen account can still receive (BR-005). This one is easy to get wrong.
- the source has sufficient funds

*Acceptance:* one unit test per rule, each asserting the specific error.

---

**TRF-3 · Atomicity**
Depends on: TRF-2

One `@Transactional` boundary covering the transaction row and both entries.

*Acceptance:* forcing a failure after the first entry leaves nothing in the database.

---

**TRF-4 · Prevent concurrent overdraw**
Depends on: TRF-3

Because the balance is derived rather than stored, `@Version` on the account does **not** protect it — two concurrent transfers can both read the same balance and both pass the funds check.

Take a pessimistic lock on the source account row (`@Lock(PESSIMISTIC_WRITE)`, i.e. `SELECT ... FOR UPDATE`) before reading the balance, and hold it to the end of the transaction.

*Acceptance:* see TRF-7.

---

**TRF-5 · `POST /transfers`**
Depends on: TRF-4

*Acceptance:* 201 with transaction id, amount and the source account's new balance. An unowned source account gives 404.

---

### Story 8.2 — I can attach a note to a transfer

**TRF-6 · Optional transfer note**
Depends on: TRF-5

Free text, max 255 characters, no functional effect (BR-009).

*Acceptance:* the note is stored and appears in both parties' history; absent is valid.

---

**TRF-7 · Concurrency test**
Depends on: TRF-4

Fund an account with exactly one transfer's worth. Fire ten transfers in parallel from it.

*Acceptance:*
- exactly one succeeds
- the balance never goes negative
- total CREDIT still equals total DEBIT across the ledger

**This test is the point of the whole project.** If it passes reliably, the hard part is done.

---

**TRF-8 · A rejected transfer writes nothing**
Depends on: TRF-2

*Acceptance:* after every rejection case in TRF-2, `transactions` and `ledger_entries` have exactly the row counts they had before.

---

**TRF-9 · Transfer integration tests**
Depends on: TRF-5

*Acceptance:* happy path across two customers; both balances correct afterwards; a repeated idempotency key transfers once.

---

# EPIC 9 — Transaction History

### Story 9.1 — I can see everything that happened to my money

**HIS-1 · History read model**
Depends on: TRF-1

A query joining `transactions` and `ledger_entries` for a given account, returning direction, amount, counterparty, note and timestamp.

*Acceptance:* a transfer appears in both parties' history, with opposite directions.

---

**HIS-2 · Pagination**
Depends on: HIS-1

From the first commit, not once it is slow. An unbounded list endpoint over a financial table is a problem you discover in production.

*Acceptance:* a default page size is applied even when the client asks for none; a maximum page size is enforced.

---

**HIS-3 · `GET /accounts/{id}/transactions`**
Depends on: HIS-2

*Acceptance:* newest first; another customer's account gives 404.

---

**HIS-4 · `GET /transactions` across all my accounts**
Depends on: HIS-3

*Acceptance:* returns entries for every account the caller owns, and nothing else.

---

### Story 9.2 — I can narrow the list down

**HIS-5 · Filters**
Depends on: HIS-4

By type, by account, by date range.

*Acceptance:* filters combine; an invalid date range gives 400.

---

**HIS-6 · Query indexes**
Depends on: HIS-5

*Acceptance:* the history query uses an index — checked with `EXPLAIN`, not by feel.

---

### Story 9.3 — I can look at one transaction in detail

**HIS-7 · `GET /transactions/{id}`**
Depends on: HIS-4

*Acceptance:* full detail including both ledger entries; a transaction touching none of the caller's accounts gives 404.

---

**HIS-8 · Ownership filtering everywhere**
Depends on: HIS-7

*Acceptance:* no history endpoint can return a row that does not belong to one of the caller's accounts. One test per endpoint.

---

**HIS-9 · History integration tests**
Depends on: HIS-8

*Acceptance:* after a deposit, a withdrawal and a transfer, the history shows exactly three entries in the right order with the right directions.

---

# Deferred

Not in this backlog on purpose. Revisit once the MVP runs end to end.

Account freeze and close endpoints · administration APIs · audit log · notifications · rate limiting · observability · OpenAPI · Docker and deployment · multi-currency · Kafka · Redis.
