CREATE TABLE payouts (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id),
    bank_account_id     BIGINT          NOT NULL REFERENCES bank_accounts(id),
    amount              NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    status              TEXT            NOT NULL CHECK (status IN ('INIT', 'PROCESSING', 'SUCCESS', 'FAILED')),
    idempotency_key     TEXT            UNIQUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_user ON payouts(user_id);
