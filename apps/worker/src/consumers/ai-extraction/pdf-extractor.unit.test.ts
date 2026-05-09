/**
 * PDF Extractor Unit Tests
 *
 * Tests for the PDF text extraction functionality.
 */

import { beforeAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { PDF_FIXTURE_PATH } from "../../../tests/integration/helpers.ts";
import { extractTextFromPdf } from "./pdf-extractor.ts";

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
        return;
      }

      const text = await extractTextFromPdf(pdfBuffer);

      expect(text).toBeDefined();
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(50); // Should have meaningful content
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
