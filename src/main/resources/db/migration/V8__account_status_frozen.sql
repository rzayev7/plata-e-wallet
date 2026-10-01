-- BR-005 names the middle state FROZEN: an account that may still receive money
-- but may not send it. The enum was written as BLOCKED, a word that appears
-- nowhere in the product docs, so stored values are renamed to match.

UPDATE accounts SET status = 'FROZEN' WHERE status = 'BLOCKED';

-- The set of statuses is small and closed. A constraint keeps the column honest
-- if a future enum value is added in Java without a migration.
ALTER TABLE accounts
    ADD CONSTRAINT ck_account_status
        CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'));
