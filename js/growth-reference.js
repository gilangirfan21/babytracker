// WHO Fetal Growth Charts — reference percentiles by gestational week (14–40).
//
// Source: Kiserud T, et al. "The World Health Organization Fetal Growth Charts:
// A Multinational Longitudinal Study of Ultrasound Biometric Measurements and
// Estimated Fetal Weight." PLOS Medicine 2017;14(1):e1002220.
// https://doi.org/10.1371/journal.pmed.1002220
//
// Values transcribed from the published tables:
//   t007 head circumference   t008 abdominal circumference   t009 femur length
//   t011 estimated fetal weight (regardless of sex)
//   t014 EFW female fetuses   t015 EFW male fetuses
//
// Each row is [p10, p50, p90]. A value below p10 or above p90 is flagged.
//
// NOTE: a correction to this paper (PLOS Med 2021;18(1):e1003526) swapped the
// captions on the two ratio tables (FL/HC vs FL/BPD). The biometry tables used
// here are unaffected, but read the correction before transcribing the ratio
// tables from the original PDF.
//
// Caveats worth knowing before trusting a verdict here:
//   - WHO found fetal growth differs significantly BETWEEN COUNTRIES (median
//     birthweight ranged from 2,975 g in India to 3,575 g in Norway). The authors
//     explicitly note these charts "may need to be adjusted for local clinical
//     use". Indonesia was not among the 10 study countries.
//   - Male fetuses run 3.5–4.5% heavier than female. Sex-specific EFW tables are
//     used when fetal sex is known; the unisex table is the fallback.
//   - EFW in this study was computed with Hadlock formula III, whose inputs are
//     HC, AC and FL. EFW is therefore NOT independent of the other three: if HC
//     drops, EFW drops mechanically. Never read them as two separate signals.

const EFW_UNISEX = {
  14: [78, 90, 104], 15: [99, 114, 132], 16: [124, 144, 166], 17: [155, 179, 207],
  18: [192, 222, 255], 19: [235, 272, 313], 20: [286, 330, 380], 21: [345, 398, 458],
  22: [412, 476, 548], 23: [489, 565, 650], 24: [576, 665, 765], 25: [673, 778, 894],
  26: [780, 902, 1038], 27: [898, 1039, 1196], 28: [1026, 1189, 1368],
  29: [1165, 1350, 1554], 30: [1313, 1523, 1753], 31: [1470, 1707, 1964],
  32: [1635, 1901, 2187], 33: [1807, 2103, 2419], 34: [1985, 2312, 2659],
  35: [2167, 2527, 2904], 36: [2352, 2745, 3153], 37: [2537, 2966, 3403],
  38: [2723, 3186, 3652], 39: [2905, 3403, 3897], 40: [3084, 3617, 4135],
};

const EFW_FEMALE = {
  14: [77, 89, 102], 15: [97, 113, 129], 16: [122, 141, 162], 17: [152, 176, 202],
  18: [188, 217, 248], 19: [231, 266, 304], 20: [281, 322, 369], 21: [339, 388, 444],
  22: [405, 464, 530], 23: [481, 551, 629], 24: [567, 649, 740], 25: [663, 758, 865],
  26: [769, 880, 1003], 27: [886, 1014, 1156], 28: [1013, 1160, 1323],
  29: [1150, 1319, 1505], 30: [1296, 1489, 1699], 31: [1451, 1670, 1907],
  32: [1614, 1861, 2127], 33: [1783, 2060, 2358], 34: [1957, 2268, 2598],
  35: [2135, 2481, 2846], 36: [2314, 2698, 3099], 37: [2493, 2917, 3357],
  38: [2670, 3136, 3616], 39: [2843, 3354, 3875], 40: [3010, 3567, 4131],
};

const EFW_MALE = {
  14: [79, 92, 105], 15: [100, 116, 134], 16: [127, 146, 169], 17: [158, 183, 210],
  18: [196, 226, 260], 19: [241, 277, 320], 20: [293, 337, 389], 21: [354, 407, 469],
  22: [424, 487, 561], 23: [503, 578, 666], 24: [592, 681, 785], 25: [692, 795, 917],
  26: [803, 923, 1063], 27: [924, 1063, 1224], 28: [1055, 1215, 1399],
  29: [1197, 1379, 1587], 30: [1349, 1555, 1788], 31: [1509, 1741, 2000],
  32: [1677, 1937, 2224], 33: [1852, 2140, 2456], 34: [2032, 2350, 2694],
  35: [2217, 2565, 2938], 36: [2404, 2783, 3185], 37: [2591, 3001, 3432],
  38: [2778, 3218, 3676], 39: [2962, 3432, 3916], 40: [3142, 3639, 4149],
};

const HEAD_CIRCUMFERENCE = {
  14: [91, 100, 107], 15: [102, 111, 119], 16: [114, 123, 132], 17: [126, 135, 144],
  18: [138, 148, 157], 19: [150, 161, 170], 20: [163, 173, 183], 21: [175, 186, 196],
  22: [187, 198, 209], 23: [199, 210, 221], 24: [211, 222, 233], 25: [222, 233, 245],
  26: [232, 244, 256], 27: [242, 254, 267], 28: [251, 264, 277], 29: [260, 273, 286],
  30: [268, 281, 295], 31: [275, 289, 303], 32: [282, 296, 311], 33: [289, 303, 318],
  34: [295, 309, 324], 35: [300, 315, 330], 36: [306, 321, 336], 37: [311, 326, 341],
  38: [315, 332, 347], 39: [320, 337, 352], 40: [325, 342, 357],
};

const ABDOMINAL_CIRCUMFERENCE = {
  14: [73, 81, 89], 15: [83, 92, 100], 16: [93, 103, 112], 17: [104, 114, 124],
  18: [116, 126, 136], 19: [127, 138, 148], 20: [139, 150, 161], 21: [150, 162, 173],
  22: [162, 173, 186], 23: [173, 185, 198], 24: [184, 197, 210], 25: [195, 208, 222],
  26: [205, 219, 233], 27: [215, 230, 245], 28: [225, 240, 256], 29: [234, 250, 266],
  30: [243, 260, 277], 31: [252, 269, 287], 32: [260, 279, 298], 33: [269, 288, 308],
  34: [277, 298, 318], 35: [286, 307, 329], 36: [294, 317, 340], 37: [304, 328, 352],
  38: [313, 338, 364], 39: [324, 350, 377], 40: [335, 363, 391],
};

const FEMUR_LENGTH = {
  14: [11, 13, 15], 15: [14, 16, 18], 16: [17, 19, 22], 17: [20, 22, 25],
  18: [23, 26, 28], 19: [26, 29, 31], 20: [30, 32, 35], 21: [33, 35, 38],
  22: [35, 38, 40], 23: [38, 41, 43], 24: [41, 43, 46], 25: [43, 46, 48],
  26: [45, 48, 51], 27: [47, 50, 53], 28: [49, 52, 55], 29: [51, 54, 57],
  30: [53, 56, 60], 31: [55, 59, 62], 32: [57, 61, 64], 33: [60, 63, 66],
  34: [61, 65, 68], 35: [63, 67, 70], 36: [65, 69, 72], 37: [67, 70, 74],
  38: [68, 72, 75], 39: [69, 73, 76], 40: [69, 73, 77],
};

export const WEEK_MIN = 14;
export const WEEK_MAX = 40;

export const FETAL_SEX_OPTIONS = {
  unknown: 'Belum diketahui',
  female: 'Perempuan',
  male: 'Laki-laki',
};

function bandFrom(table, week) {
  const row = table[week];
  return row ? { low: row[0], median: row[1], high: row[2] } : null;
}

// `tolerance` absorbs the fact that the published tables are rounded to whole
// units. Without it a femur of 57.1 mm against a p90 of 57 mm raises an alarm
// over 0.1 mm — far below the resolution of both the table and the probe.
export const METRICS = {
  weight_grams: {
    label: 'Berat janin',
    originalName: 'Estimated Fetal Weight',
    abbr: 'EFW',
    unit: 'gram',
    placeholder: 'mis. 665',
    sexSpecific: true,
    tolerance: 0,
    derived: true, // Hadlock III — computed from HC, AC and FL.
    reference: (week, fetalSex) => {
      const table =
        fetalSex === 'female' ? EFW_FEMALE : fetalSex === 'male' ? EFW_MALE : EFW_UNISEX;
      return bandFrom(table, week);
    },
  },
  head_circumference_mm: {
    label: 'Lingkar kepala',
    originalName: 'Head Circumference',
    abbr: 'HC',
    unit: 'mm',
    placeholder: 'mis. 222',
    tolerance: 0.5,
    reference: (week) => bandFrom(HEAD_CIRCUMFERENCE, week),
  },
  abdominal_circumference_mm: {
    label: 'Lingkar perut',
    originalName: 'Abdominal Circumference',
    abbr: 'AC',
    unit: 'mm',
    placeholder: 'mis. 197',
    tolerance: 0.5,
    reference: (week) => bandFrom(ABDOMINAL_CIRCUMFERENCE, week),
  },
  femur_length_mm: {
    label: 'Panjang femur',
    originalName: 'Femur Length',
    abbr: 'FL',
    unit: 'mm',
    placeholder: 'mis. 43',
    tolerance: 0.5,
    reference: (week) => bandFrom(FEMUR_LENGTH, week),
  },
};

/* ------------------------------------------------------------------ *
 * Percentile estimation
 * ------------------------------------------------------------------ */

// Abramowitz & Stegun 7.1.26. Max absolute error ~1.5e-7 — far finer than the
// 1 mm resolution of the underlying tables.
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

const Z_P90 = 1.2815515655446004; // inverse normal CDF at 0.90

/**
 * Estimate where a value sits as a percentile, given only [p10, p50, p90].
 *
 * The published tables give three points, not a distribution. This fits a
 * normal on each side of the median separately — the p10→p50 gap sets the
 * lower spread, p50→p90 the upper — which handles the mild right skew in fetal
 * biometry better than one symmetric normal would.
 *
 * This is an ESTIMATE for reading trends, not a clinical percentile. Clamped to
 * 1–99 because a three-point fit says nothing trustworthy about the tails.
 */
export function estimatePercentile(value, band) {
  if (!band || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const { low, median, high } = band;

  const spread = v >= median ? (high - median) / Z_P90 : (median - low) / Z_P90;
  if (!(spread > 0)) return null;

  return Math.min(99, Math.max(1, Math.round(normalCdf((v - median) / spread) * 100)));
}

/* ------------------------------------------------------------------ *
 * Single-measurement assessment
 * ------------------------------------------------------------------ */

/**
 * Compare one measurement against its WHO reference band.
 * Returns null when the week falls outside the reference table (14–40).
 */
export function assessMetric(metricKey, week, value, fetalSex = 'unknown') {
  const metric = METRICS[metricKey];
  if (!metric || value === null || value === undefined || value === '') return null;

  const band = metric.reference(Number(week), fetalSex);
  if (!band) return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  const tol = metric.tolerance ?? 0;
  let status = 'normal';
  if (numeric < band.low - tol) status = 'below';
  else if (numeric > band.high + tol) status = 'above';

  return {
    key: metricKey,
    label: metric.label,
    originalName: metric.originalName,
    abbr: metric.abbr,
    unit: metric.unit,
    value: numeric,
    week: Number(week),
    status,
    band,
    // Which table produced this band — worth showing for EFW, since a known
    // fetal sex shifts the whole band by 3.5–4.5%.
    sexApplied: metric.sexSpecific ? fetalSex : null,
    diffFromMedian: Math.round(((numeric - band.median) / band.median) * 100),
    // Unrounded, for charting and trend maths.
    diffFromMedianExact: ((numeric - band.median) / band.median) * 100,
    percentile: estimatePercentile(numeric, band),
  };
}

/** Assess every metric present on a measurement row. */
export function assessMeasurement(row) {
  const fetalSex = row.fetal_sex || 'unknown';
  return Object.keys(METRICS)
    .map((key) => assessMetric(key, row.gestational_week, row[key], fetalSex))
    .filter(Boolean);
}

export const STATUS_TEXT = {
  below: 'Di bawah p10',
  normal: 'Dalam rentang',
  above: 'Di atas p90',
};

/* ------------------------------------------------------------------ *
 * Trend across visits
 * ------------------------------------------------------------------ */

// A single point inside p10–p90 tells you almost nothing. What obstetricians
// actually read is the direction of travel between visits. A value can sit
// "Dalam rentang" at every single visit while sliding from p72 to p16, and a
// pass/fail check against the band cannot see that at all.
export const DRIFT_STEP_THRESHOLD = 25; // percentile points between two visits
export const DRIFT_TOTAL_THRESHOLD = 30; // percentile points across the series

export const TREND_TEXT = {
  stable: 'Stabil',
  drifting_down: 'Turun antar kunjungan',
  drifting_up: 'Naik antar kunjungan',
  noisy: 'Naik-turun (kemungkinan variasi pengukuran)',
  insufficient: 'Butuh minimal 2 pengukuran',
};

/**
 * Track one metric across every visit and describe how its percentile moves.
 *
 * `noisy` matters as much as `drifting_down`. A metric that swings both ways by
 * large amounts is telling you the measurement error in this dataset is wide —
 * which is context for how seriously to read a drift in any OTHER metric.
 * Femur length is the usual culprit: it is a straight bone and the easiest
 * thing to measure, so if FL is bouncing 60 percentile points between visits,
 * a 25-point move elsewhere is probably the same noise.
 */
export function assessSeries(rows, metricKey, fetalSex = 'unknown') {
  const points = (rows || [])
    .filter(
      (r) => r && r[metricKey] !== null && r[metricKey] !== undefined && r[metricKey] !== ''
    )
    .map((r) => assessMetric(metricKey, r.gestational_week, r[metricKey], fetalSex))
    .filter((a) => a && a.percentile !== null)
    .sort((a, b) => a.week - b.week);

  const metric = METRICS[metricKey];
  const base = {
    key: metricKey,
    label: metric ? metric.label : metricKey,
    abbr: metric ? metric.abbr : metricKey,
    points,
    steps: [],
    totalChange: null,
    maxDrop: 0,
    maxRise: 0,
    trend: 'insufficient',
    flagged: false,
  };

  if (points.length < 2) return base;

  const steps = [];
  for (let i = 1; i < points.length; i++) {
    steps.push({
      fromWeek: points[i - 1].week,
      toWeek: points[i].week,
      fromPercentile: points[i - 1].percentile,
      toPercentile: points[i].percentile,
      change: points[i].percentile - points[i - 1].percentile,
    });
  }

  const changes = steps.map((s) => s.change);
  const maxDrop = Math.min(0, ...changes);
  const maxRise = Math.max(0, ...changes);
  const totalChange = points[points.length - 1].percentile - points[0].percentile;

  const bigDrop = Math.abs(maxDrop) >= DRIFT_STEP_THRESHOLD;
  const bigRise = maxRise >= DRIFT_STEP_THRESHOLD;

  let trend = 'stable';
  if (bigDrop && bigRise) trend = 'noisy';
  else if (bigDrop || totalChange <= -DRIFT_TOTAL_THRESHOLD) trend = 'drifting_down';
  else if (bigRise || totalChange >= DRIFT_TOTAL_THRESHOLD) trend = 'drifting_up';

  return {
    ...base,
    steps,
    totalChange,
    maxDrop,
    maxRise,
    trend,
    // Only a one-way slide is worth surfacing. Two-way scatter is a measurement
    // artefact, and flagging it would train you to ignore the flag.
    flagged: trend === 'drifting_down' || trend === 'drifting_up',
  };
}

/** Run assessSeries over every metric. */
export function assessAllSeries(rows, fetalSex = 'unknown') {
  return Object.keys(METRICS).map((key) => assessSeries(rows, key, fetalSex));
}

/* ------------------------------------------------------------------ *
 * Body proportion ratios
 * ------------------------------------------------------------------ */

// WHO added the FL/HC ratio specifically as a screening tool for when fetal
// body proportions are suspected to be out of range — it is the published
// instrument for the question "is this head small relative to the rest of this
// baby, or is this whole baby simply on the small side?". HC/AC is the standard
// symmetry check and normally crosses 1.0 around weeks 34–36.
//
// IMPORTANT: the reference values below are DERIVED by dividing the WHO median
// tables, not transcribed from the published ratio tables. The derived median
// is close to but not identical to the published one, and there is deliberately
// no p10/p90 band here, because dividing two medians does not give you the
// spread of the ratio. Treat these as directional only. For a real percentile,
// transcribe the published ratio tables — and read the 2021 correction first,
// the two captions are swapped.
export const RATIOS = {
  hc_ac: {
    label: 'HC / AC',
    description: 'Simetri kepala vs badan. Normal melewati 1,0 di sekitar minggu 34–36.',
    compute: (row) =>
      row.head_circumference_mm && row.abdominal_circumference_mm
        ? Number(row.head_circumference_mm) / Number(row.abdominal_circumference_mm)
        : null,
    referenceMedian: (week) => {
      const hc = bandFrom(HEAD_CIRCUMFERENCE, week);
      const ac = bandFrom(ABDOMINAL_CIRCUMFERENCE, week);
      return hc && ac ? hc.median / ac.median : null;
    },
  },
  fl_hc: {
    label: 'FL / HC',
    description:
      'Alat skrining WHO untuk proporsi tubuh janin. Naik = kepala relatif kecil terhadap badan.',
    compute: (row) =>
      row.femur_length_mm && row.head_circumference_mm
        ? Number(row.femur_length_mm) / Number(row.head_circumference_mm)
        : null,
    referenceMedian: (week) => {
      const fl = bandFrom(FEMUR_LENGTH, week);
      const hc = bandFrom(HEAD_CIRCUMFERENCE, week);
      return fl && hc ? fl.median / hc.median : null;
    },
  },
};

/** Compute both ratios for one measurement row, against the derived reference. */
export function assessRatios(row) {
  const week = Number(row.gestational_week);
  return Object.entries(RATIOS)
    .map(([key, def]) => {
      const value = def.compute(row);
      const reference = def.referenceMedian(week);
      if (value === null || reference === null || !Number.isFinite(value)) return null;
      return {
        key,
        label: def.label,
        description: def.description,
        week,
        value,
        reference,
        diffFromReference: ((value - reference) / reference) * 100,
        derived: true, // reference computed from median tables, not published
      };
    })
    .filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

/**
 * One object with everything needed to describe the whole record: per-visit
 * assessments, per-metric trends, and the ratio track.
 *
 * Nothing here is a diagnosis. It is arithmetic against a chart built from ten
 * countries that did not include Indonesia. Bring the trend to the obstetrician
 * and let them read it.
 */
export function summarise(rows, fetalSex = 'unknown') {
  const sorted = (rows || []).slice().sort((a, b) => a.gestational_week - b.gestational_week);
  const series = assessAllSeries(sorted, fetalSex);

  return {
    visits: sorted.length,
    series,
    flagged: series.filter((s) => s.flagged),
    ratios: sorted.map((row) => ({
      week: Number(row.gestational_week),
      values: assessRatios(row),
    })),
    latest: sorted.length
      ? {
          week: Number(sorted[sorted.length - 1].gestational_week),
          metrics: assessMeasurement(sorted[sorted.length - 1]),
          ratios: assessRatios(sorted[sorted.length - 1]),
        }
      : null,
  };
}
