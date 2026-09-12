import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, MessageCircle, Pin, Plus, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate, profileMap } from '../lib/community';

export default function Forum(){
  const {user}=useAuth(); const nav=useNavigate();
  const [topics,setTopics]=useState([]),[authors,setAuthors]=useState({}),[query,setQuery]=useState(''),[open,setOpen]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [form,setForm]=useState({title:'',body:'',category:'Thảo luận chung'});
  async function load(){ const {data,error}=await supabase.from('forum_topics').select('*, forum_replies(count)').order('pinned',{ascending:false}).order('created_at',{ascending:false}); if(error)setError(error.message); else {setTopics(data||[]);setAuthors(await profileMap((data||[]).map(x=>x.author_id)));} setLoading(false); }
  useEffect(()=>{if(supabase)load();},[]);
  const filtered=useMemo(()=>topics.filter(t=>`${t.title} ${t.category} ${authors[t.author_id]?.display_name||''}`.toLowerCase().includes(query.toLowerCase())),[topics,authors,query]);
  async function createTopic(e){e.preventDefault();if(!user){nav('/login');return;} if(!form.title.trim()||!form.body.trim())return; const {data,error}=await supabase.from('forum_topics').insert({author_id:user.id,category:form.category,title:form.title.trim(),body:form.body.trim()}).select('id').single(); if(!error){setOpen(false);nav(`/forum/${data.id}`);} else setError(error.message);}
  return <section className="section page-section"><div className="forum-head"><div><div className="eyebrow"><MessageCircle size={15}/> COMMUNITY FORUM</div><h1>Diễn đàn thảo luận</h1><p className="muted lead">Chủ đề và trả lời được lưu thật trong Supabase, đồng bộ cho toàn bộ cộng đồng.</p></div><button className="btn primary" onClick={()=>user?setOpen(true):nav('/login')}><Plus size={17}/> Tạo chủ đề</button></div>
    <div className="forum-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm chủ đề..."/></div><span>{filtered.length} chủ đề</span></div>
    {error&&<div className="notice error">{error}</div>}{loading?<p className="muted">Đang tải diễn đàn…</p>:<div className="topic-list">{filtered.map(t=><Link className="topic-row" to={`/forum/${t.id}`} key={t.id}><div className="topic-icon"><MessageCircle size={20}/></div><div className="topic-main"><div className="topic-flags"><span className="topic-category">{t.category}</span>{t.pinned&&<span><Pin size={12}/> Ghim</span>}{t.locked&&<span><Lock size={12}/> Khóa</span>}</div><h3>{t.title}</h3><p>{authors[t.author_id]?.display_name||'Corgi Member'} · {formatDate(t.created_at)}</p></div><div className="topic-stats"><b>{t.forum_replies?.[0]?.count||0}</b><span>trả lời</span></div><div className="topic-stats"><b>{t.views||0}</b><span>lượt xem</span></div></Link>)}</div>}
    {open&&<div className="modal-backdrop" onMouseDown={()=>setOpen(false)}><form className="forum-modal" onSubmit={createTopic} onMouseDown={e=>e.stopPropagation()}><button className="modal-close" type="button" onClick={()=>setOpen(false)}><X/></button><span className="eyebrow">NEW TOPIC</span><h2>Tạo chủ đề mới</h2><label>Danh mục<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Thảo luận chung</option><option>Góp ý</option><option>Hướng dẫn</option><option>Báo lỗi</option></select></label><label>Tiêu đề<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} maxLength={180}/></label><label>Nội dung<textarea rows="7" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} maxLength={10000}/></label><button className="btn primary">Đăng chủ đề</button></form></div>}
  </section>;
}
