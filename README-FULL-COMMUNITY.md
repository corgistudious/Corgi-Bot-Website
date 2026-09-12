# Corgi-Bot Web V4 — Full Community

Bản này dùng backend Supabase thật. Không còn localStorage cho diễn đàn/tin tức/support.

## Đã triển khai

- Discord OAuth + profile
- News từ Supabase
- Like + comment thật
- Forum topic/reply thật, views, pinned/locked moderation
- Support ticket + private message thread
- Commands directory từ database
- Profile stats
- Admin/Moderator Control Panel
- Moderator: forum + ticket status
- Admin: moderator features + news + command directory
- Developer: admin features + đổi role member/moderator/admin/developer
- RLS + role helpers + RPC counters
- Cloudflare Pages SPA redirects

## Cài backend (bắt buộc 1 lần)

1. Supabase SQL Editor: chạy **một lần** file `supabase/000_FULL_SETUP.sql`.
2. Authentication -> Providers -> Discord: bật Discord OAuth.
3. Authentication -> URL Configuration:
   - Site URL: URL production của web.
   - Redirect URL: `https://YOUR_DOMAIN/**`
4. Cấu hình biến môi trường từ `.env.example`.

## Cấp Developer đầu tiên

Sau khi tài khoản Developer đã đăng nhập ít nhất 1 lần, chạy trong Supabase SQL Editor (thay UUID thật):

```sql
update public.profiles
set role = 'developer', updated_at = now()
where id = 'YOUR_PROFILE_UUID';
```

Có thể tìm UUID bằng:

```sql
select id, display_name, discord_id, role from public.profiles order by created_at desc;
```

Sau khi có Developer, role có thể quản lý từ `/admin`.

## Build

```bash
npm install
npm run build
```

Cloudflare Pages:
- Build command: `npm run build`
- Output: `dist`
- Production branch: `main`

## Lưu ý bảo mật

Frontend chỉ dùng Supabase Publishable/Anon key. Không đưa `service_role`, Discord Bot Token, MongoDB URI hoặc secret key vào `VITE_*`.
.
