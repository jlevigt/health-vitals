/**
 * LLM usage metrics for technical tracking and billing
 */
export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Combined response from an LLM provider including usage metrics
 */
export interface LLMProviderResponse {
  data: LLMResult;
  usage?: LLMUsage;
  model?: string;
}
export interface LLMResult {
  collection_date: string;
  lab_name?: string;
  observations: Array<{
    category: string;
    canonical_name: string;
    raw_name: string;
    loinc_code?: string;
    raw_value: string;
    raw_unit?: string;
    material?: string;
    normalized_value?: number;
    base_unit?: string;
    reference_low?: number;
    reference_high?: number;
  }>;
}
