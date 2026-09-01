const NAV_LINKS = [
  { key: 'index', href: 'index.html', label: 'Home' },
  { key: 'tracker', href: 'tracker.html', label: 'USG Tracker' },
  { key: 'profile', href: 'profile.html', label: 'Profil' },
];

const ICON_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

function themeIcon(isDark) {
  return isDark ? ICON_SUN : ICON_MOON;
}

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
  if (button) button.innerHTML = themeIcon(dark);
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
      <a href="https://gilangirfan21.github.io/superapp/" class="flex items-center gap-2 text-sm font-medium tracking-widest text-neutral-500 transition hover:text-orange-500 dark:text-neutral-400">
        <img src="assets/logo.svg" alt="" class="h-6 w-6" />
        BABYTRACKER
      </a>
      <div class="flex items-center gap-5 text-sm font-medium">
        ${links}
        <button
          id="theme-toggle" type="button" aria-label="Ganti tema"
          class="rounded-full border border-neutral-200 px-2.5 py-1 text-neutral-500 transition hover:border-orange-500 hover:text-orange-500 dark:border-neutral-800 dark:text-neutral-400"
        >${themeIcon(isDark)}</button>
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
