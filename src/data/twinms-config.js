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
    wearable: {
      device: "Oura Ring + Apple Watch",
      lastSync: "Today, 08:42",
      context: "A short-term recovery strain pattern is present: sleep, HRV, and resting heart rate have moved together while neurological biomarkers remain comparatively steady.",
      metrics: {
        sleep: {
          label: "Sleep duration", shortLabel: "Sleep", unit: "h", decimals: 1,
          direction: "higher", baseline: { low: 7.1, high: 8.2 }, warn: 6.5,
          series: [7.6,7.4,7.8,7.2,7.5,7.7,7.3,7.6,7.1,7.4,7.5,7.2,7.6,7.3,7.4,7.1,6.9,7.0,6.7,6.8,6.5,6.6,6.2,6.4,6.1,6.3,5.9,6.2,6.0,5.8],
        },
        consistency: {
          label: "Sleep consistency", shortLabel: "Consistency", unit: "%", decimals: 0,
          direction: "higher", baseline: { low: 82, high: 94 }, warn: 72,
          series: [88,86,90,84,87,89,85,91,86,88,84,87,89,83,86,82,80,81,78,79,75,77,73,76,71,74,69,72,70,68],
        },
        restingHr: {
          label: "Resting heart rate", shortLabel: "Resting HR", unit: "bpm", decimals: 0,
          direction: "lower", baseline: { low: 58, high: 65 }, warn: 70,
          series: [61,62,60,63,61,62,64,61,63,62,60,64,62,63,61,64,65,64,66,65,67,66,68,67,69,68,71,69,70,72],
        },
        hrv: {
          label: "Heart rate variability", shortLabel: "HRV", unit: "ms", decimals: 0,
          direction: "higher", baseline: { low: 42, high: 58 }, warn: 34,
          series: [49,52,48,51,50,47,53,49,51,48,52,46,50,49,47,45,44,46,42,43,40,41,38,40,36,39,33,36,35,32],
        },
        steps: {
          label: "Daily mobility", shortLabel: "Mobility", unit: "steps", decimals: 0,
          direction: "higher", baseline: { low: 6500, high: 9800 }, warn: 4800,
          series: [8240,7900,9100,7350,8600,8800,7600,9400,8100,8450,7800,8900,9200,7500,8300,7100,6800,7200,6400,6900,6100,6600,5700,6200,5400,5900,4500,5200,4800,4300],
        },
        recovery: {
          label: "Recovery score", shortLabel: "Recovery", unit: "/100", decimals: 0,
          direction: "higher", baseline: { low: 72, high: 88 }, warn: 60,
          series: [81,84,79,82,80,78,85,81,83,79,82,77,80,81,78,75,74,76,71,73,68,70,65,69,63,66,58,62,60,56],
        },
      },
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
    wearable: {
      device: "Garmin Venu 3",
      lastSync: "Today, 07:55",
      context: "Wearable signals are within Jonas’s normal range. Sleep, cardiac recovery, and mobility are moving consistently with his established personal baseline.",
      metrics: {
        sleep: {
          label: "Sleep duration", shortLabel: "Sleep", unit: "h", decimals: 1,
          direction: "higher", baseline: { low: 7.0, high: 8.3 }, warn: 6.4,
          series: [7.5,7.2,7.8,7.4,7.6,7.1,7.9,7.3,7.7,7.5,7.2,7.6,7.8,7.4,7.3,7.7,7.5,7.2,7.8,7.4,7.6,7.3,7.9,7.5,7.1,7.6,7.4,7.8,7.3,7.6],
        },
        consistency: {
          label: "Sleep consistency", shortLabel: "Consistency", unit: "%", decimals: 0,
          direction: "higher", baseline: { low: 80, high: 93 }, warn: 70,
          series: [87,84,89,86,88,82,90,85,87,86,83,88,89,85,84,88,86,83,90,85,87,84,91,86,82,88,85,89,84,87],
        },
        restingHr: {
          label: "Resting heart rate", shortLabel: "Resting HR", unit: "bpm", decimals: 0,
          direction: "lower", baseline: { low: 54, high: 62 }, warn: 68,
          series: [58,59,57,60,58,61,56,59,57,58,60,57,56,59,60,57,58,61,56,59,58,60,57,56,61,58,59,57,60,58],
        },
        hrv: {
          label: "Heart rate variability", shortLabel: "HRV", unit: "ms", decimals: 0,
          direction: "higher", baseline: { low: 48, high: 65 }, warn: 39,
          series: [56,53,59,55,57,51,62,54,58,56,52,60,61,55,53,59,57,50,63,54,58,52,61,56,49,60,55,62,53,58],
        },
        steps: {
          label: "Daily mobility", shortLabel: "Mobility", unit: "steps", decimals: 0,
          direction: "higher", baseline: { low: 7000, high: 10500 }, warn: 5200,
          series: [8500,7800,9600,8200,8900,7400,10200,8100,9300,8700,7600,9400,9800,8300,7900,9500,8800,7300,10100,8400,9100,7700,9900,8600,7200,9300,8200,9700,7900,8900],
        },
        recovery: {
          label: "Recovery score", shortLabel: "Recovery", unit: "/100", decimals: 0,
          direction: "higher", baseline: { low: 74, high: 90 }, warn: 62,
          series: [82,79,85,81,83,76,88,80,84,82,78,86,87,81,79,85,83,75,89,80,84,77,87,82,74,86,81,88,78,84],
        },
      },
    },
  },
};
