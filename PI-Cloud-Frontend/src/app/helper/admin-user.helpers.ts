import { AdminUser } from '../models/admin-user.model';

export function initials(u: AdminUser): string {
  const f = u.firstName?.[0] || '?';
  const l = u.lastName?.[0]  || '';
  return (f + l).toUpperCase();
}

export function statusColor(s: string): string {
  return s === 'ACTIVE' ? '#7a9e7e' : s === 'BANNED' ? '#c96a3f' : '#b5a06e';
}

export function roleBg(role: string | null): string {
  if (role === 'STUDENT')    return '#eef3ff';
  if (role === 'DIETITIAN')  return '#fff3ee';
  if (role === 'RESTAURANT') return '#f0f7f1';
  return '#f5f0eb';
}

export function roleColor(role: string | null): string {
  if (role === 'STUDENT')    return '#5b6abf';
  if (role === 'DIETITIAN')  return '#c96a3f';
  if (role === 'RESTAURANT') return '#4a7c59';
  return '#8a7e78';
}

export function avatarBg(role: string | null): string {
  if (role === 'STUDENT')    return '#dde2f8';
  if (role === 'DIETITIAN')  return '#fde8d8';
  if (role === 'RESTAURANT') return '#d8ede0';
  return '#ede8e3';
}

// Derive display status from enabled field
export function deriveStatus(u: AdminUser): 'ACTIVE' | 'BANNED' | 'PENDING' {
  if (u.status) return u.status; // if manually overridden locally
  if (!u.enabled) return 'BANNED';
  if (!u.profileCompleted) return 'PENDING';
  return 'ACTIVE';
}

export function formatAddress(u: AdminUser): string {
  if (!u.address) return '—';
  const { street, city, country } = u.address;
  return [street, city, country].filter(Boolean).join(', ');
}