-- V1: Users

CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    email           TEXT            UNIQUE,
    phone           TEXT            UNIQUE,
    phone_verified  BOOLEAN         NOT NULL DEFAULT false,
    status          TEXT            NOT NULL DEFAULT 'ACTIVE'
                                   CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    tier            TEXT            NOT NULL DEFAULT 'FREE'
                                   CHECK (tier IN ('FREE', 'PREMIUM')),
    created_at      TIMESTAMP       NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
