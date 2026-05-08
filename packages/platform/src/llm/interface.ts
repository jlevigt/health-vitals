import { type LLMResult } from "@health-vitals/contracts";
export { type LLMResult };

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
