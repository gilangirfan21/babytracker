const form = document.getElementById('measurement-form');
const weekSelect = document.getElementById('gestational_week');
const dateInput = document.getElementById('measurement_date');
const metricFields = document.getElementById('metric-fields');
const sexSelect = document.getElementById('fetal_sex');
const statusBar = document.getElementById('status-bar');
const historyList = document.getElementById('history-list');
const submitButton = form.querySelector('button[type="submit"]');

let currentUserId = null;

function buildWeekOptions() {
  for (let week = WEEK_MIN; week <= WEEK_MAX; week++) {
    const option = document.createElement('option');
    option.value = week;
    option.textContent = `Minggu ke-${week}`;
    weekSelect.appendChild(option);
  }
}

function buildSexOptions() {
  Object.entries(FETAL_SEX_OPTIONS).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sexSelect.appendChild(option);
  });
}

function buildMetricFields() {
  metricFields.innerHTML = Object.entries(METRICS)
    .map(
      ([key, metric]) => `
        <label class="block">
          <span class="text-sm text-neutral-400">${metric.label}
            <span class="text-neutral-500">(${metric.abbr})</span>
          </span>
          <span class="mt-0.5 block text-xs text-neutral-600">
            ${metric.originalName} &middot; ${metric.unit}
          </span>
          <input
            type="number" step="0.1" min="0" name="${key}" id="${key}"
            placeholder="${metric.placeholder}"
            class="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-neutral-100 placeholder-neutral-600 outline-none transition focus:border-orange-500"
          />
        </label>`
    )
    .join('');
}

function showStatus(message, tone = 'info') {
  const tones = {
    info: 'text-neutral-500 dark:text-neutral-400',
    error: 'text-orange-500 dark:text-orange-400',
    success: 'text-neutral-600 dark:text-neutral-300',
  };
  statusBar.className = `text-sm ${tones[tone]}`;
  statusBar.textContent = message;
}

function statusBadge(status) {
  const styles = {
    normal: 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400',
    below: 'border-orange-500/50 text-orange-500 dark:text-orange-400',
    above: 'border-orange-500/50 text-orange-500 dark:text-orange-400',
  };
  return `<span class="rounded-full border px-2.5 py-0.5 text-xs ${styles[status]}">${STATUS_TEXT[status]}</span>`;
}

function renderAssessment(assessments) {
  if (!assessments.length) {
    return '<p class="text-sm text-neutral-500 dark:text-neutral-600">Tidak ada data referensi untuk minggu ini.</p>';
  }

  return `
    <div class="mt-4 space-y-2">
      ${assessments
        .map(
          (a) => `
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-100 px-4 py-3 dark:bg-neutral-900/60">
          <div>
            <p class="text-sm text-neutral-700 dark:text-neutral-200">
              ${a.label} <span class="text-neutral-500">(${a.abbr})</span>
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-600">
              ${a.originalName}${
                a.sexApplied && a.sexApplied !== 'unknown'
                  ? ` &middot; tabel ${FETAL_SEX_OPTIONS[a.sexApplied].toLowerCase()}`
                  : ''
              }
            </p>
            <p class="mt-1 text-xs text-neutral-500">
              <span class="text-neutral-700 dark:text-neutral-300">${a.value} ${a.unit}</span>
              &middot; p10&ndash;p90: ${a.band.low}&ndash;${a.band.high}
              &middot; median ${a.band.median}
              (${a.diffFromMedian >= 0 ? '+' : ''}${a.diffFromMedian}%)
            </p>
          </div>
          ${statusBadge(a.status)}
        </div>`
        )
        .join('')}
    </div>`;
}

function renderHistory(rows) {
  if (!rows.length) {
    historyList.innerHTML =
      '<p class="rounded-xl border border-dashed border-neutral-300 px-6 py-12 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-600">Belum ada data. Tambah pemeriksaan pertama lewat form di atas.</p>';
    return;
  }

  historyList.innerHTML = rows
    .map((row) => {
      const assessments = assessMeasurement(row);
      const flagged = assessments.filter((a) => a.status !== 'normal').length;

      return `
      <article class="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-medium text-neutral-900 dark:text-white">Minggu ke-${row.gestational_week}</h3>
            <p class="text-xs text-neutral-500">
              ${formatDate(row.measurement_date)}
              ${
                row.fetal_sex && row.fetal_sex !== 'unknown'
                  ? ` &middot; ${FETAL_SEX_OPTIONS[row.fetal_sex]}`
                  : ''
              }
            </p>
          </div>
          <div class="flex items-center gap-3">
            ${
              flagged
                ? `<span class="text-xs text-orange-500 dark:text-orange-400">${flagged} perlu dicek</span>`
                : '<span class="text-xs text-neutral-500">Semua dalam rentang</span>'
            }
            <button
              data-delete="${row.id}"
              class="text-xs text-neutral-500 transition hover:text-orange-500 dark:text-neutral-600 dark:hover:text-orange-400"
            >Hapus</button>
          </div>
        </header>
        ${renderAssessment(assessments)}
        ${
          row.notes
            ? `<p class="mt-4 border-t border-neutral-200 pt-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">${escapeHtml(row.notes)}</p>`
            : ''
        }
      </article>`;
    })
    .join('');
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadHistory() {
  const { data, error } = await db
    .from('measurements')
    .select('*')
    .order('gestational_week', { ascending: false });

  if (error) {
    showStatus(`Gagal memuat data: ${error.message}`, 'error');
    return;
  }

  renderHistory(data);
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    user_id: currentUserId,
    gestational_week: Number(formData.get('gestational_week')),
    measurement_date: formData.get('measurement_date'),
    fetal_sex: formData.get('fetal_sex') || 'unknown',
    notes: formData.get('notes')?.trim() || null,
  };

  let hasMetric = false;
  for (const key of Object.keys(METRICS)) {
    const raw = formData.get(key);
    payload[key] = raw === '' ? null : Number(raw);
    if (payload[key] !== null) hasMetric = true;
  }

  if (!hasMetric) {
    showStatus('Isi minimal satu hasil pengukuran.', 'error');
    return;
  }

  submitButton.disabled = true;
  showStatus('Menyimpan...');

  const { error } = await db.from('measurements').insert(payload);
  submitButton.disabled = false;

  if (error) {
    showStatus(`Gagal menyimpan: ${error.message}`, 'error');
    return;
  }

  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showStatus('Data tersimpan.', 'success');
  loadHistory();
}

async function handleDelete(event) {
  const id = event.target.dataset.delete;
  if (!id || !confirm('Hapus data pemeriksaan ini?')) return;

  const { error } = await db.from('measurements').delete().eq('id', id);
  if (error) {
    showStatus(`Gagal menghapus: ${error.message}`, 'error');
    return;
  }

  showStatus('Data dihapus.', 'success');
  loadHistory();
}

requireAuth().then((session) => {
  if (!session) return;
  currentUserId = session.user.id;
  renderNav('tracker');

  buildWeekOptions();
  buildSexOptions();
  buildMetricFields();
  weekSelect.value = 20;
  dateInput.value = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', handleSubmit);
  historyList.addEventListener('click', handleDelete);

  loadHistory();
});
