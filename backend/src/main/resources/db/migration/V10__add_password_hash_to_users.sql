-- V10: Add password_hash to users table for email/password auth

ALTER TABLE users
    ADD COLUMN password_hash TEXT;

ALTER TABLE users
    ALTER COLUMN email SET NOT NULL;
