BEGIN;

-- Files table for tracking uploaded files and their processing status
-- This is the job table - each file represents a processing job

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File metadata
  original_filename VARCHAR(255) NOT NULL,
  object_key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  content_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  
  -- Processing state machine
  -- CREATED: Initial state after signed URL requested
  -- QUEUED: Upload confirmed, job published to queue
  -- PROCESSING: Worker has picked up the job
  -- SUCCEEDED: Processing completed successfully
  -- FAILED_RETRYABLE: Temporary failure, can be retried
  -- FAILED_TERMINAL: Permanent failure, cannot be retried
  status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (status IN (
    'CREATED',
    'QUEUED',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED_RETRYABLE',
    'FAILED_TERMINAL'
  )),
  
  -- Error tracking
  error_code VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enqueued_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

-- Index for listing user's files  
CREATE INDEX idx_files_user_id ON files(user_id);

-- Index for querying by status (worker recovery, admin views)
CREATE INDEX idx_files_status ON files(status);

-- Index for ordering by queue time
CREATE INDEX idx_files_enqueued ON files(enqueued_at);

COMMIT;
