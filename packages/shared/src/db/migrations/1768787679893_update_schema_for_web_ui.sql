-- Migration: update_schema_for_web_ui
-- Created at: 2026-01-18

BEGIN;

-- 1. Reports Table Updates
ALTER TABLE reports
    ADD COLUMN file_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'processing';

COMMIT;
