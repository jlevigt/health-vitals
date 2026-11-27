import { describe, expect, it } from "bun:test";
import { normalizeBiomarker, slugifyBiomarkerName } from "../biomarker-normalizer.ts";

describe("biomarker-normalizer (LOINC & clinical aliases)", () => {
  it("merges LOINC codes regardless of raw or LLM-invented names", () => {
    expect(
      normalizeBiomarker({
        canonicalName: "colesterol_bom",
        loincCode: "2085-9",
        rawName: "HDL",
      }).canonicalName,
    ).toBe("hdl_cholesterol");

    expect(
      normalizeBiomarker({
        canonicalName: "ldl_calculado",
        loincCode: "13457-7",
        rawName: "LDL",
      }).canonicalName,
    ).toBe("ldl_cholesterol");

    expect(
      normalizeBiomarker({
        canonicalName: "glicemia_qualquer",
        loincCode: "1558-6",
      }).canonicalName,
    ).toBe("fasting_glucose");
  });

  it("merges Portuguese and English aliases into identical canonical names", () => {
    expect(normalizeBiomarker({ canonicalName: "hdl" }).canonicalName).toBe("hdl_cholesterol");
    expect(normalizeBiomarker({ canonicalName: "colesterol_hdl" }).canonicalName).toBe(
      "hdl_cholesterol",
    );
    expect(normalizeBiomarker({ canonicalName: "ldl" }).canonicalName).toBe("ldl_cholesterol");
    expect(normalizeBiomarker({ canonicalName: "colesterol_ldl" }).canonicalName).toBe(
      "ldl_cholesterol",
    );
    expect(normalizeBiomarker({ canonicalName: "colesterol_total" }).canonicalName).toBe(
      "total_cholesterol",
    );
    expect(normalizeBiomarker({ canonicalName: "glicose_em_jejum" }).canonicalName).toBe(
      "fasting_glucose",
    );
    expect(normalizeBiomarker({ canonicalName: "glicose_jejum" }).canonicalName).toBe(
      "fasting_glucose",
    );
    expect(normalizeBiomarker({ canonicalName: "glucose" }).canonicalName).toBe("fasting_glucose");
    expect(normalizeBiomarker({ canonicalName: "hemoglobina_glicada_a1c" }).canonicalName).toBe(
      "hba1c",
    );
    expect(
      normalizeBiomarker({ canonicalName: "taxa_de_filtracao_glomerular_estimada" }).canonicalName,
    ).toBe("egfr");
  });

  it("falls back cleanly to slugified canonical name for unknown biomarkers", () => {
    expect(slugifyBiomarkerName("Ácido Úrico Sérico")).toBe("acido_urico_serico");
    expect(normalizeBiomarker({ canonicalName: "Vitamina K2" }).canonicalName).toBe("vitamina_k2");
  });
});
