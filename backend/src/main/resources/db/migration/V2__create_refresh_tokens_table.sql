CREATE TABLE refresh_tokens
(
    id          UUID PRIMARY KEY,
    customer_id UUID        NOT NULL REFERENCES customers (id),
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_customer_id ON refresh_tokens (customer_id);