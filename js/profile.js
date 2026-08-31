const form = document.getElementById('profile-form');
const hphtInput = document.getElementById('hpht');
const babyNameInput = document.getElementById('baby_name');
const statusBar = document.getElementById('status-bar');
const submitButton = form.querySelector('button[type="submit"]');

function showStatus(message, tone = 'info') {
  const tones = {
    info: 'text-neutral-500',
    error: 'text-orange-400',
    success: 'text-neutral-500',
  };
  statusBar.className = `text-sm ${tones[tone]}`;
  statusBar.textContent = message;
}

async function loadProfile(userId) {
  const { data, error } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    showStatus(`Gagal memuat profil: ${error.message}`, 'error');
    return;
  }

  if (data) {
    hphtInput.value = data.hpht;
    babyNameInput.value = data.baby_name || '';
  }
}

async function handleSubmit(event, userId) {
  event.preventDefault();

  const payload = {
    user_id: userId,
    hpht: hphtInput.value,
    baby_name: babyNameInput.value.trim() || null,
    updated_at: new Date().toISOString(),
  };

  submitButton.disabled = true;
  showStatus('Menyimpan...');

  const { error } = await db.from('profiles').upsert(payload);
  submitButton.disabled = false;

  if (error) {
    showStatus(`Gagal menyimpan: ${error.message}`, 'error');
    return;
  }

  showStatus('Profil tersimpan.', 'success');
}

requireAuth().then((session) => {
  if (!session) return;
  renderNav('profile');
  loadProfile(session.user.id);
  form.addEventListener('submit', (event) => handleSubmit(event, session.user.id));
});
