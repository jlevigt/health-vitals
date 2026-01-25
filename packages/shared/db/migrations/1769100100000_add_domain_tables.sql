BEGIN;


CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL UNIQUE REFERENCES files(id) ON DELETE CASCADE,
  collection_date DATE,
  lab_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE observation_categories (
  id SMALLSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL
);

CREATE TABLE observation_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id SMALLINT REFERENCES observation_categories(id),
  canonical_name VARCHAR(100) UNIQUE NOT NULL,
  base_unit VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  observation_id UUID NOT NULL
    REFERENCES observation_definitions(id),

  raw_name VARCHAR(255) NOT NULL,
  raw_value TEXT NOT NULL,
  raw_unit TEXT,

  normalized_value NUMERIC,
  reference_low NUMERIC,
  reference_high NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);




COMMIT;
