/**
 * LLM result structure for health report parsing
 */
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

/**
 * LLM provider interface for dependency injection
 */
export interface LLMProvider {
  /**
   * Process a document and extract structured health data
   * @param extractedText The text extracted from the PDF
   * @param fileName The original filename of the document
   * @returns Structured health data from the document
   */
  processDocument(extractedText: string, fileName: string): Promise<LLMResult>;
}
