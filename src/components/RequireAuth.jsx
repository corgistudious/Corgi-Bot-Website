import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <section className="section page-section"><p className="muted">Đang kiểm tra tài khoản…</p></section>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}
