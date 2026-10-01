import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {useI18n} from '../i18n';

const BASE=[
['/ai','System','AI assistant chat'],['/giveaway','Community','Create and manage giveaways'],['/poll','Community','Create community polls'],['/dev','Developer','Developer Control Panel'],
['/balance','Economy','View your balance'],['/daily','Economy','Claim daily rewards'],['/leaderboard','Economy','View leaderboards'],['/transfer','Economy','Transfer resources'],
['/game','Game Hub','Open Game Hub — Pet Hunt, Startup, Fishing and mini-games'],['/lieng','Game Hub','Play Liêng'],['/lottery','Game Hub','Lottery game'],['/poker','Game Hub','Play Poker'],['/spin','Game Hub','Spin Wheel'],
['/ban','Moderation','Ban a member'],['/clear','Moderation','Clear messages'],['/kick','Moderation','Kick a member'],['/mute','Moderation','Mute a member'],['/unban','Moderation','Unban a member'],['/unmute','Moderation','Unmute a member'],['/warn','Moderation','Warn a member'],['/warnings','Moderation','View member warnings'],
['/premium','Premium','View Premium benefits'],['/redeem','Premium','Redeem a gift code','/redeem <code>'],['/customize','Profile','Customize your profile'],['/missions','Profile','View missions'],['/profile','Profile','View your profile'],['/ranking','Profile','View rankings'],['/prefix','System','Configure or view prefix'],['/help','System','Open help and feature guide']
].map((x,i)=>({id:`base-${i}`,name:x[0],group_name:x[1],description:x[2],usage:x[3]||x[0],sort_order:i+1}));

export default function Commands(){
 const {t}=useI18n(); const [remote,setRemote]=useState([]),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{if(!supabase){setLoading(false);return}const {data,error}=await supabase.from('bot_commands').select('*').eq('enabled',true).order('sort_order');if(error)setError(error.message);else setRemote(data||[]);setLoading(false)})()},[]);
 const commands=useMemo(()=>{const map=new Map(BASE.map(c=>[c.name,c]));for(const c of remote)map.set(c.name,{...map.get(c.name),...c});return [...map.values()].sort((a,b)=>(a.sort_order??999)-(b.sort_order??999))},[remote]);
 const filtered=useMemo(()=>commands.filter(c=>`${c.name} ${c.group_name} ${c.description}`.toLowerCase().includes(query.toLowerCase())),[commands,query]);
 const groups=Object.entries(filtered.reduce((a,c)=>{(a[c.group_name]??=[]).push(c);return a;},{}));
 return <section className="section page-section commands-page"><div className="section-heading"><span>COMMANDS</span><h1>{t('cmdTitle')}</h1><p>{t('cmdP')}</p></div><div className="forum-toolbar command-search"><div className="search-box"><Search size={17}/><input placeholder={t('search')} value={query} onChange={e=>setQuery(e.target.value)}/></div><span><b>{filtered.length}</b> {t('cmdCount')}</span></div>{loading&&<p className="muted">{t('loading')}</p>}{error&&<div className="notice command-note">Live command metadata unavailable — showing the complete built-in directory.</div>}<div className="command-grid">{groups.map(([name,list])=><article className="command-card" key={name}><h3>{name}</h3><div className="command-detail-list">{list.map(c=><div className="command-detail" key={c.id||c.name}><code>{c.name}</code><div><p>{c.description}</p>{c.usage&&<span>{c.usage}</span>}</div></div>)}</div></article>)}</div></section>;
}
