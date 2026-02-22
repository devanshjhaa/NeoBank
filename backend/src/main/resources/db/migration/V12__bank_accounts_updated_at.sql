ALTER TABLE bank_accounts
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
