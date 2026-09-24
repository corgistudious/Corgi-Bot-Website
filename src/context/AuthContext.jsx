import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { botApi, botApiConfigured } from '../lib/botApi';

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

  async function loadProfile(user, accessToken = null) {
    if (!supabase || !user) { setProfile(null); return; }
    const fallback = discordProfile(user);
    const { error: upsertError } = await supabase.from('profiles').upsert(fallback, { onConflict: 'id' });
    if (upsertError) console.warn('Profile upsert failed:', upsertError.message);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) console.warn('Profile load failed:', error.message);

    // Website authorization is owned by the bot backend (MongoDB WebRole),
    // never by the editable Supabase profile row.
    let webIdentity = null;
    if (botApiConfigured && accessToken) {
      try {
        webIdentity = await botApi.me(accessToken);
      } catch (apiError) {
        console.warn('Website role load failed:', apiError.message);
      }
    }

    setProfile({
      ...fallback,
      ...(data || {}),
      discord_id: webIdentity?.discordId || data?.discord_id || fallback.discord_id,
      role: webIdentity?.role || 'member',
    });
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user, session.access_token);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    let alive = true;

    // Keep the auth callback synchronous. Supabase warns against awaiting
    // other Supabase calls from inside onAuthStateChange because it can
    // deadlock session handling in the same client.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession || null);
      setLoading(false);
      queueMicrotask(() => {
        if (alive) loadProfile(nextSession?.user, nextSession?.access_token).catch(console.error);
      });
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.warn('Session restore failed:', error.message);
      const current = data?.session || null;
      setSession(current);
      setLoading(false);
      if (current?.user) loadProfile(current.user, current.access_token).catch(console.error);
      else setProfile(null);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signInWithDiscord() {
    if (!supabase) return { error: new Error('Supabase chưa được cấu hình.') };
    const redirectTo = `${window.location.origin}/auth/callback`;
    return supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo },
    });
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    configured: supabaseConfigured,
    signInWithDiscord,
    signOut,
    refreshProfile,
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
