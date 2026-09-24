import { useEffect, useState } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { botApi, botApiConfigured } from '../lib/botApi';
export default function AdSlot({placement='HOME'}){
 const [ad,setAd]=useState(null);
 useEffect(()=>{let live=true;if(!botApiConfigured)return;botApi.ads(placement).then(r=>{const row=r?.items?.[0]||null;if(live)setAd(row);if(row?._id)botApi.adImpression(row._id).catch(()=>{});}).catch(()=>{});return()=>{live=false}},[placement]);
 if(!ad)return null;
 return <aside className="ad-slot"><div className="ad-label"><Megaphone size={13}/> Sponsored • {placement.replaceAll('_',' ')}</div><a href={botApi.clickUrl(ad._id)} target="_blank" rel="noopener noreferrer sponsored">{ad.imageUrl&&<img src={ad.imageUrl} alt="" loading="lazy"/>}<div><b>{ad.title}</b>{ad.description&&<p>{ad.description}</p>}<span>Visit advertiser <ExternalLink size={13}/></span></div></a></aside>
}
