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
// Caveats worth knowing before trusting a verdict here:
//   - WHO found fetal growth differs significantly BETWEEN COUNTRIES (median
//     birthweight ranged from 2,975 g in India to 3,575 g in Norway). The authors
//     explicitly note these charts "may need to be adjusted for local clinical
//     use". Indonesia was not among the 10 study countries.
//   - Male fetuses run 3.5–4.5% heavier than female. Sex-specific EFW tables are
//     used when fetal sex is known; the unisex table is the fallback.

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

const WEEK_MIN = 14;
const WEEK_MAX = 40;

const FETAL_SEX_OPTIONS = {
  unknown: 'Belum diketahui',
  female: 'Perempuan',
  male: 'Laki-laki',
};

function bandFrom(table, week) {
  const row = table[week];
  return row ? { low: row[0], median: row[1], high: row[2] } : null;
}

const METRICS = {
  weight_grams: {
    label: 'Berat janin',
    originalName: 'Estimated Fetal Weight',
    abbr: 'EFW',
    unit: 'gram',
    placeholder: 'mis. 665',
    sexSpecific: true,
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
    reference: (week) => bandFrom(HEAD_CIRCUMFERENCE, week),
  },
  abdominal_circumference_mm: {
    label: 'Lingkar perut',
    originalName: 'Abdominal Circumference',
    abbr: 'AC',
    unit: 'mm',
    placeholder: 'mis. 197',
    reference: (week) => bandFrom(ABDOMINAL_CIRCUMFERENCE, week),
  },
  femur_length_mm: {
    label: 'Panjang femur',
    originalName: 'Femur Length',
    abbr: 'FL',
    unit: 'mm',
    placeholder: 'mis. 43',
    reference: (week) => bandFrom(FEMUR_LENGTH, week),
  },
};

/**
 * Compare one measurement against its WHO reference band.
 * Returns null when the week falls outside the reference table (14–40).
 */
function assessMetric(metricKey, week, value, fetalSex = 'unknown') {
  const metric = METRICS[metricKey];
  if (!metric || value === null || value === undefined || value === '') return null;

  const band = metric.reference(Number(week), fetalSex);
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
    // Which table produced this band — worth showing for EFW, since a known
    // fetal sex shifts the whole band by 3.5–4.5%.
    sexApplied: metric.sexSpecific ? fetalSex : null,
    diffFromMedian: Math.round(((numeric - band.median) / band.median) * 100),
  };
}

/** Assess every metric present on a measurement row. */
function assessMeasurement(row) {
  const fetalSex = row.fetal_sex || 'unknown';
  return Object.keys(METRICS)
    .map((key) => assessMetric(key, row.gestational_week, row[key], fetalSex))
    .filter(Boolean);
}

const STATUS_TEXT = {
  below: 'Di bawah p10',
  normal: 'Dalam rentang',
  above: 'Di atas p90',
};
