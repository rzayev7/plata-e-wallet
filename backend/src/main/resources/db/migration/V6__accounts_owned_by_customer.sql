-- Accounts belong to a customer directly; the wallet layer is removed.
--
-- Supersedes ADR-0003's wallet aggregate. An account is now the thing a customer
-- owns, matching BACKLOG Story 3.2. A SYSTEM account has no owner: it is the
-- counterparty for money entering and leaving the platform, and belongs to nobody.

ALTER TABLE accounts ADD COLUMN owner_id UUID;
ALTER TABLE accounts ADD COLUMN type VARCHAR(20);

-- Carry existing ownership across before the wallet link disappears.
UPDATE accounts a
SET owner_id = w.customer_id
FROM wallets w
WHERE a.wallet_id = w.id;

UPDATE accounts SET type = 'CUSTOMER' WHERE type IS NULL;

ALTER TABLE accounts ALTER COLUMN type SET NOT NULL;

ALTER TABLE accounts DROP CONSTRAINT uq_account_wallet_currency;
ALTER TABLE accounts DROP COLUMN wallet_id;

ALTER TABLE accounts
    ADD CONSTRAINT fk_account_owner
        FOREIGN KEY (owner_id) REFERENCES customers (id);

-- A customer account always has an owner; a system account never does.
ALTER TABLE accounts
    ADD CONSTRAINT ck_account_owner
        CHECK ((type = 'CUSTOMER' AND owner_id IS NOT NULL)
            OR (type = 'SYSTEM' AND owner_id IS NULL));

-- One account per currency, per customer. A partial index is required because
-- NULL owner_id values are never equal to each other in a plain UNIQUE.
CREATE UNIQUE INDEX uq_account_owner_currency
    ON accounts (owner_id, currency)
    WHERE type = 'CUSTOMER';

-- Exactly one system account per currency.
CREATE UNIQUE INDEX uq_account_system_currency
    ON accounts (currency)
    WHERE type = 'SYSTEM';

DROP TABLE wallets;
