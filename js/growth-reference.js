// Fetal biometry reference values by gestational week.
//
// Estimated fetal weight uses the Hadlock percentile table (p10 / p50 / p90).
// HC, FL and AC list the median only; the normal band is approximated as ±10%
// of the median, which sits close to the published p10–p90 spread.
//
// These are screening references, not a diagnosis. Real interpretation depends
// on maternal history, trend across visits, and the doctor reading the scan.

const WEIGHT_REFERENCE = {
  //        p10,  p50,  p90
  20: [249, 300, 373],
  21: [280, 360, 441],
  22: [330, 430, 524],
  23: [385, 501, 620],
  24: [435, 600, 728],
  25: [503, 660, 848],
  26: [583, 760, 980],
  27: [673, 875, 1125],
  28: [772, 1005, 1284],
  29: [881, 1153, 1456],
  30: [999, 1319, 1642],
  31: [1126, 1502, 1841],
  32: [1259, 1702, 2053],
  33: [1399, 1918, 2276],
  34: [1542, 2146, 2509],
  35: [1687, 2383, 2750],
  36: [1830, 2622, 2996],
  37: [1970, 2859, 3244],
  38: [2103, 3083, 3491],
  39: [2227, 3288, 3733],
  40: [2339, 3462, 3966],
};

// Median head circumference (mm)
const HC_MEDIAN = {
  12: 70, 13: 82, 14: 98, 15: 111, 16: 124, 17: 137, 18: 150, 19: 162,
  20: 175, 21: 187, 22: 198, 23: 210, 24: 221, 25: 232, 26: 242, 27: 252,
  28: 262, 29: 271, 30: 280, 31: 288, 32: 296, 33: 304, 34: 311, 35: 318,
  36: 324, 37: 330, 38: 335, 39: 340, 40: 345,
};

// Median femur length (mm)
const FL_MEDIAN = {
  12: 8, 13: 11, 14: 14, 15: 17, 16: 20, 17: 23, 18: 27, 19: 30,
  20: 33, 21: 35, 22: 38, 23: 41, 24: 44, 25: 46, 26: 49, 27: 51,
  28: 53, 29: 56, 30: 58, 31: 60, 32: 62, 33: 64, 34: 66, 35: 68,
  36: 69, 37: 71, 38: 73, 39: 74, 40: 76,
};

// Median abdominal circumference (mm)
const AC_MEDIAN = {
  12: 56, 13: 66, 14: 76, 15: 87, 16: 98, 17: 109, 18: 120, 19: 131,
  20: 142, 21: 153, 22: 164, 23: 175, 24: 186, 25: 197, 26: 208, 27: 219,
  28: 230, 29: 241, 30: 252, 31: 263, 32: 274, 33: 285, 34: 295, 35: 306,
  36: 317, 37: 327, 38: 338, 39: 348, 40: 359,
};

const MEDIAN_BAND = 0.1; // ±10% around the median counts as normal

const METRICS = {
  weight_grams: {
    label: 'Berat janin',
    originalName: 'Estimated Fetal Weight',
    abbr: 'EFW',
    unit: 'gram',
    placeholder: 'mis. 600',
    reference: (week) => {
      const row = WEIGHT_REFERENCE[week];
      return row ? { low: row[0], median: row[1], high: row[2] } : null;
    },
  },
  head_circumference_mm: {
    label: 'Lingkar kepala',
    originalName: 'Head Circumference',
    abbr: 'HC',
    unit: 'mm',
    placeholder: 'mis. 221',
    reference: (week) => bandFromMedian(HC_MEDIAN[week]),
  },
  abdominal_circumference_mm: {
    label: 'Lingkar perut',
    originalName: 'Abdominal Circumference',
    abbr: 'AC',
    unit: 'mm',
    placeholder: 'mis. 186',
    reference: (week) => bandFromMedian(AC_MEDIAN[week]),
  },
  femur_length_mm: {
    label: 'Panjang femur',
    originalName: 'Femur Length',
    abbr: 'FL',
    unit: 'mm',
    placeholder: 'mis. 44',
    reference: (week) => bandFromMedian(FL_MEDIAN[week]),
  },
};

function bandFromMedian(median) {
  if (median === undefined) return null;
  return {
    low: Math.round(median * (1 - MEDIAN_BAND)),
    median,
    high: Math.round(median * (1 + MEDIAN_BAND)),
  };
}

/**
 * Compare one measurement against its reference band.
 * Returns null when the week is outside the reference table.
 */
function assessMetric(metricKey, week, value) {
  const metric = METRICS[metricKey];
  if (!metric || value === null || value === undefined || value === '') return null;

  const band = metric.reference(Number(week));
  if (!band) return null;

  const numeric = Number(value);
  let status = 'normal';
  if (numeric < band.low) status = 'below';
  else if (numeric > band.high) status = 'above';

  return {
    key: metricKey,
    label: metric.label,
    originalName: metric.originalName,
    abbr: metric.abbr,
    unit: metric.unit,
    value: numeric,
    status,
    band,
    diffFromMedian: Math.round(((numeric - band.median) / band.median) * 100),
  };
}

/** Assess every metric present on a measurement row. */
function assessMeasurement(row) {
  return Object.keys(METRICS)
    .map((key) => assessMetric(key, row.gestational_week, row[key]))
    .filter(Boolean);
}

const STATUS_TEXT = {
  below: 'Di bawah rentang',
  normal: 'Dalam rentang',
  above: 'Di atas rentang',
};
