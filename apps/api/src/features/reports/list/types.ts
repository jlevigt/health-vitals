export interface Report {
  id: string;
  fileName: string;
  date: string;
  status: "processed" | "processing" | "failed";
  observationsCount: number;
}
