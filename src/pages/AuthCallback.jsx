import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) navigate(user ? '/profile' : '/login', { replace: true });
  }, [loading, user, navigate]);

  return <section className="section page-section"><p className="muted">Đang hoàn tất đăng nhập Discord…</p></section>;
}
