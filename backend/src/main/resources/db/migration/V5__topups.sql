CREATE TABLE topups (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id),
    amount              NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    status              TEXT            NOT NULL CHECK (status IN ('INIT', 'PROCESSING', 'SUCCESS', 'FAILED')),
    gateway_ref         TEXT            UNIQUE,
    idempotency_key     TEXT            UNIQUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_topup_user ON topups(user_id);
