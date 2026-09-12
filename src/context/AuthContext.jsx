import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

function discordProfile(user) {
  const meta = user?.user_metadata || {};
  return {
    id: user.id,
    discord_id: meta.provider_id || meta.sub || user.identities?.[0]?.identity_data?.provider_id || null,
    display_name: meta.full_name || meta.name || meta.user_name || meta.preferred_username || 'Corgi Member',
    username: meta.user_name || meta.preferred_username || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  async function loadProfile(user) {
    if (!supabase || !user) { setProfile(null); return; }
    const fallback = discordProfile(user);
    await supabase.from('profiles').upsert(fallback, { onConflict: 'id' });
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data || { ...fallback, role: 'member' });
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session || null);
      await loadProfile(data.session?.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithDiscord() {
    if (!supabase) return { error: new Error('Supabase chưa được cấu hình.') };
    return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); }

  const value = useMemo(() => ({ session, user: session?.user || null, profile, loading, configured: supabaseConfigured, signInWithDiscord, signOut, refreshProfile }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
