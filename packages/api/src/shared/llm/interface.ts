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

export interface ILLMProvider {
  /**
   * Sends a prompt with text from a document to get a structured JSON.
   * @param extractedText The text extracted from the PDF.
   * @param fileName The original filename of the document.
   * @returns The structured JSON object with the document data.
   */
  processDocument(extractedText: string, fileName: string): Promise<LLMResult>;
}
