CREATE TABLE wallets
(
    id            UUID PRIMARY KEY,
    customer_id   UUID                     NOT NULL UNIQUE,
    wallet_status VARCHAR(20)              NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_wallet_customer
        FOREIGN KEY (customer_id)
            REFERENCES customers (id)
);