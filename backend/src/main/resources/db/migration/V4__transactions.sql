CREATE TABLE transactions (
    id                  BIGSERIAL       PRIMARY KEY,
    sender_id           BIGINT          NOT NULL REFERENCES users(id),
    receiver_id         BIGINT          NOT NULL REFERENCES users(id),
    amount              NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    fee                 NUMERIC(18,2)   NOT NULL DEFAULT 0.00,
    status              TEXT            NOT NULL CHECK (status IN ('INIT', 'PROCESSING', 'SUCCESS', 'FAILED')),
    idempotency_key     TEXT            NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_txn_sender ON transactions(sender_id);
CREATE INDEX idx_txn_receiver ON transactions(receiver_id);
