BEGIN;

CREATE TABLE llm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  file_id UUID NOT NULL
    REFERENCES files(id)
    ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL,        -- gemini, openai, deepseek
  model VARCHAR(100) NOT NULL,

  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,

  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,

  latency_ms INT,
  error_code VARCHAR(100),
  error_message TEXT
);

CREATE INDEX idx_llm_requests_started_at ON llm_requests(started_at);
CREATE INDEX idx_llm_requests_file ON llm_requests(file_id);

SELECT COUNT(*)
FROM llm_requests
WHERE started_at >= now() - interval '1 minute';

SELECT COUNT(*)
FROM llm_requests
WHERE started_at >= date_trunc('day', now());

SELECT COALESCE(SUM(total_tokens), 0)
FROM llm_requests
WHERE started_at >= now() - interval '1 minute';

COMMIT;
