-- V2: Wallets

CREATE TABLE wallets (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    balance         NUMERIC(18,2)   NOT NULL DEFAULT 0.00
                                   CHECK (balance >= 0),
    currency        CHAR(3)         NOT NULL DEFAULT 'INR'
                                   CHECK (currency = 'INR'),
    status          TEXT            NOT NULL DEFAULT 'ACTIVE'
                                   CHECK (status IN ('ACTIVE', 'FROZEN')),
    created_at      TIMESTAMP       NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT now(),

    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
