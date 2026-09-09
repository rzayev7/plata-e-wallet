# ADR-0003: Wallet Ownership and Currency Model

**Status:** Accepted

**Date:** August 15, 2026

---

# Context

`PRODUCT_REQUIREMENTS.md` §18 listed ten open questions, and `BUSINESS_RULES.md` §17 listed several operational limits as unresolved. Most of them look like product questions, but four of them decide the shape of the `Wallet` aggregate, and therefore cannot be deferred past domain modelling:

1. May a user own more than one wallet?
2. May a wallet hold more than one currency?
3. May a frozen wallet receive incoming transfers?
4. May a wallet be deleted, or only closed?

Leaving these open would mean designing `Wallet` against an unknown, which in practice means designing it wrong and migrating later. A financial schema is the most expensive thing in the system to migrate, because the historical rows cannot simply be recomputed.

A second, related question is what to do with the limits that Version 1 does not need — maximum balance, maximum transaction amount, daily transfer limits, maximum wallets per user. These are easy to add speculatively and hard to remove once something depends on them.

---

# Decision

**1. A user may own many wallets; a wallet has exactly one owner.**

No hard limit in Version 1 (BR-003). The relationship is one-to-many from user to wallet, and the owner is fixed at creation.

**2. A wallet is denominated in a single currency, fixed at creation and never changed.**

Version 1 runs a single platform currency for every wallet and every user (BR-004a). Multi-currency wallets and exchange are out of scope.

However, **the currency column exists on the wallet from the first migration**. It is written, read and validated even though it only ever holds one value today.

**3. A FROZEN wallet may receive incoming transfers, but may not send or withdraw.**

Freezing is a containment measure against outgoing fraud or misuse, not a full lock (BR-005, BR-015). A CLOSED wallet participates in nothing, in either direction.

**4. Wallets are closed, never deleted, and closure is permanent.**

Closure requires a zero balance and no pending operations (BR-006). A closed wallet cannot be reopened and remains visible in historical records. There is no archiving mechanism, because nothing is ever hidden.

**5. Operational limits are not modelled in Version 1.**

Maximum wallets per user, maximum balance, maximum single transaction amount and daily transfer limits are deliberately absent (BR-009, `BUSINESS_RULES.md` §17). They are operational safeguards, not domain rules. When one is needed it arrives as configuration checked in the application service — none of them requires a schema change.

---

# Rationale

**On the currency column (decision 2).** This is the one place where building something unused is cheaper than not building it. Adding a currency column later means migrating every wallet row, every ledger entry, and every amount comparison in the codebase — and doing it against historical financial data that must not change meaning. Adding the column now costs one field that always holds the same value. The rule of thumb elsewhere in this project is to build for today's problem; this is the deliberate exception, and it is narrow: the column exists, the multi-currency *behaviour* does not.

**On frozen wallets receiving (decision 3).** The alternative — a freeze that blocks incoming transfers too — punishes the sender for the recipient's situation. A transfer to a frozen wallet would have to fail, leaving the sender with a failed operation they cannot understand or act on. Blocking only the outgoing direction contains the actual risk.

**On permanent closure (decision 4).** Reopening a closed wallet would mean the wallet lifecycle has a cycle in it, and every ledger query would need to know which period of the wallet's life it is looking at. Permanence keeps the lifecycle a straight line and the ledger unambiguous, at the cost of a customer occasionally having to create a new wallet.

**On absent limits (decision 5).** A limit that exists is a limit that must be configured, tested, explained in an error message, and handled by every caller. None of that work is justified before there is a system to protect. The important part of this decision is that adding them later is cheap — they are checks in a service, not columns in a table.

---

# Consequences

## Positive

* The `Wallet` aggregate can be designed and built now, without guesswork.
* Multi-currency support later is a feature change, not a data migration.
* The wallet lifecycle is a straight line: ACTIVE → FROZEN ↔ ACTIVE → CLOSED, with no way back from CLOSED.
* Version 1 carries no configuration for limits nobody has asked for.

## Negative

* A currency column that holds one value looks like dead weight until multi-currency arrives, and someone will eventually propose removing it.
* Permanent closure will occasionally be the wrong outcome for a customer who closed a wallet by mistake. The remedy is a new wallet, not a reversal.
* A frozen wallet accumulating incoming funds it cannot spend is a state support will have to explain.

---

# Alternatives Considered

## One wallet per user

Rejected. `PRODUCT_REQUIREMENTS.md` §5 assumes several, and the one-to-many relationship costs nothing to model. Collapsing to one later is easy; expanding from one is not.

## Multi-currency wallets in Version 1

Rejected. It pulls in exchange rates, rate sources, rounding policy on conversion, and a per-currency balance model — none of which Version 1 needs. Decision 2 keeps the door open without paying for any of it.

## Deleting wallets

Rejected outright. BR-011 makes ledger entries immutable and BR-012 makes transaction history permanent. A deleted wallet would leave ledger entries pointing at nothing, breaking the referential integrity BR-018 requires.

## Freezing blocks incoming transfers as well

Rejected for now, on the reasoning above. This is the decision in this ADR most likely to be revisited — it is a policy call, not a structural one, and reversing it later costs one condition in the transfer validation.

---

# Review

Revisit this decision if:

* A second currency becomes a real requirement. The column is ready; the behaviour, rounding rules and exchange model still need their own ADR.
* Evidence appears that a frozen wallet accumulating incoming funds causes more support trouble than it prevents fraud.
* Abuse makes a soft limit on wallets per user necessary. That is a configuration change, and does not reopen this ADR.

---

# Related Decisions

* ADR-0001 — Use a Modular Monolith Architecture
* ADR-0004 — Package Structure and Module Boundaries
