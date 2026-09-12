import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Commands(){
  const [commands,setCommands]=useState([]),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
  useEffect(()=>{(async()=>{const {data,error}=await supabase.from('bot_commands').select('*').eq('enabled',true).order('sort_order');if(error)setError(error.message);else setCommands(data||[]);setLoading(false);})();},[]);
  const filtered=useMemo(()=>commands.filter(c=>`${c.name} ${c.group_name} ${c.description}`.toLowerCase().includes(query.toLowerCase())),[commands,query]);
  const groups=Object.entries(filtered.reduce((a,c)=>{(a[c.group_name]??=[]).push(c);return a;},{}));
  return <section className="section page-section"><div className="section-heading"><span>COMMANDS</span><h1>Lệnh Corgi-Bot</h1><p>Danh sách này được quản lý trực tiếp từ backend, không còn hard-code trên giao diện.</p></div><div className="forum-toolbar command-search"><div className="search-box"><Search size={17}/><input placeholder="Tìm lệnh…" value={query} onChange={e=>setQuery(e.target.value)}/></div><span>{filtered.length} lệnh</span></div>{loading?<p className="muted">Đang tải lệnh…</p>:error?<div className="notice error">{error}</div>:<div className="command-grid">{groups.map(([name,list])=><article className="command-card" key={name}><h3>{name}</h3><div className="command-detail-list">{list.map(c=><div className="command-detail" key={c.id}><code>{c.name}</code><div><p>{c.description}</p>{c.usage&&<span>{c.usage}</span>}</div></div>)}</div></article>)}</div>}</section>;
}
