import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date, fmt = 'MMM dd, yyyy') =>
  date ? format(new Date(date), fmt) : '';

export const timeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

export const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const formatPrice = (price, currency = 'USD') => {
  if (price === 0 || price === '0') return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
};

export const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-yellow-600';
  return 'text-red-600';
};

export const getLevelBadge = (level) => {
  const map = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
    all: 'bg-blue-100 text-blue-700',
  };
  return map[level] || 'bg-slate-100 text-slate-700';
};

export const getStatusBadge = (status) => {
  const map = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export const truncate = (str, len = 100) =>
  str && str.length > len ? str.slice(0, len) + '...' : str;

export const getInitials = (name) =>
  name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

export const Stars = ({ rating, size = 'sm' }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return Array.from({ length: 5 }, (_, i) => ({
    filled: i < Math.floor(rating),
    half: i === Math.floor(rating) && rating % 1 >= 0.5,
  }));
};
