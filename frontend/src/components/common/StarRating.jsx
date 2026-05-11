import { Star } from 'lucide-react';
import clsx from 'clsx';

export function StarDisplay({ rating, size = 'sm', showNumber = false }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={clsx(sizes[size], s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
      ))}
      {showNumber && <span className="text-sm text-slate-600 ml-1">{parseFloat(rating).toFixed(1)}</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="transition-transform hover:scale-110 active:scale-95">
          <Star className={clsx('w-7 h-7', s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
        </button>
      ))}
    </div>
  );
}
