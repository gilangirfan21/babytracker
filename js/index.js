const dashboard = document.getElementById('dashboard');

const DAY_MS = 24 * 60 * 60 * 1000;
const GESTATION_DAYS = 280; // 40 weeks from HPHT

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date) {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderEmptyState() {
  dashboard.innerHTML = `
    <p class="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">Selamat datang</p>
    <h1 class="max-w-md text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
      Selamat datang orang tua bayi
    </h1>
    <a
      href="tracker.html"
      class="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-orange-400"
    >Ke USG Tracker</a>`;
}

function renderDashboard(profile) {
  const hpht = startOfDay(new Date(profile.hpht));
  const today = startOfDay(new Date());
  const totalDays = Math.round((today - hpht) / DAY_MS);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const dueDate = new Date(hpht.getTime() + GESTATION_DAYS * DAY_MS);
  const daysUntilDue = Math.round((dueDate - today) / DAY_MS);

  dashboard.innerHTML = `
    <p class="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">Usia kehamilan</p>
    <h1 class="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
      ${weeks} minggu <span class="text-orange-500">${days} hari</span>
    </h1>
    <p class="text-sm text-neutral-500">
      Perkiraan lahir (HPL): <span class="text-neutral-700 dark:text-neutral-300">${formatDate(dueDate)}</span>
      ${daysUntilDue >= 0 ? `&middot; H-${daysUntilDue}` : ''}
    </p>
    <a
      href="tracker.html"
      class="mt-2 rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-orange-500 hover:text-orange-500 dark:border-neutral-800 dark:text-neutral-300"
    >Lihat USG Tracker</a>`;
}

async function loadDashboard(userId) {
  const { data, error } = await db.from('profile_baby').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    dashboard.innerHTML = `<p class="text-sm text-orange-400">Gagal memuat profil: ${error.message}</p>`;
    return;
  }

  if (!data) {
    renderEmptyState();
    return;
  }

  renderDashboard(data);
}

requireAuth().then((session) => {
  if (!session) return;
  renderNav('index');
  loadDashboard(session.user.id);
});
