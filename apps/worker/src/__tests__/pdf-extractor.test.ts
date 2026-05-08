/**
 * PDF Extractor Unit Tests
 * 
 * Tests for the PDF text extraction functionality.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { extractTextFromPdf } from "../consumers/ai-extraction/pdf-extractor.ts";
import { PDF_FIXTURE_PATH } from "./helpers.ts";
import { readFileSync, existsSync } from "fs";

describe("PDF Extractor", () => {
  let pdfBuffer: Buffer;
  let fixtureExists: boolean;

  beforeAll(() => {
    fixtureExists = existsSync(PDF_FIXTURE_PATH);
    if (fixtureExists) {
      pdfBuffer = readFileSync(PDF_FIXTURE_PATH);
    }
  });

  describe("extractTextFromPdf", () => {
    it("should extract text from a valid PDF", async () => {
      if (!fixtureExists) {
        console.log("⚠️ Skipping: PDF fixture not found at:", PDF_FIXTURE_PATH);
        return;
      }

      const text = await extractTextFromPdf(pdfBuffer);

      expect(text).toBeDefined();
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(50); // Should have meaningful content
      
      // Log a preview for debugging
      console.log("📄 Extracted text preview:", text.slice(0, 200));
    });

    it("should throw error for corrupted buffer", async () => {
      const corruptedBuffer = Buffer.from("not a valid pdf content");

      await expect(extractTextFromPdf(corruptedBuffer)).rejects.toThrow();
    });

    it("should throw error for empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(extractTextFromPdf(emptyBuffer)).rejects.toThrow();
    });
  });
});
