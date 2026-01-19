-- Migration: reports
-- Created at: 2026-01-17T20:19:24.087Z

-- Escreva seu SQL abaixo.
-- Use BEGIN e COMMIT para garantir que a transação seja atômica.

BEGIN;

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    collection_date DATE NOT NULL,
    lab_name VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_user_date
ON reports (user_id, collection_date);

COMMIT;
