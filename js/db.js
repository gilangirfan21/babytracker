const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getSession() {
  const { data } = await db.auth.getSession();
  return data.session;
}

// Redirect to login when there's no session. Call at the top of every
// protected page, before rendering anything that needs a logged-in user.
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
    return null;
  }
  return session;
}

async function signOut() {
  await db.auth.signOut();
  window.location.replace('login.html');
}
