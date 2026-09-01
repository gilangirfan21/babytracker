const form = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const statusBar = document.getElementById('status-bar');
const togglePrompt = document.getElementById('toggle-prompt');
const toggleModeButton = document.getElementById('toggle-mode');

let mode = 'signin';

function showStatus(message, tone = 'info') {
  const tones = {
    info: 'text-neutral-500',
    error: 'text-orange-400',
    success: 'text-neutral-500',
  };
  statusBar.className = `text-center text-sm ${tones[tone]}`;
  statusBar.textContent = message;
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignUp = mode === 'signup';
  formTitle.textContent = isSignUp ? 'Daftar' : 'Masuk';
  submitButton.textContent = isSignUp ? 'Daftar' : 'Masuk';
  togglePrompt.textContent = isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?';
  toggleModeButton.textContent = isSignUp ? 'Masuk' : 'Daftar';
  showStatus('');
}

async function handleSubmit(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  submitButton.disabled = true;
  showStatus(mode === 'signup' ? 'Mendaftarkan...' : 'Memproses...');

  if (mode === 'signup') {
    const { data, error } = await db.auth.signUp({ email, password });
    submitButton.disabled = false;

    if (error) {
      showStatus(error.message, 'error');
      return;
    }

    if (data.session) {
      window.location.replace('index.html');
      return;
    }

    showStatus('Pendaftaran berhasil. Cek email untuk konfirmasi, lalu masuk.', 'success');
    setMode('signin');
    return;
  }

  const { error } = await db.auth.signInWithPassword({ email, password });
  submitButton.disabled = false;

  if (error) {
    showStatus(error.message, 'error');
    return;
  }

  window.location.replace('index.html');
}

const themeToggleButton = document.getElementById('theme-toggle');
themeToggleButton.innerHTML = themeIcon(document.documentElement.classList.contains('dark'));
themeToggleButton.addEventListener('click', toggleTheme);

form.addEventListener('submit', handleSubmit);
toggleModeButton.addEventListener('click', () => setMode(mode === 'signup' ? 'signin' : 'signup'));

getSession().then((session) => {
  if (session) window.location.replace('index.html');
});
