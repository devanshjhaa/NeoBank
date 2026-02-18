CREATE TABLE outbox_events (
    id              BIGSERIAL       PRIMARY KEY,
    event_type      TEXT            NOT NULL,
    payload         JSONB           NOT NULL,
    published       BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_outbox_unpublished ON outbox_events(published) WHERE published = false;
