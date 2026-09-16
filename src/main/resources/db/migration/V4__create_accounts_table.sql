CREATE TABLE accounts
(
    id        UUID PRIMARY KEY,
    wallet_id UUID           NOT NULL,
    currency  VARCHAR(3)     NOT NULL,
    balance   NUMERIC(19, 4) NOT NULL DEFAULT 0,
    status    VARCHAR(20)    NOT NULL,
    version   BIGINT         NOT NULL DEFAULT 0,

    CONSTRAINT fk_account_wallet
        FOREIGN KEY (wallet_id)
            REFERENCES wallets (id),

    CONSTRAINT uq_account_wallet_currency
        UNIQUE (wallet_id, currency)
);