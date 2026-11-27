export type SortDirection = "asc" | "desc";

export type FileSortField = "filename" | "created_at";

export interface SortableFileItem {
  id: string;
  filename: string;
  created_at: string;
}

export type ReportSortField = "fileName" | "date" | "lab_name" | "observationsCount";

export interface SortableReportItem {
  id: string;
  fileName: string;
  date: string;
  lab_name: string | null;
  observationsCount: number;
}

function compareText(a: string, b: string, locale: string): number {
  return a.localeCompare(b, locale, { sensitivity: "base", numeric: true });
}

function parseTimestamp(value: string): number {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

export function sortFiles<T extends SortableFileItem>(
  files: readonly T[],
  field: FileSortField,
  direction: SortDirection,
  locale = "pt-BR",
): T[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...files].sort((a, b) => {
    let diff = 0;
    if (field === "filename") {
      diff = compareText(a.filename, b.filename, locale);
    } else {
      diff = parseTimestamp(a.created_at) - parseTimestamp(b.created_at);
    }
    if (diff === 0) {
      diff = compareText(a.filename, b.filename, locale);
    }
    return diff * factor;
  });
}

function compareNullableText(
  a: string | null,
  b: string | null,
  locale: string,
  factor: number,
): number {
  const valA = a?.trim() ?? "";
  const valB = b?.trim() ?? "";
  if (!valA && !valB) {
    return 0;
  }
  if (!valA) {
    return 1;
  }
  if (!valB) {
    return -1;
  }
  return compareText(valA, valB, locale) * factor;
}

function compareReportField(
  a: SortableReportItem,
  b: SortableReportItem,
  field: ReportSortField,
  locale: string,
  factor: number,
): number {
  if (field === "lab_name") {
    return compareNullableText(a.lab_name, b.lab_name, locale, factor);
  }
  let diff = 0;
  if (field === "fileName") {
    diff = compareText(a.fileName, b.fileName, locale);
  } else if (field === "date") {
    diff = parseTimestamp(a.date) - parseTimestamp(b.date);
  } else {
    diff = a.observationsCount - b.observationsCount;
  }
  return diff * factor;
}

export function sortReports<T extends SortableReportItem>(
  reports: readonly T[],
  field: ReportSortField,
  direction: SortDirection,
  locale = "pt-BR",
): T[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...reports].sort((a, b) => {
    const primary = compareReportField(a, b, field, locale, factor);
    if (primary !== 0) {
      return primary;
    }
    return compareText(a.fileName, b.fileName, locale) * factor;
  });
}
