CREATE TABLE customers (
    id            UUID         PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    phone_number  VARCHAR(30),
    created_at    TIMESTAMPTZ  NOT NULL
);

-- BR-001: one customer per email address.
-- The application always stores email lowercase, so a plain UNIQUE is enough.
ALTER TABLE customers ADD CONSTRAINT uq_customers_email UNIQUE (email);
