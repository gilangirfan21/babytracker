// Growth charts — one small multiple per metric.
//
// X is the gestational week, on one window shared by all four charts, so they read
// as a set and a reader can scan a week straight down. Y is each metric's own scale;
// they are never merged onto one plot (weight in grams and femur in millimetres
// share no axis).
//
// Layering, back to front: gridlines → WHO p10–p90 band → median hairline →
// the measurements. The band is the backdrop, so a dot sitting outside it is the
// finding — position carries it, not colour. Out-of-range points get a direct
// label; everything else is left to the axis and the tooltip.

const VIEW_W = 400;
const VIEW_H = 250;
const PAD = { top: 14, right: 12, bottom: 34, left: 46 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

// Filled by renderGrowthChart, read by the hover layer. Keyed by chart id so one
// delegated listener on the page can serve every chart.
const CHART_DATA = {};

function round(n) {
  return Math.round(n * 100) / 100;
}

/** Axis ticks on 1/2/2.5/5 × 10ⁿ steps, aiming for `target` of them. */
function niceTicks(min, max, target = 4) {
  const span = max - min || 1;
  const rough = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) || 10 * mag;

  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1000; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

function formatValue(value) {
  return Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

/**
 * The week window every chart on the page shares, so a reader can scan one week
 * straight down the column. Zoomed to the weeks actually measured (plus breathing
 * room) rather than always 14–40: with only third-trimester scans on file the full
 * range leaves two thirds of every plot empty and squashes the band into a thread.
 * Falls back to the whole reference range when there is nothing to plot.
 */
function weekWindow(rows) {
  const MIN_SPAN = 12;
  const weeks = rows
    .map((row) => Number(row.gestational_week))
    .filter((w) => Number.isFinite(w) && w >= WEEK_MIN && w <= WEEK_MAX);

  if (!weeks.length) return { from: WEEK_MIN, to: WEEK_MAX };

  let from = Math.max(WEEK_MIN, Math.min(...weeks) - 2);
  let to = Math.min(WEEK_MAX, Math.max(...weeks) + 2);

  // A single scan would otherwise get a two-week plot — widen until it reads.
  while (to - from < MIN_SPAN && (from > WEEK_MIN || to < WEEK_MAX)) {
    if (from > WEEK_MIN) from--;
    if (to - from < MIN_SPAN && to < WEEK_MAX) to++;
  }

  return { from, to };
}

/** The WHO band for one metric across the weeks on screen. */
function bandSeries(metric, fetalSex, view) {
  const rows = [];
  for (let week = view.from; week <= view.to; week++) {
    const band = metric.reference(week, fetalSex);
    if (band) rows.push({ week, ...band });
  }
  return rows;
}

/** The user's own measurements for one metric, oldest week first. */
function metricSeries(metricKey, rows) {
  return rows
    .map((row) => ({
      week: Number(row.gestational_week),
      value: Number(row[metricKey]),
      date: row.measurement_date,
      fetalSex: row.fetal_sex || 'unknown',
    }))
    .filter((p) => Number.isFinite(p.week) && Number.isFinite(p.value) && p.value > 0)
    .sort((a, b) => a.week - b.week);
}

function svgText(x, y, text, className, anchor = 'middle') {
  return `<text x="${round(x)}" y="${round(y)}" class="${className}" text-anchor="${anchor}">${text}</text>`;
}

/**
 * Build one chart. Returns the SVG markup; the caller mounts it and the shared
 * hover layer picks it up via the chart id.
 */
function renderGrowthChart(chartId, metricKey, rows, fetalSex, view) {
  const metric = METRICS[metricKey];
  const band = bandSeries(metric, fetalSex, view);
  const points = metricSeries(metricKey, rows).filter(
    (p) => p.week >= view.from && p.week <= view.to
  );

  if (!band.length) return '';

  const values = [
    ...band.map((b) => b.low),
    ...band.map((b) => b.high),
    ...points.map((p) => p.value),
  ];
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  // Headroom so the band edge never touches the frame, tighter at the bottom: a
  // growth curve has no meaningful zero baseline, so the floor tracks the band's
  // own low end instead of stretching down to nothing. Still clamped at zero —
  // a negative weight axis would be nonsense.
  const spread = yMax - yMin || 1;
  const lo = Math.max(0, yMin - spread * 0.05);
  const hi = yMax + spread * 0.08;

  const weekSpan = view.to - view.from;
  const xOf = (week) => PAD.left + ((week - view.from) / weekSpan) * PLOT_W;
  const yOf = (value) => PAD.top + PLOT_H - ((value - lo) / (hi - lo)) * PLOT_H;

  // Gridlines + y labels.
  const ticks = niceTicks(lo, hi, 6);
  const grid = ticks
    .map((t) => {
      const y = yOf(t);
      return (
        `<line class="viz-grid" x1="${PAD.left}" y1="${round(y)}" x2="${PAD.left + PLOT_W}" y2="${round(y)}" />` +
        svgText(PAD.left - 8, y + 3.5, formatValue(t), 'viz-tick', 'end')
      );
    })
    .join('');

  // X labels anchored on the last week shown, stepped to fit the window.
  const weekStep = weekSpan <= 8 ? 1 : weekSpan <= 16 ? 2 : 4;
  const weekTicks = [];
  for (let w = view.to; w >= view.from; w -= weekStep) weekTicks.unshift(w);
  const xLabels = weekTicks
    .map((w) => svgText(xOf(w), PAD.top + PLOT_H + 18, w, 'viz-tick'))
    .join('');

  // The band: up the p10 edge, back down the p90 edge.
  const bandPath =
    'M' +
    band.map((b) => `${round(xOf(b.week))},${round(yOf(b.low))}`).join(' L') +
    ' L' +
    band
      .slice()
      .reverse()
      .map((b) => `${round(xOf(b.week))},${round(yOf(b.high))}`)
      .join(' L') +
    ' Z';

  const medianLine = band
    .map((b) => `${round(xOf(b.week))},${round(yOf(b.median))}`)
    .join(' ');

  const seriesLine = points
    .map((p) => `${round(xOf(p.week))},${round(yOf(p.value))}`)
    .join(' ');

  const assessed = points.map((p) => ({
    ...p,
    assessment: assessMetric(metricKey, p.week, p.value, fetalSex),
  }));

  const dots = assessed
    .map((p) => {
      const off = p.assessment && p.assessment.status !== 'normal';
      return `<circle class="viz-dot${off ? ' viz-dot-flagged' : ''}" cx="${round(xOf(p.week))}" cy="${round(yOf(p.value))}" r="${off ? 5 : 4.5}" />`;
    })
    .join('');

  // Label only the points that fall outside the band — a number on every dot is noise.
  const flaggedLabels = assessed
    .filter((p) => p.assessment && p.assessment.status !== 'normal')
    .map((p) => {
      const above = p.assessment.status === 'above';
      const x = Math.min(Math.max(xOf(p.week), PAD.left + 22), PAD.left + PLOT_W - 22);
      const y = above ? yOf(p.value) - 13 : yOf(p.value) + 20;
      return svgText(x, y, `${formatValue(p.value)} ${metric.unit}`, 'viz-flag-label');
    })
    .join('');

  // One hit column per week drives the crosshair and tooltip.
  const colW = PLOT_W / weekSpan;
  const hits = band
    .map(
      (b) =>
        `<rect class="viz-hit" data-chart="${chartId}" data-week="${b.week}" x="${round(xOf(b.week) - colW / 2)}" y="${PAD.top}" width="${round(colW)}" height="${PLOT_H}" />`
    )
    .join('');

  // Everything the hover layer needs, and nothing else.
  CHART_DATA[chartId] = { metric, band, points: assessed, xOf, yOf };

  const label = `Grafik ${metric.label} per usia kehamilan, dibanding rentang normal WHO persentil 10 sampai 90`;

  return `
    <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="viz-svg" role="img" aria-label="${label}">
      ${grid}
      <path class="viz-band" d="${bandPath}" />
      <polyline class="viz-median" points="${medianLine}" />
      <line class="viz-axis" x1="${PAD.left}" y1="${PAD.top + PLOT_H}" x2="${PAD.left + PLOT_W}" y2="${PAD.top + PLOT_H}" />
      ${xLabels}
      ${points.length > 1 ? `<polyline class="viz-line" points="${seriesLine}" />` : ''}
      ${dots}
      ${flaggedLabels}
      <line class="viz-crosshair" x1="0" y1="${PAD.top}" x2="0" y2="${PAD.top + PLOT_H}" />
      <circle class="viz-focus" cx="0" cy="0" r="6" />
      ${hits}
    </svg>`;
}

// ---------------------------------------------------------------------------
// Hover layer
//
// One delegated listener and one tooltip node serve every chart on the page.
// The hit targets are full-height week columns, so the pointer never has to find
// a 9px dot.

let tooltipEl = null;

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'viz-tooltip';
  tooltipEl.setAttribute('role', 'status');
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function tooltipHtml(chart, week) {
  const band = chart.band.find((b) => b.week === week);
  if (!band) return '';

  const measured = chart.points.filter((p) => p.week === week);
  const unit = chart.metric.unit;

  const measuredRows = measured
    .map((p) => {
      const status = p.assessment ? STATUS_TEXT[p.assessment.status] : '';
      const flagged = p.assessment && p.assessment.status !== 'normal';
      return `
        <div class="viz-tip-row viz-tip-measured">
          <span class="viz-tip-swatch"></span>
          <span>${formatValue(p.value)} ${unit}</span>
          <span class="${flagged ? 'viz-tip-flag' : 'viz-tip-muted'}">${status}</span>
        </div>`;
    })
    .join('');

  return `
    <p class="viz-tip-title">Minggu ke-${week}</p>
    ${measuredRows || '<p class="viz-tip-muted">Belum ada pemeriksaan</p>'}
    <div class="viz-tip-row viz-tip-muted">
      <span>Rentang normal</span>
      <span>${formatValue(band.low)}&ndash;${formatValue(band.high)} ${unit}</span>
    </div>
    <div class="viz-tip-row viz-tip-muted">
      <span>Median</span>
      <span>${formatValue(band.median)} ${unit}</span>
    </div>`;
}

function showTooltip(svg, chart, week, event) {
  const tip = ensureTooltip();
  tip.innerHTML = tooltipHtml(chart, week);
  tip.classList.add('is-visible');

  const crosshair = svg.querySelector('.viz-crosshair');
  crosshair.setAttribute('x1', chart.xOf(week));
  crosshair.setAttribute('x2', chart.xOf(week));
  svg.classList.add('is-hovered');

  // Park the focus ring on the measurement for this week, if there is one.
  const focus = svg.querySelector('.viz-focus');
  const point = chart.points.find((p) => p.week === week);
  if (point) {
    focus.setAttribute('cx', chart.xOf(point.week));
    focus.setAttribute('cy', chart.yOf(point.value));
    focus.classList.add('is-visible');
  } else {
    focus.classList.remove('is-visible');
  }

  // Beside the pointer, not above the plot: anchoring to the plot's top edge put
  // the card over the chart's own title. Flips to the left when it would run off
  // the right edge, and stays inside the viewport vertically.
  const tipRect = tip.getBoundingClientRect();
  const GAP = 16;

  let left = event.clientX + GAP;
  if (left + tipRect.width > window.innerWidth - 8) {
    left = event.clientX - GAP - tipRect.width;
  }
  left = Math.max(8, left);

  const top = Math.min(
    Math.max(event.clientY - tipRect.height / 2, 8),
    window.innerHeight - tipRect.height - 8
  );

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTooltip(root) {
  if (tooltipEl) tooltipEl.classList.remove('is-visible');
  root.querySelectorAll('.viz-svg.is-hovered').forEach((svg) => {
    svg.classList.remove('is-hovered');
    svg.querySelector('.viz-focus').classList.remove('is-visible');
  });
}

/**
 * Wire hover for every chart inside `root`. The listeners live on the container,
 * not the SVGs, so they survive a re-render — and the guard keeps a second call
 * from stacking another set on top.
 */
function attachChartHover(root) {
  if (root.dataset.hoverBound) return;
  root.dataset.hoverBound = 'true';

  root.addEventListener('pointermove', (event) => {
    const hit = event.target.closest('.viz-hit');
    if (!hit) {
      hideTooltip(root);
      return;
    }
    const chart = CHART_DATA[hit.dataset.chart];
    if (!chart) return;
    showTooltip(hit.closest('.viz-svg'), chart, Number(hit.dataset.week), event);
  });

  root.addEventListener('pointerleave', () => hideTooltip(root));
  window.addEventListener('scroll', () => hideTooltip(root), { passive: true });
}
