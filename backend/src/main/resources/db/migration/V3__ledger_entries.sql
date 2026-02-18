CREATE TABLE ledger_entries (
    id              BIGSERIAL       PRIMARY KEY,
    wallet_id       BIGINT          NOT NULL REFERENCES wallets(id),
    amount          NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    direction       TEXT            NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    txn_type        TEXT            NOT NULL CHECK (txn_type IN ('TOPUP', 'P2P', 'WITHDRAW', 'FEE', 'REVERSAL')),
    reference_id    TEXT            NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_reference_id ON ledger_entries(reference_id);
