-- A balance stored on the account itself.
--
-- V5 removed this column on purpose. It comes back as a deliberate intermediate
-- step: build the simple version first, then replace it with a double-entry
-- ledger and see for yourself what the ledger buys. The ledger migration will
-- drop this column again.
--
-- Minor units, matching com.plata.common.money.Money: 1050 is 10.50 AZN.

ALTER TABLE accounts
    ADD COLUMN balance BIGINT NOT NULL DEFAULT 0;
