import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate, profileMap, roleAtLeast } from '../lib/community';
import Avatar from '../components/Avatar';

export default function NewsArticle(){
  const {slug}=useParams(); const {user,profile}=useAuth();
  const [article,setArticle]=useState(null),[comments,setComments]=useState([]),[profiles,setProfiles]=useState({}),[liked,setLiked]=useState(false),[likes,setLikes]=useState(0),[body,setBody]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
  async function load(){
    const {data:a,error:e}=await supabase.from('articles').select('*').eq('slug',slug).maybeSingle(); if(e||!a){setError(e?.message||'Không tìm thấy bài viết.');setLoading(false);return;} setArticle(a);
    await supabase.rpc('increment_article_view',{p_slug:slug});
    const [{data:c},{count},{data:mine}]=await Promise.all([
      supabase.from('article_comments').select('*').eq('article_id',a.id).order('created_at'),
      supabase.from('article_likes').select('*',{count:'exact',head:true}).eq('article_id',a.id),
      user?supabase.from('article_likes').select('article_id').eq('article_id',a.id).eq('user_id',user.id).maybeSingle():Promise.resolve({data:null})
    ]);
    setComments(c||[]); setLikes(count||0); setLiked(Boolean(mine));
    const map=await profileMap([a.author_id,...(c||[]).map(x=>x.user_id)]); setProfiles(map); setLoading(false);
  }
  useEffect(()=>{if(supabase) load();},[slug,user?.id]);
  async function toggleLike(){ if(!user)return; if(liked) await supabase.from('article_likes').delete().eq('article_id',article.id).eq('user_id',user.id); else await supabase.from('article_likes').insert({article_id:article.id,user_id:user.id}); setLiked(!liked); setLikes(v=>v+(liked?-1:1)); }
  async function submit(e){e.preventDefault(); if(!body.trim()||!user)return; const {data,error}=await supabase.from('article_comments').insert({article_id:article.id,user_id:user.id,body:body.trim()}).select('*').single(); if(!error){setComments(v=>[...v,data]);setProfiles(v=>({...v,[user.id]:profile}));setBody('');}}
  async function remove(id){await supabase.from('article_comments').delete().eq('id',id);setComments(v=>v.filter(x=>x.id!==id));}
  const canModerate=roleAtLeast(profile?.role,'moderator');
  if(loading)return <section className="section article-page"><p className="muted">Đang tải bài viết…</p></section>;
  if(error)return <section className="section article-page"><h1>{error}</h1><Link className="text-link" to="/news">← Quay lại Tin tức</Link></section>;
  return <section className="section article-page"><Link className="back-link" to="/news"><ArrowLeft size={16}/> Tin tức</Link><div className="news-meta"><span>{article.tag}</span><time>{formatDate(article.published_at||article.created_at)}</time></div><h1>{article.title}</h1><p className="article-lead">{article.excerpt}</p><div className="article-body">{article.content.split(/\n\n+/).map((p,i)=><p key={i}>{p}</p>)}</div>
    <div className="article-actions"><button className={`icon-btn ${liked?'active':''}`} onClick={toggleLike} disabled={!user}><Heart size={18}/>{likes} lượt thích</button><span><MessageCircle size={17}/>{comments.length} bình luận</span></div>
    <section className="comments-section"><h2>Bình luận</h2>{user?<form className="reply-form" onSubmit={submit}><textarea rows="3" value={body} onChange={e=>setBody(e.target.value)} placeholder="Viết bình luận…" maxLength={3000}/><button className="btn primary"><Send size={16}/> Gửi</button></form>:<p className="muted">Đăng nhập Discord để bình luận và thích bài viết.</p>}
    <div className="comment-list">{comments.map(c=><article className="comment" key={c.id}><Avatar profile={profiles[c.user_id]}/><div><div className="comment-head"><strong>{profiles[c.user_id]?.display_name||'Corgi Member'}</strong><span>{formatDate(c.created_at)}</span>{(c.user_id===user?.id||canModerate)&&<button className="plain-danger" onClick={()=>remove(c.id)}><Trash2 size={14}/></button>}</div><p>{c.body}</p></div></article>)}</div></section>
  </section>;
}
