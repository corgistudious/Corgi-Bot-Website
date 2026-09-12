import { Check, Crown, Sparkles } from 'lucide-react';

const premiumUrl = 'https://discord.com/discovery/applications/1535411104128438392/store/1546685153252737135';

export default function Premium() {
  return (
    <section className="section page-section">
      <div className="section-heading centered">
        <span>PREMIUM</span>
        <h1>Nâng cấp trải nghiệm Corgi-Bot</h1>
        <p>Premium dành cho server muốn nhiều tiện ích hơn mà vẫn giữ trải nghiệm gọn gàng.</p>
      </div>
      <div className="premium-card">
        <div className="premium-badge"><Crown size={30}/></div>
        <div>
          <span className="eyebrow"><Sparkles size={14}/> Corgi Premium</span>
          <h2>Corgi Premium Standard</h2>
          <p className="muted">5,99 US$ / tháng · áp dụng cho 1 Discord server</p>
        </div>
        <ul>
          <li><Check size={18}/> Quyền lợi Premium trong bot</li>
          <li><Check size={18}/> Giftcode /redeem</li>
          <li><Check size={18}/> Trải nghiệm tính năng nâng cao</li>
          <li><Check size={18}/> Nội dung Premium sẽ tiếp tục được mở rộng</li>
        </ul>
        <p className="muted">AI cơ bản vẫn miễn phí — không yêu cầu Premium.</p>
        <a className="btn primary" href={premiumUrl} target="_blank" rel="noreferrer">
          <Crown size={18}/> Mua Premium trên Discord
        </a>
      </div>
    </section>
  );
}
