
CREATE TABLE users (
                       id              UUID PRIMARY KEY,
                       email           VARCHAR(255) NOT NULL,
                       password_hash   VARCHAR(255) NOT NULL,
                       role            VARCHAR(20)  NOT NULL,
                       status          VARCHAR(20)  NOT NULL,
                       first_name      VARCHAR(100),
                       last_name       VARCHAR(100),
                       phone_number    VARCHAR(30),
                       created_at      TIMESTAMP    NOT NULL
);

-- case-insensitive email uniqueness (BR-001)
CREATE UNIQUE INDEX uq_users_email_lower ON users (LOWER(email));