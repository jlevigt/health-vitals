import type { LLMProviderResponse } from "@health-vitals/contracts";
import type { LLMProvider } from "./interface.ts";

/**
 * Mock LLM provider for testing and development without API key
 */
export class MockLLMProvider implements LLMProvider {
  async processDocument(_extractedText: string, fileName: string): Promise<LLMProviderResponse> {
    // Simulate API response time
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      model: "mock-model",
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
      data: {
        collection_date: new Date().toISOString().split("T")[0],
        lab_name: `Mock Lab from ${fileName}`,
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
          {
            category: "lipid_panel",
            canonical_name: "hdl_cholesterol",
            raw_name: "HDL Colesterol",
            raw_value: "45.0",
            raw_unit: "mg/dL",
            reference_low: 40,
            reference_high: 60,
            normalized_value: 45.0,
            base_unit: "mg_dl",
          },
        ],
      },
    };
  }
}
