import { LogIn, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, configured, signInWithDiscord } = useAuth();
  if (user) return <Navigate to="/profile" replace />;

  return (
    <section className="section page-section auth-page">
      <div className="auth-card">
        <span className="eyebrow"><ShieldCheck size={15}/> Tài khoản cộng đồng</span>
        <h1>Đăng nhập Corgi-Bot</h1>
        <p>Đăng nhập bằng Discord để tham gia diễn đàn, bình luận tin tức, gửi hỗ trợ và quản lý hồ sơ cộng đồng.</p>
        {!configured && <div className="auth-warning">Supabase chưa được cấu hình. Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trước khi bật đăng nhập.</div>}
        <button className="btn discord-btn" disabled={!configured} onClick={signInWithDiscord}>
          <LogIn size={18}/> Tiếp tục với Discord
        </button>
        <small>Corgi-Bot chỉ nhận thông tin hồ sơ Discord cơ bản do bạn cho phép. Website không nhận mật khẩu Discord.</small>
      </div>
    </section>
  );
}
