import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleAtLeast } from '../lib/community';
export default function RequireStaff({ children, level='moderator' }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <section className="section page-section"><p className="muted">Đang kiểm tra quyền…</p></section>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roleAtLeast(profile?.role, level)) return <Navigate to="/" replace />;
  return children;
}
