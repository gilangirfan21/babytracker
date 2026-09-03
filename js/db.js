import { createClient } from '@supabase/supabase-js';

// Publishable/anon key is meant to be public — access control is handled by
// Row Level Security. Run supabase/schema.sql in the Supabase SQL editor to
// turn on RLS and scope every row to its owning user.
export const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function getSession() {
  const { data } = await db.auth.getSession();
  return data.session;
}

// Redirect to login when there's no session. Call at the top of every
// protected page, before rendering anything that needs a logged-in user.
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
    return null;
  }
  return session;
}

export async function signOut() {
  await db.auth.signOut();
  window.location.replace('login.html');
}
