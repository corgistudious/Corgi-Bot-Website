import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Pin, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate, profileMap, roleAtLeast } from '../lib/community';
import Avatar from '../components/Avatar';

export default function ForumTopic(){
  const {id}=useParams(); const {user,profile}=useAuth();
  const [topic,setTopic]=useState(null),[replies,setReplies]=useState([]),[profiles,setProfiles]=useState({}),[body,setBody]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
  async function load(){ const {data:t,error:e}=await supabase.from('forum_topics').select('*').eq('id',id).maybeSingle(); if(e||!t){setError(e?.message||'Không tìm thấy chủ đề.');setLoading(false);return;} const {data:r}=await supabase.from('forum_replies').select('*').eq('topic_id',id).order('created_at'); setTopic(t);setReplies(r||[]);setProfiles(await profileMap([t.author_id,...(r||[]).map(x=>x.author_id)]));setLoading(false);await supabase.rpc('increment_topic_view',{p_topic_id:id}); }
  useEffect(()=>{if(supabase)load();},[id]);
  async function submit(e){e.preventDefault();if(!user||!body.trim()||topic.locked)return;const {data,error}=await supabase.from('forum_replies').insert({topic_id:id,author_id:user.id,body:body.trim()}).select('*').single();if(!error){setReplies(v=>[...v,data]);setProfiles(v=>({...v,[user.id]:profile}));setBody('');}}
  async function removeReply(replyId){await supabase.from('forum_replies').delete().eq('id',replyId);setReplies(v=>v.filter(x=>x.id!==replyId));}
  async function removeTopic(){if(!confirm('Xóa chủ đề này?'))return;await supabase.from('forum_topics').delete().eq('id',id);window.location.href='/forum';}
  const staff=roleAtLeast(profile?.role,'admin');
  if(loading)return <section className="section article-page"><p className="muted">Đang tải chủ đề…</p></section>;
  if(error)return <section className="section article-page"><h1>{error}</h1><Link className="text-link" to="/forum">← Quay lại diễn đàn</Link></section>;
  return <section className="section article-page forum-topic-page"><Link className="back-link" to="/forum"><ArrowLeft size={16}/> Diễn đàn</Link><div className="topic-flags"><span className="topic-category">{topic.category}</span>{topic.pinned&&<span><Pin size={12}/> Ghim</span>}{topic.locked&&<span><Lock size={12}/> Đã khóa</span>}</div><h1>{topic.title}</h1><p className="topic-author">Đăng bởi <b>{profiles[topic.author_id]?.display_name||'Corgi Member'}</b> · {formatDate(topic.created_at)} · {topic.views||0} lượt xem</p>
    <article className="forum-post"><Avatar profile={profiles[topic.author_id]} size={48}/><div className="forum-post-main"><strong>{profiles[topic.author_id]?.display_name||'Corgi Member'}</strong><p>{topic.body}</p>{(topic.author_id===user?.id||staff)&&<button className="plain-danger" onClick={removeTopic}><Trash2 size={14}/> Xóa chủ đề</button>}</div></article>
    <div className="reply-list">{replies.map(r=><article className="forum-post" key={r.id}><Avatar profile={profiles[r.author_id]} size={44}/><div className="forum-post-main"><div className="comment-head"><strong>{profiles[r.author_id]?.display_name||'Corgi Member'}</strong><span>{formatDate(r.created_at)}</span>{(r.author_id===user?.id||staff)&&<button className="plain-danger" onClick={()=>removeReply(r.id)}><Trash2 size={14}/></button>}</div><p>{r.body}</p></div></article>)}</div>
    {topic.locked?<div className="empty-replies"><Lock size={28}/><h3>Chủ đề đã khóa</h3><p>Không thể gửi trả lời mới.</p></div>:user?<form className="reply-form forum-reply-form" onSubmit={submit}><textarea rows="5" value={body} onChange={e=>setBody(e.target.value)} placeholder="Viết trả lời…" maxLength={5000}/><button className="btn primary"><Send size={16}/> Trả lời</button></form>:<div className="empty-replies"><h3>Tham gia thảo luận</h3><p><Link className="text-link" to="/login">Đăng nhập Discord</Link> để trả lời.</p></div>}
  </section>;
}
