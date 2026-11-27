import { describe, expect, it } from "bun:test";
import { sortFiles, sortReports } from "./tableSort";

describe("sortFiles", () => {
  const sampleFiles = [
    { id: "1", filename: "Exame 10.pdf", created_at: "2025-02-01T10:00:00Z" },
    { id: "2", filename: "exame 2.pdf", created_at: "2025-05-10T08:30:00Z" },
    { id: "3", filename: "Alpha.pdf", created_at: "2024-11-20T14:00:00Z" },
  ];

  it("sorts by filename ascending with natural numeric ordering", () => {
    const sorted = sortFiles(sampleFiles, "filename", "asc", "pt-BR");
    expect(sorted.map((f) => f.id)).toEqual(["3", "2", "1"]);
  });

  it("sorts by filename descending", () => {
    const sorted = sortFiles(sampleFiles, "filename", "desc", "pt-BR");
    expect(sorted.map((f) => f.id)).toEqual(["1", "2", "3"]);
  });

  it("sorts by created_at descending (newest first)", () => {
    const sorted = sortFiles(sampleFiles, "created_at", "desc", "pt-BR");
    expect(sorted.map((f) => f.id)).toEqual(["2", "1", "3"]);
  });

  it("handles invalid timestamps without throwing and does not mutate input", () => {
    const withInvalid = [
      { id: "a", filename: "b.pdf", created_at: "invalid-date" },
      { id: "b", filename: "a.pdf", created_at: "2025-01-01T00:00:00Z" },
    ];
    const snapshot = [...withInvalid];
    const sorted = sortFiles(withInvalid, "created_at", "desc", "en-US");
    expect(sorted.map((f) => f.id)).toEqual(["b", "a"]);
    expect(withInvalid).toEqual(snapshot);
  });
});

describe("sortReports", () => {
  const sampleReports = [
    {
      id: "1",
      fileName: "Checkup 2024.pdf",
      date: "2024-06-15",
      lab_name: "Clementino Fraga",
      observationsCount: 28,
    },
    {
      id: "2",
      fileName: "Lipidograma.pdf",
      date: "2025-01-10",
      lab_name: null,
      observationsCount: 6,
    },
    {
      id: "3",
      fileName: "Acompanhamento.pdf",
      date: "2025-03-01",
      lab_name: "Albano",
      observationsCount: 15,
    },
  ];

  it("sorts by date descending", () => {
    const sorted = sortReports(sampleReports, "date", "desc");
    expect(sorted.map((r) => r.id)).toEqual(["3", "2", "1"]);
  });

  it("sorts by fileName ascending", () => {
    const sorted = sortReports(sampleReports, "fileName", "asc");
    expect(sorted.map((r) => r.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by observationsCount descending", () => {
    const sorted = sortReports(sampleReports, "observationsCount", "desc");
    expect(sorted.map((r) => r.id)).toEqual(["1", "3", "2"]);
  });

  it("always pushes empty/null lab_name entries to the bottom", () => {
    const asc = sortReports(sampleReports, "lab_name", "asc");
    expect(asc.map((r) => r.id)).toEqual(["3", "1", "2"]);

    const desc = sortReports(sampleReports, "lab_name", "desc");
    expect(desc.map((r) => r.id)).toEqual(["1", "3", "2"]);
  });
});
