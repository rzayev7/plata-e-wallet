CREATE TABLE transfer
(
    id                    UUID PRIMARY KEY,
    from_which_account_id UUID                     NOT NULL,
    to_which_account_id   UUID                     NOT NULL,
    transfer_amount       BIGINT                   NOT NULL,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_transfer_from_account
        FOREIGN KEY (from_which_account_id)
            REFERENCES accounts (id),

    CONSTRAINT fk_transfer_to_account
        FOREIGN KEY (to_which_account_id)
            REFERENCES accounts (id)
);

CREATE INDEX idx_transfer_from_account ON transfer (from_which_account_id);
CREATE INDEX idx_transfer_to_account ON transfer (to_which_account_id);