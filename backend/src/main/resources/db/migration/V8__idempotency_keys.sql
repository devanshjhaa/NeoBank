CREATE TABLE idempotency_keys (
    id              BIGSERIAL       PRIMARY KEY,
    key             TEXT            NOT NULL UNIQUE,
    request_hash    TEXT            NOT NULL,
    response_body   TEXT            NOT NULL,
    response_status INT             NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);
