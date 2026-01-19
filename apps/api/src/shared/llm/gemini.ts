import { GoogleGenAI, Type } from "@google/genai";
import { ILLMProvider, LLMResult } from "./interface.ts";
import { AppError } from "../errors/app.error.ts";
import { ILogger } from "../logger/interface.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiProvider implements ILLMProvider {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async processDocument(extractedText: string, fileName: string): Promise<LLMResult> {
    const prompt =
      `Analyze the entire following lab report text and the provided file name. Return a SINGLE JSON object that represents the whole document. ` +
      `Do not create multiple objects or an array. The object MUST contain a 'collection_date' in YYYY-MM-DD format. ` +
      `The 'lab_name' is optional. ` +
      `Aggregate ALL measurements from all sections of the report into a single 'observations' array. ` +
      `For each measurement, extract: ` +
      `- category: One of ['lipid_panel', 'glucose_metabolism', 'blood_pressure', 'hematology', 'hormones', 'renal_function', 'liver_function', 'other'] ` +
      `- canonical_name: A standardized, lowercase, snake_case name for the measurement (e.g. 'hemoglobin', 'total_cholesterol'). ` +
      `- raw_name: The name exactly as it appears in the text. ` +
      `- raw_value: The value as text. ` +
      `- raw_unit: The unit as text. ` +
      `- normalized_value: The numeric value. Use '.' as decimal separator if original uses ','. ` +
      `- base_unit: One of ['mg_dl', 'mmol_l', 'percent', 'ui_l', 'ng_ml', 'unknown']. ` +
      `- reference_low: Lower bound numeric value (if available). ` +
      `- reference_high: Upper bound numeric value (if available). ` +
      `- loinc_code: LOINC code if available. ` +
      `- material: Specimen material. ` +
      `Note: Ensure 'collection_date' is always valid and in 'YYYY-MM-DD' format. If only a year is found, use 'YYYY-01-01'. ` +
      `File Name: ${fileName}\n` +
      `Text: ${extractedText}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
        // @ts-ignore
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            collection_date: { type: Type.STRING, description: "Date of the exam collection (e.g., YYYY-MM-DD)." },
            lab_name: { type: Type.STRING, description: "Name of the laboratory." },
            observations: {
              type: Type.ARRAY,
              description: "List of all measurements and their results.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ['lipid_panel', 'glucose_metabolism', 'blood_pressure', 'hematology', 'hormones', 'renal_function', 'liver_function', 'other'] },
                  canonical_name: { type: Type.STRING },
                  raw_name: { type: Type.STRING, description: "Name of the measurement as written in the report." },
                  loinc_code: { type: Type.STRING, description: "LOINC code, if available." },
                  raw_value: { type: Type.STRING, description: "Value of the measurement, can be numeric or text." },
                  raw_unit: { type: Type.STRING, description: "Unit of the measurement, if available." },
                  normalized_value: { type: Type.NUMBER },
                  base_unit: { type: Type.STRING, enum: ['mg_dl', 'mmol_l', 'percent', 'ui_l', 'ng_ml', 'unknown'] },
                  material: { type: Type.STRING, description: "Specimen material (e.g., Blood, Serum)." },
                  reference_low: { type: Type.NUMBER, description: "Lower bound of the reference range." },
                  reference_high: { type: Type.NUMBER, description: "Upper bound of the reference range." },
                },
                required: ["category", "canonical_name", "raw_name", "raw_value"],
              },
            },
          },
          required: ["collection_date", "observations"], // collection_date is now required, lab_name is optional
        },
      });

      const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonText) {
        this.logger.error("LLM returned empty or invalid response.", { prompt });
        throw new AppError("LLM failed to return structured JSON.", 502);
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (parseError: any) {
        this.logger.error("Failed to parse Gemini JSON response", { jsonText });
        throw new AppError("LLM returned malformed JSON.", 502);
      }

      // Resilience: If the LLM returns an array, merge it into a single object.
      if (Array.isArray(parsedJson)) {
        this.logger.error("LLM returned an array, merging into a single result.", { count: parsedJson.length });
        if (parsedJson.length === 0) {
          throw new AppError("LLM returned an empty array.", 502);
        }

        const firstItem = parsedJson[0];
        const allObservations = parsedJson.flatMap((item) => item.observations || item.measurements || []);

        const mergedResult: LLMResult = {
          collection_date: firstItem.collection_date || new Date().toISOString().split("T")[0], // Fallback if not provided in first item
          lab_name: firstItem.lab_name || null, // lab_name can be null
          observations: allObservations,
        };
        // Ensure collection_date is present
        if (!mergedResult.collection_date) {
          throw new AppError("LLM failed to return a collection_date for the merged report.", 502);
        }
        return mergedResult;
      }

      // Ensure collection_date is present for non-array results
      if (!parsedJson.collection_date) {
        throw new AppError("LLM failed to return a collection_date.", 502);
      }

      return parsedJson as LLMResult;
    } catch (error: any) {
      this.logger.error("Error connecting to Gemini API.", { error: error.message });
      throw new AppError("Error communicating with LLM provider.", 502);
    }
  }
}
