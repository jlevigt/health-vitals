-- Migration: observations
-- Created at: 2026-01-17T20:21:33.045Z

-- Escreva seu SQL abaixo.
-- Use BEGIN e COMMIT para garantir que a transação seja atômica.

BEGIN;

CREATE TYPE observation_category AS ENUM (
  'lipid_panel',
  'glucose_metabolism',
  'blood_pressure',
  'hematology',
  'hormones',
  'renal_function',
  'liver_function',
  'other'
);


CREATE TYPE observation_unit AS ENUM (
  'mg_dl',
  'mmol_l',
  'percent',
  'ui_l',
  'ng_ml',
  'unknown'
);

CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    report_id UUID NOT NULL
      REFERENCES reports(id)
      ON DELETE CASCADE,

    -- Produto
    category observation_category NOT NULL,
    canonical_name VARCHAR(100) NOT NULL,

    -- Dados brutos
    raw_name VARCHAR(255) NOT NULL,
    raw_value TEXT NOT NULL,
    raw_unit TEXT,

    -- Normalização
    normalized_value NUMERIC,
    base_unit observation_unit NOT NULL DEFAULT 'unknown',

    -- Referências
    reference_low NUMERIC,
    reference_high NUMERIC,

    -- Clínica (opcional)
    loinc_code VARCHAR(20),
    material VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_obs_report
ON observations (report_id);

CREATE INDEX idx_obs_category_user
ON observations (category);

CREATE INDEX idx_obs_canonical
ON observations (canonical_name);

COMMIT;
