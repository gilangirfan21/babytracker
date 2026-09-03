import { db, requireAuth } from './db.js';
import { renderNav } from './nav.js';
import { METRICS, FETAL_SEX_OPTIONS, STATUS_TEXT, assessMetric } from './growth-reference.js';
import { renderGrowthChart, attachChartHover, weekWindow } from './chart.js';

const chartGrid = document.getElementById('chart-grid');
const chartStatus = document.getElementById('chart-status');
const bandNote = document.getElementById('band-note');
const tableMount = document.getElementById('table-view');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * The EFW band shifts 3.5–4.5% with fetal sex, so the chart has to commit to one
 * table. Use the sex recorded on the most recent scan that knows it.
 */
function resolveFetalSex(rows) {
  const known = rows
    .filter((row) => row.fetal_sex && row.fetal_sex !== 'unknown')
    .sort((a, b) => new Date(b.measurement_date) - new Date(a.measurement_date));
  return known.length ? known[0].fetal_sex : 'unknown';
}

/** One line under each chart: where the newest reading landed. */
function latestSummary(metricKey, rows, fetalSex) {
  const withValue = rows
    .filter((row) => row[metricKey] !== null && row[metricKey] !== undefined)
    .sort((a, b) => a.gestational_week - b.gestational_week);

  if (!withValue.length) {
    return '<p class="mt-3 text-xs text-neutral-500 dark:text-neutral-600">Belum ada data untuk metrik ini.</p>';
  }

  const last = withValue[withValue.length - 1];
  const a = assessMetric(metricKey, last.gestational_week, last[metricKey], fetalSex);
  if (!a) {
    return '<p class="mt-3 text-xs text-neutral-500 dark:text-neutral-600">Minggu terakhir di luar tabel referensi.</p>';
  }

  const flagged = a.status !== 'normal';
  return `
    <p class="mt-3 text-xs text-neutral-500 dark:text-neutral-600">
      Terakhir minggu ke-${last.gestational_week}:
      <span class="text-neutral-700 dark:text-neutral-300">${a.value} ${a.unit}</span>
      &middot;
      <span class="${flagged ? 'text-orange-600 dark:text-orange-400' : ''}">${STATUS_TEXT[a.status]}</span>
      &middot; ${a.diffFromMedian >= 0 ? '+' : ''}${a.diffFromMedian}% dari median
    </p>`;
}

function renderCharts(rows, fetalSex) {
  // One window for all four, so a week lines up down the column.
  const view = weekWindow(rows);

  chartGrid.innerHTML = Object.entries(METRICS)
    .map(([key, metric], i) => {
      const chartId = `chart-${i}`;
      const sexNote =
        metric.sexSpecific && fetalSex !== 'unknown'
          ? ` &middot; tabel ${FETAL_SEX_OPTIONS[fetalSex].toLowerCase()}`
          : '';

      return `
        <article class="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h3 class="text-sm font-medium text-neutral-900 dark:text-white">
            ${metric.label} <span class="font-normal text-neutral-500">(${metric.abbr})</span>
          </h3>
          <p class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-600">
            ${metric.originalName} &middot; ${metric.unit}${sexNote}
          </p>
          <div class="mt-4">
            ${renderGrowthChart(chartId, key, rows, fetalSex, view)}
          </div>
          ${latestSummary(key, rows, fetalSex)}
        </article>`;
    })
    .join('');
}

/**
 * The chart's numbers in text form — the reading that does not depend on seeing
 * where a dot sits relative to a shaded region.
 */
function renderTable(rows, fetalSex) {
  if (!rows.length) {
    tableMount.innerHTML =
      '<p class="px-1 py-3 text-sm text-neutral-500 dark:text-neutral-600">Belum ada data.</p>';
    return;
  }

  const body = rows
    .slice()
    .sort((a, b) => a.gestational_week - b.gestational_week)
    .flatMap((row) =>
      Object.keys(METRICS)
        .map((key) => ({ key, a: assessMetric(key, row.gestational_week, row[key], fetalSex), row }))
        .filter((entry) => entry.a)
        .map(
          ({ a, row: r }) => `
          <tr class="border-t border-neutral-200 dark:border-neutral-800">
            <td class="py-2 pr-4 tabular-nums">${r.gestational_week}</td>
            <td class="py-2 pr-4 text-neutral-500 dark:text-neutral-500">${formatDate(r.measurement_date)}</td>
            <td class="py-2 pr-4">${a.label}</td>
            <td class="py-2 pr-4 tabular-nums">${a.value} ${a.unit}</td>
            <td class="py-2 pr-4 tabular-nums text-neutral-500 dark:text-neutral-500">${a.band.low}&ndash;${a.band.high}</td>
            <td class="py-2 ${a.status !== 'normal' ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-500 dark:text-neutral-500'}">${STATUS_TEXT[a.status]}</td>
          </tr>`
        )
    )
    .join('');

  tableMount.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[36rem] text-left text-xs">
        <thead class="text-neutral-500 dark:text-neutral-600">
          <tr>
            <th class="py-2 pr-4 font-medium">Mgg</th>
            <th class="py-2 pr-4 font-medium">Tanggal</th>
            <th class="py-2 pr-4 font-medium">Metrik</th>
            <th class="py-2 pr-4 font-medium">Nilai</th>
            <th class="py-2 pr-4 font-medium">p10&ndash;p90</th>
            <th class="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody class="text-neutral-700 dark:text-neutral-300">${body}</tbody>
      </table>
    </div>`;
}

async function loadCharts() {
  const { data, error } = await db
    .from('measurements')
    .select('*')
    .order('gestational_week', { ascending: true });

  if (error) {
    chartStatus.textContent = `Gagal memuat data: ${error.message}`;
    chartStatus.className = 'text-sm text-orange-600 dark:text-orange-400';
    return;
  }

  const rows = data || [];
  const fetalSex = resolveFetalSex(rows);

  chartStatus.textContent = rows.length
    ? ''
    : 'Belum ada pemeriksaan. Grafik di bawah menampilkan rentang normal WHO sebagai acuan.';

  bandNote.textContent =
    fetalSex === 'unknown'
      ? 'Rentang berat pakai tabel gabungan (jenis kelamin belum diisi).'
      : `Rentang berat pakai tabel ${FETAL_SEX_OPTIONS[fetalSex].toLowerCase()}.`;

  renderCharts(rows, fetalSex);
  renderTable(rows, fetalSex);
  attachChartHover(chartGrid);
}

requireAuth().then((session) => {
  if (!session) return;
  renderNav('grafik', session.user.email);
  loadCharts();
});
