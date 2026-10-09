-- Balance is derived from the ledger, never stored (BACKLOG Story 3.2, 4.1).
-- A stored balance is a second source of truth that can silently disagree
-- with the entries that are supposed to explain it.

ALTER TABLE accounts
    DROP COLUMN balance;
