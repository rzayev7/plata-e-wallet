# Plata Business Rules

**Version:** 1.1
**Status:** Draft
**Project:** Plata Digital Wallet Platform

---

# 1. Purpose

This document defines the business rules governing the Plata digital wallet platform.

Business rules describe the constraints, validations, and policies that determine how the platform behaves. They are independent of implementation details, programming languages, databases, or frameworks.

If a business rule changes, the software implementation should adapt accordingly.

---

# 2. General Principles

The following principles apply throughout the platform:

* Financial correctness always takes priority over convenience.
* Every financial operation must be auditable.
* Historical financial data must never be lost.
* Users must only access resources they own unless explicitly authorized.
* Every operation must produce a predictable outcome.
* Business rules must be enforced consistently across all APIs.

---

# 3. User Rules

## BR-001 User Registration

* Every user must register with a unique email address.
* Email addresses are case-insensitive.
* Passwords must never be stored in plain text.
* A user account is uniquely identified by its ID.
* Every newly created account is assigned the default role of USER.

---

## BR-002 User Authentication

* Only authenticated users may access protected resources.
* Invalid credentials must not reveal whether the email exists.
* Suspended users cannot authenticate.
* Deleted users cannot authenticate.
* Inactive users are **not** automatically suspended in Version 1; suspension is always an explicit administrative action.

---

## BR-003 User Ownership

* A user may own **one or more** wallets. There is no hard limit on the number of wallets per user in Version 1. If abuse or operational concerns arise, a configurable soft limit may be introduced later — this is an operational safeguard, not a product constraint, and does not require a schema change.
* Every wallet has exactly one owner.
* Users may only access their own wallets unless they have administrative privileges.

---

# 4. Wallet Rules

## BR-004 Wallet Creation

* Every wallet must have a unique identifier.
* A wallet must belong to exactly one user.
* A wallet is created with a balance of zero.
* A wallet is created in the ACTIVE state.
* **Every wallet is denominated in a single fixed currency, set at creation and never changed.** Version 1 supports a single platform currency only (see BR-004a); the per-wallet currency field exists so that multi-currency support (Vision Document, "Future Capabilities") can be added later without a schema migration.

## BR-004a Currency (Version 1)

* Version 1 operates a single platform currency for all wallets and all users.
* Multi-currency wallets and currency exchange are explicitly deferred (see §16).

---

## BR-005 Wallet Status

A wallet may exist in one of the following states:

* ACTIVE
* FROZEN
* CLOSED

Rules:

* ACTIVE wallets may perform all supported operations.
* FROZEN wallets cannot send money and cannot withdraw.
* FROZEN wallets **can** receive incoming transfers. This is a deliberate Version 1 decision — freezing a wallet is a containment measure against outgoing fraud/misuse, not a full lock — and may be revisited in a future ADR if evidence suggests otherwise.
* CLOSED wallets cannot participate in any financial operation, incoming or outgoing.

---

## BR-006 Wallet Closure

A wallet may only be closed when:

* Its balance equals zero.
* No pending operations exist.

Closed wallets:

* Cannot be reopened. Closure is permanent by design, keeping the wallet lifecycle simple and the ledger unambiguous.
* Remain visible in historical records (no archiving mechanism needed, since they are never hidden).

---

## BR-006a Wallet Renaming

* Users may set and change a wallet's display name at any time.
* The display name is cosmetic only and has no effect on wallet identity, currency, or ledger entries.

---

# 5. Deposit Rules

## BR-007 Deposits

* Deposit amount must be greater than zero.
* Every successful deposit increases wallet balance.
* Every deposit must create ledger records.
* Every deposit must create transaction history.
* Every deposit must be auditable.
* Deposits are atomic.
* No maximum deposit amount is enforced in Version 1 (see §17 for the future limits track).

---

# 6. Withdrawal Rules

## BR-008 Withdrawals

* Withdrawal amount must be greater than zero.
* Wallet balance cannot become negative.
* Withdrawals are atomic.
* Every withdrawal creates ledger records.
* Every withdrawal creates transaction history.
* Every withdrawal is auditable.

---

# 7. Transfer Rules

## BR-009 Money Transfers

Transfers are subject to the following rules:

* Sender wallet must exist.
* Receiver wallet must exist.
* Sender wallet must be ACTIVE.
* Receiver wallet must be ACTIVE or FROZEN (see BR-005).
* Sender and receiver must be different wallets.
* Transfer amount must be greater than zero.
* Sender must have sufficient funds.
* Sender balance cannot become negative.
* Transfer must complete atomically.
* An optional free-text reference/note may be attached to a transfer for the recipient's context; it has no functional effect.
* Every successful transfer creates transaction history.
* Every successful transfer creates ledger entries.
* Every successful transfer creates an audit log.
* Every successful transfer generates notifications for both users.
* **No transaction fees apply in Version 1.**
* **No daily or per-transaction transfer limits apply in Version 1.**

---

## BR-010 Transfer Integrity

* Money must never be created unintentionally.
* Money must never disappear unintentionally.
* Every debit must have a corresponding credit.
* Failed transfers must leave balances unchanged: validation happens before any ledger entry is written, so a rejected transfer produces no partial state.
* **Administrators cannot directly reverse a completed transfer in Version 1.** Because ledger entries are immutable (BR-011), a correction is always performed as a new, separate compensating transfer, never as a mutation or deletion of the original entries. This preserves a truthful audit trail at the cost of a slightly less convenient support workflow — an acceptable trade-off given the project's correctness-first principles.

---

# 8. Ledger Rules

## BR-011 Ledger Integrity

The ledger is the financial source of truth.

Rules:

* Every balance change must be represented by ledger entries.
* Ledger entries are immutable.
* Ledger entries must never be deleted.
* Ledger history must support complete financial auditing.

---

# 9. Transaction History Rules

## BR-012 Transaction History

* Every financial operation generates a transaction record.
* Historical transactions cannot be deleted.
* Historical transactions cannot be modified.
* Transaction timestamps must accurately reflect execution time.

---

# 10. Notification Rules

## BR-013 Notifications

The platform shall notify users after:

* Wallet creation
* Deposit completion
* Withdrawal completion
* Money received
* Money sent
* Password change
* Wallet frozen
* Wallet unfrozen

Notification delivery failures must not cancel financial operations. Version 1 notifications are simulated/in-app; real delivery channels (email/push/SMS) are introduced in Phase 8 (see `ROADMAP.md`).

---

# 11. Administrative Rules

## BR-014 Administrative Access

Administrators may:

* View users.
* View wallets.
* View transactions.
* Freeze wallets.
* Unfreeze wallets.
* Suspend users.
* Review audit logs.

Administrative actions must always be recorded.

---

## BR-015 Wallet Freeze

Frozen wallets:

* Cannot send money.
* Cannot perform withdrawals.
* Can receive incoming transfers (see BR-005).

---

# 12. Audit Rules

## BR-016 Audit Logging

The following events must be audited:

* Registration
* Login
* Logout
* Password change
* Wallet creation
* Wallet closure
* Deposit
* Withdrawal
* Transfer
* Wallet freeze
* Wallet unfreeze
* User suspension
* Administrative actions

Audit records:

* Must be immutable.
* Must never be deleted.
* Must include timestamp and actor.

---

# 13. Security Rules

## BR-017 Security

* Passwords must be encrypted using a strong hashing algorithm.
* Access tokens have an expiration time.
* Refresh tokens may be revoked.
* Authorization must be verified for every protected operation.
* Users may only access their own resources.

---

# 14. Data Integrity Rules

## BR-018 Data Consistency

The platform must ensure:

* Referential integrity.
* Transactional consistency.
* No orphan financial records.
* No duplicate wallet identifiers.
* No duplicate transaction identifiers.

---

# 15. Error Handling Rules

## BR-019 Validation

The system shall reject operations when:

* Required information is missing.
* Invalid values are supplied.
* Business rules are violated.
* Requested resources do not exist.
* User lacks sufficient permissions.

Validation errors must not modify system state.

---

# 16. Future Business Rules

The following rules will be defined when the corresponding features are implemented:

* Multi-currency wallets
* Currency exchange
* Scheduled transfers
* Recurring payments
* Merchant payments
* QR payments
* Payment requests
* Card management
* External payment gateway integrations
* Fraud detection
* AML monitoring
* Transaction fees
* Daily transfer limits
* Spending limits
* Shared wallets

---

# 17. Deferred Limits (Operational Safeguards, Not V1 Product Rules)

The following are explicitly **not** business rules in Version 1 — no functional requirement depends on them — but may be introduced later as configurable operational safeguards without changing the domain model:

* Maximum number of wallets per user (soft limit, if abuse is observed).
* Maximum wallet balance.
* Maximum single transaction amount.
* Daily transfer limits.

These decisions are recorded in `docs/adr/0003-wallet-ownership-and-currency-model.md`. Historically, this section listed them as "open questions"; they were resolved during Phase 1/2 domain-modeling work rather than left unresolved into implementation, on the recommendation that ambiguity here would directly affect the `Wallet` aggregate design.