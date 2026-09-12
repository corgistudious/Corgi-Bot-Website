import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { formatDate } from '../lib/community';

export default function News(){
  const [items,setItems]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('');
  useEffect(()=>{(async()=>{ if(!supabaseConfigured){setError('Supabase chưa được cấu hình.');setLoading(false);return;} const {data,error}=await supabase.from('articles').select('*').eq('status','published').order('published_at',{ascending:false}); if(error)setError(error.message); else setItems(data||[]); setLoading(false); })();},[]);
  return <section className="section page-section"><div className="page-hero compact"><div className="eyebrow"><Newspaper size={15}/> NEWSROOM</div><h1>Tin tức & cập nhật</h1><p className="muted lead">Nội dung chính thức được quản lý trực tiếp từ hệ thống Corgi-Bot Community.</p></div>
    {loading?<p className="muted">Đang tải tin tức…</p>:error?<div className="notice error">{error}</div>:items.length===0?<div className="empty-state">Chưa có bài viết công khai.</div>:<div className="news-grid">{items.map((item,i)=><article className={`news-card ${i===0?'featured':''}`} key={item.id}><div className="news-meta"><span>{item.tag}</span><time>{formatDate(item.published_at||item.created_at)}</time></div><h2>{item.title}</h2><p>{item.excerpt}</p><div className="content-stats"><span>{item.views||0} lượt xem</span></div><Link to={`/news/${item.slug}`} className="text-link">Đọc bài viết <ArrowRight size={15}/></Link></article>)}</div>}
  </section>;
}
