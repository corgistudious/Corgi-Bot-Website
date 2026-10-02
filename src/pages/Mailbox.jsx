import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Gift, Inbox, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { botApi, botApiConfigured } from '../lib/botApi';

function rewardText(r){if(!r)return '';if(typeof r==='string')return r;const labels={cxu:'CXu',redFragments:'Mảnh Ghép Đỏ',prismaticFragments:'Mảnh Ngũ Sắc',purpleDiamonds:'Kim Cương Tím',contributionPoints:'Điểm Cống Hiến',eventTickets:'Vé Sự Kiện'};return Object.entries(r).filter(([,v])=>Number(v)>0).map(([k,v])=>`${labels[k]||k}: ${Number(v).toLocaleString()}`).join(' • ')||'Không có vật phẩm';}
function fmtDate(value){
  if(!value) return '';
  try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value);}
}

export default function Mailbox(){
  const {user,session}=useAuth();
  const token=session?.access_token;
  const [mails,setMails]=useState([]);
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const unread=useMemo(()=>mails.filter(x=>!x.readAt && !x.read).length,[mails]);
  const claimable=useMemo(()=>mails.filter(x=>(x.reward||x.rewards||x.attachments) && !(x.claimedAt||x.claimed)).length,[mails]);

  async function load(){
    if(!token||!botApiConfigured) return;
    setLoading(true); setError('');
    try{const data=await botApi.mailbox(token); setMails(Array.isArray(data)?data:(data?.items||data?.mails||[]));}
    catch(e){setError(e.message||'MAILBOX_LOAD_FAILED');}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[token]);

  async function readMail(id){
    if(!token) return; setBusy(`read:${id}`);
    try{await botApi.mailboxRead(id,token); await load();}catch(e){setError(e.message||'MAIL_READ_FAILED');}finally{setBusy('');}
  }
  async function claim(id){
    if(!token) return; setBusy(`claim:${id}`);
    try{await botApi.mailboxClaim(id,token); await load();}catch(e){setError(e.message||'MAIL_CLAIM_FAILED');}finally{setBusy('');}
  }
  async function claimAll(){
    if(!token) return; setBusy('all');
    try{await botApi.mailboxClaimAll(token); await load();}catch(e){setError(e.message||'MAIL_CLAIM_ALL_FAILED');}finally{setBusy('');}
  }

  if(!user) return <section className="page-wrap mailbox-page"><div className="panel empty-state"><Mail size={34}/><h1>Hộp thư</h1><p>Đăng nhập Discord để xem thư và nhận phần thưởng của tài khoản.</p></div></section>;
  return <section className="page-wrap mailbox-page">
    <div className="page-heading"><div><span className="eyebrow">Corgi-Bot Account Center</span><h1><Inbox size={30}/> Hộp thư</h1><p>Thư hệ thống và phần thưởng chỉ được xem/nhận trên website.</p></div><button className="btn secondary" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?' Đang tải...':' Làm mới'}</button></div>
    <div className="mail-stats"><div className="panel"><strong>{mails.length}</strong><span>Tổng thư</span></div><div className="panel"><strong>{unread}</strong><span>Chưa đọc</span></div><div className="panel"><strong>{claimable}</strong><span>Có quà chưa nhận</span></div><button className="btn primary" disabled={!claimable||busy==='all'||!botApiConfigured} onClick={claimAll}><CheckCheck size={17}/> Nhận tất cả</button></div>
    {!botApiConfigured&&<div className="notice warning">Mailbox UI đã sẵn sàng. Cần cấu hình VITE_CORGI_API_URL và API mailbox để đồng bộ dữ liệu thật.</div>}
    {error&&<div className="notice danger">{error}</div>}
    <div className="mail-list">
      {!loading&&!mails.length&&<div className="panel empty-state"><Inbox size={40}/><h2>Chưa có thư</h2><p>Khi hệ thống hoặc Developer gửi thư, nội dung sẽ xuất hiện tại đây.</p></div>}
      {mails.map((m,idx)=>{const id=m.id||m._id||String(idx); const read=Boolean(m.readAt||m.read); const claimed=Boolean(m.claimedAt||m.claimed); const reward=m.reward||m.rewards||m.attachments; return <article key={id} className={`panel mail-card ${read?'':'unread'}`}>
        <div className="mail-card-head"><div><span className="mail-sender">{m.senderName||m.sender||'Corgi-Bot'}</span><h2>{m.title||'Thông báo hệ thống'}</h2></div><span className="mail-date">{fmtDate(m.createdAt||m.created_at)}</span></div>
        <p className="mail-body">{m.content||m.message||m.body||'—'}</p>
        {reward&&<div className="mail-reward"><Gift size={18}/><div><strong>Phần thưởng đính kèm</strong><span>{rewardText(reward)}</span></div></div>}
        <div className="mail-actions">{!read&&<button className="btn secondary" disabled={busy===`read:${id}`} onClick={()=>readMail(id)}>Đánh dấu đã đọc</button>}{reward&&!claimed&&<button className="btn primary" disabled={busy===`claim:${id}`} onClick={()=>claim(id)}><Gift size={16}/> Nhận thưởng</button>}{claimed&&<span className="claimed"><CheckCheck size={16}/> Đã nhận</span>}</div>
      </article>})}
    </div>
  </section>;
}
