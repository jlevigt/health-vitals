import { delay, HttpResponse, http } from "msw";

const API_URL = "http://localhost:3000";

const mockTrendData = (category: string) => {
  const dates = ["2023-01-10", "2023-03-15", "2023-06-20", "2023-09-05", "2023-11-20"];

  const seriesConfig: Record<string, { name: string; unit: string; low: number; high: number }> = {
    // Lipid Panel
    total_cholesterol: { name: "Total Cholesterol", unit: "mg/dL", low: 125, high: 200 },
    ldl_cholesterol: { name: "LDL Cholesterol", unit: "mg/dL", low: 0, high: 100 },
    hdl_cholesterol: { name: "HDL Cholesterol", unit: "mg/dL", low: 40, high: 60 },
    triglycerides: { name: "Triglycerides", unit: "mg/dL", low: 0, high: 150 },
    non_hdl_cholesterol: { name: "Non-HDL Cholesterol", unit: "mg/dL", low: 0, high: 130 },
    // Glucose Metabolism
    fasting_glucose: { name: "Fasting Glucose", unit: "mg/dL", low: 70, high: 99 },
    hba1c: { name: "HbA1c", unit: "%", low: 4.0, high: 5.6 },
    insulin: { name: "Insulin", unit: "uIU/mL", low: 2.6, high: 24.9 },
    estimated_average_glucose: { name: "Estimated Avg Glucose", unit: "mg/dL", low: 70, high: 126 },
    // Renal Function
    creatinine: { name: "Creatinine", unit: "mg/dL", low: 0.7, high: 1.3 },
    estimated_gfr: { name: "Estimated GFR", unit: "mL/min/1.73m²", low: 90, high: 120 },
    urea: { name: "Urea", unit: "mg/dL", low: 7, high: 20 },
    uric_acid: { name: "Uric Acid", unit: "mg/dL", low: 3.4, high: 7.0 },
    albumin: { name: "Albumin", unit: "g/dL", low: 3.4, high: 5.4 },
  };

  const getMetrics = (cat: string) => {
    switch (cat) {
      case "lipid_panel":
        return [
          "total_cholesterol",
          "ldl_cholesterol",
          "hdl_cholesterol",
          "triglycerides",
          "non_hdl_cholesterol",
        ];
      case "glucose_metabolism":
        return ["fasting_glucose", "hba1c", "insulin", "estimated_average_glucose"];
      case "renal_function":
        return ["creatinine", "estimated_gfr", "urea", "uric_acid", "albumin"];
      default:
        return [];
    }
  };

  return {
    category,
    series: getMetrics(category).map((key) => {
      const config = seriesConfig[key];
      return {
        canonical_name: key,
        unit: config.unit,
        points: dates.map((date, i) => {
          // Generate semi-random values around the range
          const base = (config.low + config.high) / 2;
          const variance = (config.high - config.low) * 0.4;
          const value = i === 2 ? config.high * 1.1 : base + (Math.random() - 0.5) * variance; // One point out of range

          return {
            date,
            value: parseFloat(value.toFixed(2)),
            reference_low: config.low,
            reference_high: config.high,
          };
        }),
      };
    }),
  };
};

export const handlers = [
  // Reports Handlers
  http.get(`${API_URL}/reports`, async () => {
    await delay(500);
    // Generate 25 mock reports
    const reports = Array.from({ length: 25 }).map((_, i) => ({
      id: `report-${i + 1}`,
      fileName: `Lab_Report_${2023 - Math.floor(i / 12)}_${(i % 12) + 1}.pdf`,
      date: `2023-${String((i % 12) + 1).padStart(2, "0")}-15`,
      lab_name: "Quest Diagnostics",
      observationsCount: Math.floor(Math.random() * 20) + 5,
    }));
    return HttpResponse.json(reports);
  }),

  http.get(`${API_URL}/reports/:id/observations`, async () => {
    await delay(300);
    // Generate 15 mock observations
    const observations = Array.from({ length: 15 }).map((_, i) => ({
      id: `obs-${i + 1}`,
      name:
        ["Total Cholesterol", "HDL", "LDL", "Triglycerides", "Glucose", "Creatinine"][i % 6] ||
        `Test ${i}`,
      value: (Math.random() * 100 + 50).toFixed(1),
      unit: "mg/dL",
      status: "final",
      interpretation: Math.random() > 0.7 ? "High" : "Normal",
    }));
    return HttpResponse.json(observations);
  }),

  http.post(`${API_URL}/reports/upload`, async () => {
    await delay(2000); // Simulate large file processing
    return HttpResponse.json({
      id: "report-new",
      status: "processed",
    });
  }),

  // Auth Handlers
  http.post(`${API_URL}/auth/login`, async () => {
    await delay(500);
    return HttpResponse.json({
      accessToken: "mock-access-token",
      user: { id: "user-1", name: "Mock User", email: "mock@example.com" },
    });
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: "mock-new-access-token",
    });
  }),

  // New Dashboards
  http.get(`${API_URL}/dashboard/:category`, async ({ params }) => {
    await delay(600);
    const { category } = params;

    if (["lipid_panel", "glucose_metabolism", "renal_function"].includes(category as string)) {
      return HttpResponse.json(mockTrendData(category as string));
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Legacy/Default Login/Register for simplicity
  http.post(`${API_URL}/auth/register`, async () => {
    await delay(500);
    return HttpResponse.json({
      accessToken: "mock-access-token",
      user: { id: "user-1", name: "Mock User", email: "mock@example.com" },
    });
  }),
];
