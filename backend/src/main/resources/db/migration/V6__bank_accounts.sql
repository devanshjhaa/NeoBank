CREATE TABLE bank_accounts (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    account_number  TEXT            NOT NULL,
    ifsc_code       TEXT            NOT NULL,
    holder_name     TEXT            NOT NULL,
    verified        BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_user ON bank_accounts(user_id);
