export type BiomarkerCategory =
  | "lipid_panel"
  | "glucose_metabolism"
  | "renal_function"
  | "hematology"
  | "other";

export interface CanonicalBiomarker {
  canonicalName: string;
  category?: BiomarkerCategory;
  loincCode?: string;
}

/**
 * LOINC code -> standardized canonical biomarker registry
 * Covers core clinical panels (lipid, glucose, renal, hematology, liver, thyroid, vitamins).
 */
const LOINC_TO_BIOMARKER: Readonly<Record<string, CanonicalBiomarker>> = {
  // Lipid Panel
  "2093-3": { canonicalName: "total_cholesterol", category: "lipid_panel", loincCode: "2093-3" },
  "2085-9": { canonicalName: "hdl_cholesterol", category: "lipid_panel", loincCode: "2085-9" },
  "2089-1": { canonicalName: "ldl_cholesterol", category: "lipid_panel", loincCode: "2089-1" },
  "13457-7": { canonicalName: "ldl_cholesterol", category: "lipid_panel", loincCode: "13457-7" },
  "18262-6": { canonicalName: "ldl_cholesterol", category: "lipid_panel", loincCode: "18262-6" },
  "2571-8": { canonicalName: "triglycerides", category: "lipid_panel", loincCode: "2571-8" },
  "13458-5": { canonicalName: "vldl_cholesterol", category: "lipid_panel", loincCode: "13458-5" },
  "2091-7": { canonicalName: "vldl_cholesterol", category: "lipid_panel", loincCode: "2091-7" },
  "43396-1": {
    canonicalName: "non_hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "43396-1",
  },

  // Glucose Metabolism
  "1558-6": {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  "2345-7": {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "2345-7",
  },
  "2339-0": {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "2339-0",
  },
  "4548-4": { canonicalName: "hba1c", category: "glucose_metabolism", loincCode: "4548-4" },
  "17856-6": { canonicalName: "hba1c", category: "glucose_metabolism", loincCode: "17856-6" },
  "27353-2": {
    canonicalName: "estimated_average_glucose",
    category: "glucose_metabolism",
    loincCode: "27353-2",
  },
  "20448-7": { canonicalName: "insulin", category: "glucose_metabolism", loincCode: "20448-7" },

  // Renal Function
  "2160-0": { canonicalName: "creatinine", category: "renal_function", loincCode: "2160-0" },
  "3094-0": { canonicalName: "urea", category: "renal_function", loincCode: "3094-0" },
  "3084-1": { canonicalName: "uric_acid", category: "renal_function", loincCode: "3084-1" },
  "62238-1": { canonicalName: "egfr", category: "renal_function", loincCode: "62238-1" },
  "98979-8": { canonicalName: "egfr", category: "renal_function", loincCode: "98979-8" },
  "33914-3": { canonicalName: "egfr", category: "renal_function", loincCode: "33914-3" },
  "1751-7": { canonicalName: "albumin", category: "renal_function", loincCode: "1751-7" },

  // Hematology
  "718-7": { canonicalName: "hemoglobin", category: "hematology", loincCode: "718-7" },
  "4544-3": { canonicalName: "hematocrit", category: "hematology", loincCode: "4544-3" },
  "789-8": { canonicalName: "erythrocytes", category: "hematology", loincCode: "789-8" },
  "6690-2": { canonicalName: "leukocytes", category: "hematology", loincCode: "6690-2" },
  "751-8": { canonicalName: "neutrophils", category: "hematology", loincCode: "751-8" },
  "731-0": { canonicalName: "lymphocytes", category: "hematology", loincCode: "731-0" },
  "711-2": { canonicalName: "eosinophils", category: "hematology", loincCode: "711-2" },
  "704-7": { canonicalName: "basophils", category: "hematology", loincCode: "704-7" },
  "742-7": { canonicalName: "monocytes", category: "hematology", loincCode: "742-7" },
  "777-3": { canonicalName: "platelets", category: "hematology", loincCode: "777-3" },
  "2276-4": { canonicalName: "ferritin", category: "hematology", loincCode: "2276-4" },

  // Vitamins & Electrolytes
  "2132-9": { canonicalName: "vitamin_b12", category: "other", loincCode: "2132-9" },
  "1989-3": { canonicalName: "vitamin_d", category: "other", loincCode: "1989-3" },
  "2951-2": { canonicalName: "sodium", category: "renal_function", loincCode: "2951-2" },
  "2823-3": { canonicalName: "potassium", category: "renal_function", loincCode: "2823-3" },
};

/**
 * Normalized PT-BR & EN aliases -> standardized canonical biomarker
 */
const ALIAS_TO_BIOMARKER: Readonly<Record<string, CanonicalBiomarker>> = {
  // Lipid Panel
  total_cholesterol: {
    canonicalName: "total_cholesterol",
    category: "lipid_panel",
    loincCode: "2093-3",
  },
  cholesterol_total: {
    canonicalName: "total_cholesterol",
    category: "lipid_panel",
    loincCode: "2093-3",
  },
  colesterol_total: {
    canonicalName: "total_cholesterol",
    category: "lipid_panel",
    loincCode: "2093-3",
  },
  dosagem_de_colesterol_total: {
    canonicalName: "total_cholesterol",
    category: "lipid_panel",
    loincCode: "2093-3",
  },
  colesterol: { canonicalName: "total_cholesterol", category: "lipid_panel", loincCode: "2093-3" },

  hdl: { canonicalName: "hdl_cholesterol", category: "lipid_panel", loincCode: "2085-9" },
  hdl_c: { canonicalName: "hdl_cholesterol", category: "lipid_panel", loincCode: "2085-9" },
  hdl_cholesterol: {
    canonicalName: "hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "2085-9",
  },
  colesterol_hdl: {
    canonicalName: "hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "2085-9",
  },
  hdl_colesterol: {
    canonicalName: "hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "2085-9",
  },
  dosagem_de_colesterol_hdl: {
    canonicalName: "hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "2085-9",
  },

  ldl: { canonicalName: "ldl_cholesterol", category: "lipid_panel", loincCode: "2089-1" },
  ldl_c: { canonicalName: "ldl_cholesterol", category: "lipid_panel", loincCode: "2089-1" },
  ldl_cholesterol: {
    canonicalName: "ldl_cholesterol",
    category: "lipid_panel",
    loincCode: "2089-1",
  },
  colesterol_ldl: {
    canonicalName: "ldl_cholesterol",
    category: "lipid_panel",
    loincCode: "2089-1",
  },
  ldl_colesterol: {
    canonicalName: "ldl_cholesterol",
    category: "lipid_panel",
    loincCode: "2089-1",
  },
  dosagem_de_colesterol_ldl: {
    canonicalName: "ldl_cholesterol",
    category: "lipid_panel",
    loincCode: "2089-1",
  },

  vldl: { canonicalName: "vldl_cholesterol", category: "lipid_panel", loincCode: "13458-5" },
  vldl_cholesterol: {
    canonicalName: "vldl_cholesterol",
    category: "lipid_panel",
    loincCode: "13458-5",
  },
  colesterol_vldl: {
    canonicalName: "vldl_cholesterol",
    category: "lipid_panel",
    loincCode: "13458-5",
  },
  vldl_colesterol: {
    canonicalName: "vldl_cholesterol",
    category: "lipid_panel",
    loincCode: "13458-5",
  },

  non_hdl_cholesterol: {
    canonicalName: "non_hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "43396-1",
  },
  colesterol_nao_hdl: {
    canonicalName: "non_hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "43396-1",
  },
  nao_hdl_colesterol: {
    canonicalName: "non_hdl_cholesterol",
    category: "lipid_panel",
    loincCode: "43396-1",
  },
  nao_hdl: { canonicalName: "non_hdl_cholesterol", category: "lipid_panel", loincCode: "43396-1" },
  non_hdl: { canonicalName: "non_hdl_cholesterol", category: "lipid_panel", loincCode: "43396-1" },

  triglycerides: { canonicalName: "triglycerides", category: "lipid_panel", loincCode: "2571-8" },
  triglicerideos: { canonicalName: "triglycerides", category: "lipid_panel", loincCode: "2571-8" },
  triglicerides: { canonicalName: "triglycerides", category: "lipid_panel", loincCode: "2571-8" },
  dosagem_de_triglicerideos: {
    canonicalName: "triglycerides",
    category: "lipid_panel",
    loincCode: "2571-8",
  },
  dosagem_de_triglicerides: {
    canonicalName: "triglycerides",
    category: "lipid_panel",
    loincCode: "2571-8",
  },

  // Glucose Metabolism
  fasting_glucose: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glucose: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicose: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicemia: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicose_jejum: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicose_em_jejum: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicemia_jejum: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  glicemia_em_jejum: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },
  dosagem_de_glicose_em_jejum: {
    canonicalName: "fasting_glucose",
    category: "glucose_metabolism",
    loincCode: "1558-6",
  },

  hba1c: { canonicalName: "hba1c", category: "glucose_metabolism", loincCode: "4548-4" },
  a1c: { canonicalName: "hba1c", category: "glucose_metabolism", loincCode: "4548-4" },
  hemoglobin_a1c: { canonicalName: "hba1c", category: "glucose_metabolism", loincCode: "4548-4" },
  hemoglobina_glicada: {
    canonicalName: "hba1c",
    category: "glucose_metabolism",
    loincCode: "4548-4",
  },
  hemoglobina_glicada_a1c: {
    canonicalName: "hba1c",
    category: "glucose_metabolism",
    loincCode: "4548-4",
  },

  estimated_average_glucose: {
    canonicalName: "estimated_average_glucose",
    category: "glucose_metabolism",
    loincCode: "27353-2",
  },
  glicemia_media_estimada: {
    canonicalName: "estimated_average_glucose",
    category: "glucose_metabolism",
    loincCode: "27353-2",
  },
  estimativa_da_glicemia_media: {
    canonicalName: "estimated_average_glucose",
    category: "glucose_metabolism",
    loincCode: "27353-2",
  },
  egm: {
    canonicalName: "estimated_average_glucose",
    category: "glucose_metabolism",
    loincCode: "27353-2",
  },

  insulin: { canonicalName: "insulin", category: "glucose_metabolism", loincCode: "20448-7" },
  insulina: { canonicalName: "insulin", category: "glucose_metabolism", loincCode: "20448-7" },
  homa_ir: { canonicalName: "homa_ir", category: "glucose_metabolism" },
  indice_homa_ir: { canonicalName: "homa_ir", category: "glucose_metabolism" },

  // Renal Function
  creatinine: { canonicalName: "creatinine", category: "renal_function", loincCode: "2160-0" },
  creatinina: { canonicalName: "creatinine", category: "renal_function", loincCode: "2160-0" },
  dosagem_de_creatinina: {
    canonicalName: "creatinine",
    category: "renal_function",
    loincCode: "2160-0",
  },

  urea: { canonicalName: "urea", category: "renal_function", loincCode: "3094-0" },
  ureia: { canonicalName: "urea", category: "renal_function", loincCode: "3094-0" },
  dosagem_de_ureia: { canonicalName: "urea", category: "renal_function", loincCode: "3094-0" },

  uric_acid: { canonicalName: "uric_acid", category: "renal_function", loincCode: "3084-1" },
  acido_urico: { canonicalName: "uric_acid", category: "renal_function", loincCode: "3084-1" },
  dosagem_de_acido_urico: {
    canonicalName: "uric_acid",
    category: "renal_function",
    loincCode: "3084-1",
  },

  egfr: { canonicalName: "egfr", category: "renal_function", loincCode: "62238-1" },
  estimated_gfr: { canonicalName: "egfr", category: "renal_function", loincCode: "62238-1" },
  etfg: { canonicalName: "egfr", category: "renal_function", loincCode: "62238-1" },
  taxa_de_filtracao_glomerular: {
    canonicalName: "egfr",
    category: "renal_function",
    loincCode: "62238-1",
  },
  taxa_filtracao_glomerular: {
    canonicalName: "egfr",
    category: "renal_function",
    loincCode: "62238-1",
  },
  taxa_de_filtracao_glomerular_estimada: {
    canonicalName: "egfr",
    category: "renal_function",
    loincCode: "62238-1",
  },

  albumin: { canonicalName: "albumin", category: "renal_function", loincCode: "1751-7" },
  albumina: { canonicalName: "albumin", category: "renal_function", loincCode: "1751-7" },

  // Hematology
  hemoglobin: { canonicalName: "hemoglobin", category: "hematology", loincCode: "718-7" },
  hemoglobina: { canonicalName: "hemoglobin", category: "hematology", loincCode: "718-7" },
  hematocrit: { canonicalName: "hematocrit", category: "hematology", loincCode: "4544-3" },
  hematocrito: { canonicalName: "hematocrit", category: "hematology", loincCode: "4544-3" },
  erythrocytes: { canonicalName: "erythrocytes", category: "hematology", loincCode: "789-8" },
  hemacias: { canonicalName: "erythrocytes", category: "hematology", loincCode: "789-8" },
  leukocytes: { canonicalName: "leukocytes", category: "hematology", loincCode: "6690-2" },
  leucocitos: { canonicalName: "leukocytes", category: "hematology", loincCode: "6690-2" },
  leucocitos_totais: { canonicalName: "leukocytes", category: "hematology", loincCode: "6690-2" },
  neutrophils: { canonicalName: "neutrophils", category: "hematology", loincCode: "751-8" },
  neutrofilos: { canonicalName: "neutrophils", category: "hematology", loincCode: "751-8" },
  lymphocytes: { canonicalName: "lymphocytes", category: "hematology", loincCode: "731-0" },
  linfocitos: { canonicalName: "lymphocytes", category: "hematology", loincCode: "731-0" },
  eosinophils: { canonicalName: "eosinophils", category: "hematology", loincCode: "711-2" },
  eosinofilos: { canonicalName: "eosinophils", category: "hematology", loincCode: "711-2" },
  basophils: { canonicalName: "basophils", category: "hematology", loincCode: "704-7" },
  basofilos: { canonicalName: "basophils", category: "hematology", loincCode: "704-7" },
  monocytes: { canonicalName: "monocytes", category: "hematology", loincCode: "742-7" },
  monocitos: { canonicalName: "monocytes", category: "hematology", loincCode: "742-7" },
  band_cells: { canonicalName: "band_neutrophils", category: "hematology" },
  bands: { canonicalName: "band_neutrophils", category: "hematology" },
  bastoes: { canonicalName: "band_neutrophils", category: "hematology" },
  platelets: { canonicalName: "platelets", category: "hematology", loincCode: "777-3" },
  plaquetas: { canonicalName: "platelets", category: "hematology", loincCode: "777-3" },
  ferritin: { canonicalName: "ferritin", category: "hematology", loincCode: "2276-4" },
  ferritina: { canonicalName: "ferritin", category: "hematology", loincCode: "2276-4" },
  ferritina_serica: { canonicalName: "ferritin", category: "hematology", loincCode: "2276-4" },

  // Vitamins & Electrolytes
  vitamin_b12: { canonicalName: "vitamin_b12", category: "other", loincCode: "2132-9" },
  vitamina_b12: { canonicalName: "vitamin_b12", category: "other", loincCode: "2132-9" },
  vitamina_b_12: { canonicalName: "vitamin_b12", category: "other", loincCode: "2132-9" },
  vitamin_d: { canonicalName: "vitamin_d", category: "other", loincCode: "1989-3" },
  vitamina_d: { canonicalName: "vitamin_d", category: "other", loincCode: "1989-3" },
  folic_acid: { canonicalName: "folic_acid", category: "other" },
  acido_folico: { canonicalName: "folic_acid", category: "other" },
  sodium: { canonicalName: "sodium", category: "renal_function", loincCode: "2951-2" },
  sodio: { canonicalName: "sodium", category: "renal_function", loincCode: "2951-2" },
  potassium: { canonicalName: "potassium", category: "renal_function", loincCode: "2823-3" },
  potassio: { canonicalName: "potassium", category: "renal_function", loincCode: "2823-3" },
  magnesium: { canonicalName: "magnesium", category: "other" },
  magnesio: { canonicalName: "magnesium", category: "other" },
  zinc: { canonicalName: "zinc", category: "other" },
  zinco: { canonicalName: "zinc", category: "other" },
};

/**
 * Strip diacritics, normalize separators to snake_case lowercase.
 */
export function slugifyBiomarkerName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Deterministically resolve a biomarker to its standardized canonical_name (and optional LOINC/category)
 * using LOINC terminology first, then PT-BR/EN clinical alias matching.
 */
export function normalizeBiomarker(input: {
  canonicalName: string;
  loincCode?: string | null;
  rawName?: string | null;
}): CanonicalBiomarker {
  const trimmedLoinc = input.loincCode?.trim();
  if (trimmedLoinc && trimmedLoinc in LOINC_TO_BIOMARKER) {
    return LOINC_TO_BIOMARKER[trimmedLoinc];
  }

  const canonicalSlug = slugifyBiomarkerName(input.canonicalName);
  if (canonicalSlug in ALIAS_TO_BIOMARKER) {
    return ALIAS_TO_BIOMARKER[canonicalSlug];
  }

  if (input.rawName) {
    const rawSlug = slugifyBiomarkerName(input.rawName);
    if (rawSlug in ALIAS_TO_BIOMARKER) {
      return ALIAS_TO_BIOMARKER[rawSlug];
    }
  }

  return {
    canonicalName: canonicalSlug || input.canonicalName,
    ...(trimmedLoinc ? { loincCode: trimmedLoinc } : {}),
  };
}
