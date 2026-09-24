import { supabase, supabaseConfigured } from './supabase';
const BUCKET=import.meta.env.VITE_SUPABASE_ASSET_BUCKET||'community-assets';
const MAX_BYTES=8*1024*1024;
const allowed=new Set(['image/png','image/jpeg','image/webp','image/gif']);
export async function uploadImage(file,folder='uploads'){
 if(!supabaseConfigured||!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');
 if(!file)throw new Error('IMAGE_REQUIRED');
 if(!allowed.has(file.type))throw new Error('IMAGE_TYPE_NOT_ALLOWED');
 if(file.size>MAX_BYTES)throw new Error('IMAGE_TOO_LARGE_MAX_8MB');
 const ext=(file.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'');
 const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('LOGIN_REQUIRED');
 const path=`${folder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
 const {error}=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
 if(error)throw error;
 const {data}=supabase.storage.from(BUCKET).getPublicUrl(path);
 if(!data?.publicUrl)throw new Error('ASSET_URL_FAILED');
 return data.publicUrl;
}
