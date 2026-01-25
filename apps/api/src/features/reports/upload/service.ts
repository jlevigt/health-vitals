import type { Pool } from "node_modules/@types/pg/index.js";
import { PDFParse } from "pdf-parse";
import { ILLMProvider } from "@/shared/llm/interface.ts";
import { ILogger } from "@/shared/logger/interface.ts";
import { AppError } from "@/shared/errors/app.error.ts";
import { UploadReportResponse } from "./types.ts";

export class UploadReportService {
  constructor(
    private pool: Pool,
    private logger: ILogger,
    private llmProvider: ILLMProvider
  ) {}

  async execute(userId: string, fileBuffer: Buffer, fileName: string): Promise<UploadReportResponse> {
    this.logger.info(`Starting report upload - ${fileName}`);

    let extractedText: string;
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      extractedText = textResult.text;
      await parser.destroy();
    } catch (error: any) {
      this.logger.error("Error parsing PDF", { error: error.message, userId });
      throw new AppError("Failed to parse PDF file.", 400);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new AppError("No text could be extracted from the PDF.", 400);
    }

    const structuredData = await this.llmProvider.processDocument(extractedText, fileName);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert into reports
      const reportRes = await client.query(
        `INSERT INTO reports (user_id, collection_date, lab_name, file_name, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, structuredData.collection_date, structuredData.lab_name, fileName, 'processed']
      );

      const reportId = reportRes.rows[0].id;

      // 2. Insert observations
      for (const obs of structuredData.observations) {
        try {
          await client.query(
            `INSERT INTO observations (
              report_id, category, canonical_name, raw_name, raw_value, raw_unit,
              normalized_value, base_unit, reference_low, reference_high, loinc_code, material
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              reportId,
              obs.category,
              obs.canonical_name,
              obs.raw_name,
              obs.raw_value,
              obs.raw_unit ?? null,
              obs.normalized_value ?? null,
              obs.base_unit ?? "unknown",
              obs.reference_low ?? null,
              obs.reference_high ?? null,
              obs.loinc_code ?? null,
              obs.material ?? null,
            ]
          );
        } catch (obsError: any) {
          this.logger.error("Error inserting individual observation", { 
            error: obsError.message, 
            observation: obs.raw_name,
            reportId 
          });
          throw obsError; // Regurgitate to main catch
        }
      }

      await client.query("COMMIT");

      return {
        reportId,
        collectionDate: structuredData.collection_date,
        labName: structuredData.lab_name || null,
        observationsCount: structuredData.observations.length,
      };
    } catch (error: any) {
      if (client) await client.query("ROLLBACK");
      this.logger.error("Error in report upload database transaction", { 
        error: error.message, 
        userId,
        stack: error.stack 
      });
      throw new AppError(`Failed to save report data: ${error.message}`, 500);
    } finally {
      client.release();
    }
  }
}
