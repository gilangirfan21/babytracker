const NAV_LINKS = [
  { key: 'index', href: 'index.html', label: 'Home' },
  { key: 'tracker', href: 'tracker.html', label: 'USG Tracker' },
  { key: 'profile', href: 'profile.html', label: 'Profil' },
];

function applyStoredTheme() {
  const stored = localStorage.getItem('theme');
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

function toggleTheme() {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  const button = document.getElementById('theme-toggle');
  if (button) button.textContent = dark ? '☀️' : '🌙';
}

function renderNav(active) {
  const mount = document.getElementById('app-nav');
  if (!mount) return;

  const isDark = document.documentElement.classList.contains('dark');

  const links = NAV_LINKS.map((link) => {
    const activeClasses = link.key === active
      ? 'text-orange-500'
      : 'text-neutral-500 hover:text-orange-500 dark:text-neutral-400';
    return `<a href="${link.href}" class="transition ${activeClasses}">${link.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <nav class="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <a href="index.html" class="flex items-center gap-2 text-sm font-medium tracking-widest text-neutral-500 transition hover:text-orange-500 dark:text-neutral-400">
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
          <img src="assets/logo.svg" alt="" class="h-3.5 w-3.5" />
        </span>
        BABYTRACKER
      </a>
      <div class="flex items-center gap-5 text-sm font-medium">
        ${links}
        <button
          id="theme-toggle" type="button" aria-label="Ganti tema"
          class="rounded-full border border-neutral-200 px-2.5 py-1 text-neutral-500 transition hover:border-orange-500 hover:text-orange-500 dark:border-neutral-800 dark:text-neutral-400"
        >${isDark ? '☀️' : '🌙'}</button>
        <button
          id="logout-btn" type="button"
          class="text-neutral-500 transition hover:text-orange-500 dark:text-neutral-400"
        >Keluar</button>
      </div>
    </nav>`;

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('logout-btn').addEventListener('click', signOut);
}

applyStoredTheme();
