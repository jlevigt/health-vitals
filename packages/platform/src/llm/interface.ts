import type { LLMProviderResponse } from "@health-vitals/contracts";

/**
 * LLM provider interface for dependency injection
 */
export interface LLMProvider {
  /**
   * Process a document and extract structured health data
   * @param extractedText The text extracted from the PDF
   * @param fileName The original filename of the document
   * @returns Structured health data and technical usage metrics
   */
  processDocument(extractedText: string, fileName: string): Promise<LLMProviderResponse>;
}
