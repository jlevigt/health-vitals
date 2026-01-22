BEGIN;

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  object_key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  
  status VARCHAR(30) NOT NULL CHECK (status IN (
  'CREATED',
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED_RETRYABLE',
  'FAILED_TERMINAL'
)),

  error_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enqueued_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_enqueued ON files(enqueued_at);

COMMIT;
