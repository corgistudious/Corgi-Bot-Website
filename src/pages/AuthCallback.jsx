import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Đang hoàn tất đăng nhập Discord…');

  useEffect(() => {
    let alive = true;

    async function finishAuth() {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Discord OAuth currently returns Supabase's implicit-flow tokens in
        // the URL fragment. Persist them explicitly before leaving callback.
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        const oauthError = hash.get('error_description') || hash.get('error');

        if (oauthError) throw new Error(oauthError);

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (!data?.session?.user) throw new Error('Supabase không tạo được phiên đăng nhập.');

          // Remove credentials from browser history/address bar immediately.
          window.history.replaceState({}, document.title, '/auth/callback');
          if (alive) navigate('/profile', { replace: true });
          return;
        }

        // Fallback for an already-persisted session (or future auth-flow changes).
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session?.user) {
          window.history.replaceState({}, document.title, '/auth/callback');
          if (alive) navigate('/profile', { replace: true });
          return;
        }

        throw new Error('Không tìm thấy phiên đăng nhập từ Discord.');
      } catch (error) {
        // Never leave OAuth credentials in the visible URL after a failure.
        window.history.replaceState({}, document.title, '/auth/callback');
        if (!alive) return;
        console.error('OAuth callback failed:', error);
        setMessage(`Đăng nhập thất bại: ${error?.message || 'Lỗi không xác định'}`);
      }
    }

    finishAuth();
    return () => { alive = false; };
  }, [navigate]);

  return <section className="section page-section"><p className="muted">{message}</p></section>;
}
