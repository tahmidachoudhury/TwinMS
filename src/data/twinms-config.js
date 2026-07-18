// TwinMS mock data + per-patient thresholds. Edit freely — the UI reads everything from here.
// NFL bands are fixed clinical cut-offs (same for everyone); GFAP bands are derived
// from each patient's personal baseline seed points.
export const brand = { name: "TwinMS", tagline: "Your MS digital twin" };

export const NFL_BANDS = { normalMax: 25, elevatedMax: 40, chartMax: 55 };

export const patients = {
  "TW-0042": {
    id: "TW-0042",
    name: "Maya Lindqvist",
    email: "maya@twinms.app",
    markers: {
      nfl: {
        label: "NFL", full: "Neurofilament light chain", unit: "pg/mL",
        bands: NFL_BANDS,
        series: [19,18,20,19,21,20,22,21,23,22,24,23,25,24,26,25,27,26,28,27,26,28,29,28,30,29,31,30,32,31],
      },
      gfap: {
        label: "GFAP", full: "Glial fibrillary acidic protein", unit: "pg/mL",
        baseline: { stable: 92, inflammation: 180, flare: 315 },
        chartMax: 360,
        series: [96,101,94,108,99,112,104,118,109,102,121,114,126,110,117,131,122,108,119,127,133,121,129,136,124,131,138,126,134,128],
      },
    },
    medication: {
      name: "Ocrevus", generic: "ocrelizumab",
      cadence: "6-monthly infusion", doseNoun: "infusion",
      cycleDays: 182,
      lastDoseISO: "2026-02-12",
    },
    weather: {
      location: "Lisbon, PT",
      condition: "Sunny",
      tempC: 33,
      heatWarnC: 30,             // Uhthoff threshold
    },
  },

  "TW-0117": {
    id: "TW-0117",
    name: "Jonas Weber",
    email: "jonas@twinms.app",
    markers: {
      nfl: {
        label: "NFL", full: "Neurofilament light chain", unit: "pg/mL",
        bands: NFL_BANDS,
        series: [17,16,18,17,16,18,19,17,18,16,17,19,18,17,18,20,19,17,18,19,18,17,19,18,20,19,18,17,18,19],
      },
      gfap: {
        label: "GFAP", full: "Glial fibrillary acidic protein", unit: "pg/mL",
        baseline: { stable: 78, inflammation: 150, flare: 280 },
        chartMax: 320,
        series: [80,76,82,79,74,81,77,84,79,76,83,78,81,75,80,84,77,82,79,76,81,85,78,80,83,77,82,79,81,78],
      },
    },
    medication: {
      name: "Kesimpta", generic: "ofatumumab",
      cadence: "monthly self-injection", doseNoun: "injection",
      cycleDays: 28,
      lastDoseISO: "2026-07-02",
    },
    weather: {
      location: "Berlin, DE",
      condition: "Partly cloudy",
      tempC: 24,
      heatWarnC: 30,
    },
  },
};
