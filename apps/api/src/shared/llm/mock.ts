import { ILLMProvider, LLMResult } from "./interface.ts";

export class MockLLMProvider implements ILLMProvider {
  async processDocument(extractedText: string, fileName: string): Promise<LLMResult> {
    // Simula o tempo de resposta da API (2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n🧠 [LLM MOCK] Retornando resultado estático...");

    return {
      collection_date: "2025-12-05",
      lab_name: "Mock Lab from " + fileName,
      observations: [
        {
          category: "glucose_metabolism",
          canonical_name: "glucose",
          raw_name: "Glicose",
          raw_value: "95.0",
          raw_unit: "mg/dL",
          reference_low: 70,
          reference_high: 99,
          normalized_value: 95.0,
          base_unit: "mg_dl",
        },
        {
          category: "lipid_panel",
          canonical_name: "total_cholesterol",
          raw_name: "Colesterol Total",
          raw_value: "180.0",
          raw_unit: "mg/dL",
          reference_high: 200,
          normalized_value: 180.0,
          base_unit: "mg_dl",
        },
      ],
    };
  }
}
