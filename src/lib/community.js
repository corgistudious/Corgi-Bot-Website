import { supabase } from './supabase';

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function slugify(input='') {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,120);
}

export async function profileMap(ids=[]) {
  if (!supabase) return {};
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase.from('public_profiles').select('id,display_name,username,avatar_url,role').in('id', unique);
  if (error) throw error;
  return Object.fromEntries((data || []).map(p => [p.id, p]));
}

export function roleAtLeast(role, need='moderator') {
  const rank = { member:0, moderator:1, admin:2, developer:3 };
  return (rank[role] ?? 0) >= (rank[need] ?? 99);
}
