import { signOut } from './db.js';

const NAV_LINKS = [
  { key: 'index', href: 'index.html', label: 'Home' },
  { key: 'tracker', href: 'tracker.html', label: 'USG Tracker' },
  { key: 'grafik', href: 'grafik.html', label: 'Grafik' },
  { key: 'profile', href: 'profile.html', label: 'Profil' },
];

const ICON_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const ICON_EXTERNAL_LINK = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
const ICON_LOGOUT = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

export function themeIcon(isDark) {
  return isDark ? ICON_SUN : ICON_MOON;
}

export function applyStoredTheme() {
  const stored = localStorage.getItem('theme');
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

export function toggleTheme() {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  const button = document.getElementById('theme-toggle');
  if (button) button.innerHTML = themeIcon(dark);
}

function closeAccountMenu() {
  const menu = document.getElementById('account-menu');
  if (menu) menu.classList.add('hidden');
}

function toggleAccountMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('account-menu');
  if (menu) menu.classList.toggle('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function renderNav(active, email = '?') {
  const mount = document.getElementById('app-nav');
  if (!mount) return;

  const isDark = document.documentElement.classList.contains('dark');
  const initial = escapeHtml(email.charAt(0).toUpperCase());
  const safeEmail = escapeHtml(email);

  const links = NAV_LINKS.map((link) => {
    const activeClasses = link.key === active
      ? 'text-orange-500'
      : 'text-neutral-500 hover:text-orange-500 dark:text-neutral-400';
    return `<a href="${link.href}" class="transition ${activeClasses}">${link.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <nav class="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <a href="index.html" class="flex items-center gap-2 text-sm font-medium tracking-widest text-neutral-500 transition hover:text-orange-500 dark:text-neutral-400">
        <img src="assets/logo.svg" alt="" class="h-6 w-6" />
        BABYTRACKER
      </a>
      <div class="flex items-center gap-5 text-sm font-medium">
        ${links}
        <button
          id="theme-toggle" type="button" aria-label="Ganti tema"
          class="rounded-full border border-neutral-200 px-2.5 py-1 text-neutral-500 transition hover:border-orange-500 hover:text-orange-500 dark:border-neutral-800 dark:text-neutral-400"
        >${themeIcon(isDark)}</button>
        <div class="relative">
          <button
            id="account-toggle" type="button" aria-label="Menu akun"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-neutral-950"
          >${initial}</button>
          <div
            id="account-menu"
            class="hidden absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p class="truncate border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800">${safeEmail}</p>
            <a
              href="https://gilangirfan21.github.io/superapp/"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >${ICON_EXTERNAL_LINK} SuperApp</a>
            <button
              id="logout-btn" type="button"
              class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-800"
            >${ICON_LOGOUT} Keluar</button>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('account-toggle').addEventListener('click', toggleAccountMenu);
  document.getElementById('logout-btn').addEventListener('click', signOut);
  document.addEventListener('click', closeAccountMenu);
}

applyStoredTheme();
