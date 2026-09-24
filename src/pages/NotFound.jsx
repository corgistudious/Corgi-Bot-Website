import { Link } from 'react-router-dom';
export default function NotFound(){return <section className="section page-section"><div className="auth-card"><span className="eyebrow">404</span><h1>Không tìm thấy trang</h1><p>Đường dẫn này không tồn tại hoặc đã được di chuyển.</p><Link className="btn primary" to="/">Về trang chủ</Link></div></section>}
