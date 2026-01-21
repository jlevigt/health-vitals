BEGIN;

-- LLM requests table for rate limiting and observability
-- Each row represents a single LLM API call

CREATE TABLE llm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to the file being processed
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  -- Provider info
  provider VARCHAR(50) NOT NULL,    -- gemini, openai, deepseek, etc.
  model VARCHAR(100) NOT NULL,
  
  -- Token usage (filled after completion)
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  latency_ms INT,
  
  -- Error tracking (if call failed)
  error_code VARCHAR(100),
  error_message TEXT
);

-- Index for rate limiting queries (count requests in time window)
CREATE INDEX idx_llm_requests_started_at ON llm_requests(started_at);

-- Index for finding requests by file
CREATE INDEX idx_llm_requests_file ON llm_requests(file_id);

COMMIT;
