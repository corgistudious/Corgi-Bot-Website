import {useEffect,useMemo,useState} from 'react';
import {Search,ShoppingBag,Tag,Upload,Image as ImageIcon,PanelTop} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {botApi,botApiConfigured} from '../lib/botApi';
import {ErrorState} from '../components/ApiState';
import AdSlot from '../components/AdSlot';
import {useI18n} from '../i18n/index.jsx';
import {compactNumber,parseCompactNumber} from '../lib/numberFormat';
import {uploadImage} from '../lib/assetUpload';

const CREATOR_TYPES=['FRAME','BACKGROUND','TITLE'];
const uploadTypes=new Set(['FRAME','BACKGROUND']);
const typeMeta={
 FRAME:{vi:'Khung Avatar',en:'Avatar Frame',icon:ImageIcon},
 BACKGROUND:{vi:'Nền Profile',en:'Profile Background',icon:PanelTop},
 TITLE:{vi:'Danh hiệu',en:'Title',icon:Tag},
};
function typeName(type,locale){return typeMeta[type]?.[locale==='vi'?'vi':'en']||type}
function CosmeticPreview({item={},preview=''}){
 const type=String(item.type||'COSMETIC').toUpperCase(),value=preview||String(item.value||'').trim();
 const cls=`cosmetic-preview cosmetic-${type.toLowerCase()}`;
 if(type==='FRAME')return <div className={cls}><div className="cosmetic-avatar"><span>C</span></div>{value?<img className="cosmetic-frame-img" src={value} alt=""/>:<div className="cosmetic-frame-fallback"/>}</div>;
 if(type==='BACKGROUND')return <div className={cls} style={value?{backgroundImage:`linear-gradient(180deg,transparent,rgba(8,5,2,.72)),url(${value})`}:{}}><div className="cosmetic-profile-sample"><i/><span>{item.name||'Profile'}</span></div></div>;
 if(type==='TITLE')return <div className={cls}><div className="title-profile-demo"><b>I’m Thịnh</b><span className="title-preview">{value||'✨ Master Creator'}</span><small>{item.name||'Title preview'}</small></div></div>;
 return <div className={cls}><ShoppingBag/></div>;
}
const copy={
 vi:{title:'Creator Marketplace',desc:'Marketplace dành cho sản phẩm Creator thực sự: Khung Avatar, Nền Profile và Danh hiệu.',search:'Tìm cosmetic hoặc collection…',empty:'Chưa có sản phẩm Creator đang bán.',create:'Creator Studio',type:'Chọn loại sản phẩm',name:'Tên cosmetic',collection:'Tên collection',creator:'Tên Creator',asset:'Chọn ảnh từ thiết bị',price:'Giá bán (CXu)',priceHelp:'Có thể nhập 2500000 hoặc 2.5M',submit:'Gửi kiểm duyệt',sending:'Đang tải lên & gửi…',buy:'Mua ngay',buying:'Đang xử lý…',login:'Đăng nhập để mua',sent:'Đã gửi cosmetic cho Reviewer kiểm duyệt.',bought:'Mua thành công. Cosmetic đã vào Inventory.',listing:'sản phẩm',guide:'Chuẩn thiết kế Cosmetic',guideDesc:'Creator Studio chỉ còn các loại có thể tạo thành sản phẩm riêng biệt để bán.',backgroundHelp:'Ảnh dọc 9:16. Profile Bot render 900 × 1600 px; khuyên dùng đúng 900 × 1600 hoặc ảnh 9:16 độ phân giải cao.',frameHelp:'Khung Avatar dạng tròn, PNG/WebP nền trong suốt. Thiết kế vòng khung bao quanh avatar và giữ phần tâm thoáng để không che ảnh đại diện.',titleHelp:'Danh hiệu là dòng chữ nằm dưới tên người dùng trên Profile. Creator đặt nội dung danh hiệu và gửi kiểm duyệt như một sản phẩm Market.',fileSpec:'Ảnh PNG · JPG · WebP · GIF • tối đa 8 MB',preview:'Preview trực tiếp',titleText:'Nội dung danh hiệu',choose:'Chọn',freeNote:'Màu chủ đạo và Bảng tên đã chuyển sang Profile Web để mỗi người tự tùy chỉnh miễn phí.'},
 en:{title:'Creator Marketplace',desc:'A marketplace for genuine creator products: Avatar Frames, Profile Backgrounds, and Titles.',search:'Search cosmetics or collections…',empty:'No creator products are on sale yet.',create:'Creator Studio',type:'Choose product type',name:'Cosmetic name',collection:'Collection name',creator:'Creator name',asset:'Choose image from device',price:'Price (CXu)',priceHelp:'You can enter 2500000 or 2.5M',submit:'Submit for review',sending:'Uploading & submitting…',buy:'Buy now',buying:'Processing…',login:'Log in to buy',sent:'Cosmetic submitted for Reviewer approval.',bought:'Purchase complete. Cosmetic added to Inventory.',listing:'items',guide:'Cosmetic design specs',guideDesc:'Creator Studio now contains only types that can become distinct products for sale.',backgroundHelp:'Portrait 9:16 image. Bot Profile renders at 900 × 1600 px; use 900 × 1600 or a high-resolution 9:16 image.',frameHelp:'Circular Avatar Frame with a transparent PNG/WebP background. Design the ring around the avatar and keep the center clear.',titleHelp:'A Title is the text shown below the username on Profile. Creators define the title and submit it as a Market product.',fileSpec:'PNG · JPG · WebP · GIF • max 8 MB',preview:'Live preview',titleText:'Title text',choose:'Choose',freeNote:'Accent Color and Nameplate have moved to Web Profile as free personal customization.'}
};
export default function Marketplace(){
 const {locale}=useI18n(),c=copy[locale]||copy.en,{user,session}=useAuth(),token=session?.access_token;
 const [items,setItems]=useState([]),[q,setQ]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[file,setFile]=useState(null),[preview,setPreview]=useState('');
 const [form,setForm]=useState({type:'FRAME',name:'',collectionName:'',creatorName:'',value:'',price:''});
 async function load(){setError('');try{setItems((await botApi.marketplace())?.items||[])}catch(e){setError(e)}}
 useEffect(()=>{if(botApiConfigured)load()},[]);useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
 const filtered=useMemo(()=>items.filter(x=>CREATOR_TYPES.includes(String(x.cosmetic?.type||'').toUpperCase())).filter(x=>`${x.cosmetic?.name||''} ${x.cosmetic?.collectionName||''} ${x.cosmetic?.creatorName||''}`.toLowerCase().includes(q.toLowerCase())),[items,q]);
 function chooseFile(e){const f=e.target.files?.[0]||null;setFile(f);if(preview)URL.revokeObjectURL(preview);setPreview(f?URL.createObjectURL(f):'')}
 function changeType(type){setForm(v=>({...v,type,value:''}));setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setNotice('')}
 async function buy(id){if(!token)return;setBusy(id);setNotice('');try{await botApi.marketplaceBuy(id,token);setNotice(c.bought);await load()}catch(e){setNotice(`❌ ${e.message}`)}finally{setBusy('')}}
 async function submit(e){e.preventDefault();const price=parseCompactNumber(form.price);if(!Number.isFinite(price)||price<1){setNotice('❌ INVALID_PRICE');return}setBusy('submit');setNotice('');try{let value=form.value;if(uploadTypes.has(form.type))value=await uploadImage(file,'cosmetics');await botApi.creatorSubmit({...form,value,price},token);setForm({type:'FRAME',name:'',collectionName:'',creatorName:'',value:'',price:''});setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setNotice(c.sent)}catch(e2){setNotice(`❌ ${e2.message}`)}finally{setBusy('')}}
 const helper={FRAME:c.frameHelp,BACKGROUND:c.backgroundHelp,TITLE:c.titleHelp}[form.type];
 if(!botApiConfigured)return <section className="section page-section"><ErrorState error="VITE_CORGI_API_URL is not configured."/></section>;
 return <section className="section page-section"><div className="section-heading"><span>GLOBAL CREATOR MARKET</span><h1>{c.title}</h1><p>{c.desc}</p></div><AdSlot placement="MARKETPLACE"/>
 <div className="market-free-note"><b>PROFILE CUSTOMIZATION</b><span>{c.freeNote}</span><Link to="/profile">{locale==='vi'?'Mở Profile →':'Open Profile →'}</Link></div>
 <div className="market-toolbar"><div className="search-box"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={c.search}/></div><span>{filtered.length} {c.listing}</span></div>
 {error?<ErrorState error={error} onRetry={load}/>:!filtered.length?<div className="empty-state">{c.empty}</div>:<div className="market-grid">{filtered.map(row=>{const item=row.cosmetic||{};return <article className="market-card" key={row._id}><CosmeticPreview item={item}/><span className="eyebrow">{typeName(item.type,locale)}{item.collectionName?` • ${item.collectionName}`:''}</span><h3>{item.name||'Cosmetic'}</h3>{item.creatorName&&<p>by {item.creatorName}</p>}<div className="market-price"><Tag size={15}/>{compactNumber(row.price)} CXu</div>{user?<button disabled={busy===row._id} className="btn primary" onClick={()=>buy(row._id)}>{busy===row._id?c.buying:c.buy}</button>:<Link className="btn secondary" to="/login">{c.login}</Link>}</article>})}</div>}
 <div className="market-guide"><div className="market-guide-head"><div><span className="eyebrow">CREATOR SPECS</span><h2>{c.guide}</h2><p>{c.guideDesc}</p></div></div><div className="market-guide-grid cosmetic-guide-three">{CREATOR_TYPES.map(type=>{const Icon=typeMeta[type].icon;const help={FRAME:c.frameHelp,BACKGROUND:c.backgroundHelp,TITLE:c.titleHelp}[type];return <article className="market-example" key={type}><div className="cosmetic-guide-icon"><Icon/></div><b>{typeName(type,locale)}</b><small>{help}</small></article>})}</div><div className="market-specs"><span>{c.fileSpec}</span><span>Background: 900 × 1600 • 9:16</span><span>{locale==='vi'?'Frame: khung tròn • nền trong suốt':'Frame: circular • transparent'}</span><span>{c.preview}</span></div></div>
 {user&&<form className="panel-form market-sell creator-studio" onSubmit={submit}><div className="creator-pro-head"><div><div className="eyebrow">CREATOR STUDIO</div><h2>{c.create}</h2><p>{locale==='vi'?'Tạo sản phẩm • Preview • Gửi duyệt • Bán trên Market':'Create • Preview • Submit • Sell on Market'}</p></div></div><div className="creator-type-section"><b>{c.type}</b><div className="creator-type-grid creator-type-grid-three">{CREATOR_TYPES.map(type=>{const Icon=typeMeta[type].icon;return <button type="button" key={type} className={`creator-type-card ${form.type===type?'selected':''}`} onClick={()=>changeType(type)}><Icon size={20}/><span>{typeName(type,locale)}</span></button>})}</div></div>
 <div className="creator-workspace"><div className="creator-fields"><div className="creator-current"><b>{typeName(form.type,locale)}</b><p>{helper}</p></div><label>{c.name}<input required maxLength="80" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>{c.collection}<input maxLength="80" value={form.collectionName} onChange={e=>setForm({...form,collectionName:e.target.value})}/></label><label>{c.creator}<input required maxLength="80" value={form.creatorName} onChange={e=>setForm({...form,creatorName:e.target.value})}/></label>
 {uploadTypes.has(form.type)&&<label className="file-upload"><span>{c.asset}</span><input required type="file" accept={form.type==='FRAME'?'image/png,image/webp':'image/png,image/jpeg,image/webp,image/gif'} onChange={chooseFile}/><span className="btn secondary"><Upload size={16}/> {file?.name||c.choose}</span><small className="field-help">{helper}</small></label>}
 {form.type==='TITLE'&&<div className="editor-box"><label>{c.titleText}<input required maxLength="32" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="✨ Master Creator"/></label></div>}
 <label>{c.price}<input required inputMode="decimal" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="2.5M"/><small className="field-help">{c.priceHelp}</small></label></div>
 <aside className="creator-preview-panel"><span className="eyebrow">{c.preview}</span><CosmeticPreview item={form} preview={preview}/><small>{helper}</small></aside></div>
 <button disabled={busy==='submit'||(uploadTypes.has(form.type)&&!file)} className="btn primary creator-submit">{busy==='submit'?c.sending:c.submit}</button>{notice&&<div className="notice">{notice}</div>}</form>}
 </section>;
}
