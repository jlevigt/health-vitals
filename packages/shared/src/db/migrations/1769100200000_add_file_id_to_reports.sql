BEGIN;

-- Add file_id to reports to link them to the source file
-- This allows tracking which file generated which report

ALTER TABLE reports 
  ADD COLUMN file_id UUID REFERENCES files(id) ON DELETE SET NULL;

-- Unique constraint: one report per file (can be null for legacy data)
CREATE UNIQUE INDEX idx_reports_file_id ON reports(file_id) WHERE file_id IS NOT NULL;

COMMIT;
